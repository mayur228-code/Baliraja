import { useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { 
  X, 
  Save, 
  AlertCircle, 
  Loader2, 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  CheckCircle2,
  Package,
  RefreshCw
} from 'lucide-react';
import type { Product, Language, NavCategory } from '../../types';
import { ContentLanguageSelector } from '../components/ContentLanguageSelector';
import { TranslationReviewDrawer } from '../components/TranslationReviewDrawer';
import {
  translateText,
  translateMultiLineText,
  translateCommaSeparated
} from '../services/translationService';
import { uploadImageToServer } from '../services/uploadService';

interface ProductEditorModalProps {
  isOpen: boolean;
  lang: Language;
  product: Product | null; // null means create new
  categories?: NavCategory[];
  onClose: () => void;
  onSave: (product: Product) => void;
}

export const ProductEditorModal: FC<ProductEditorModalProps> = ({
  isOpen,
  lang,
  product,
  categories = [],
  onClose,
  onSave
}) => {
  const isEdit = Boolean(product);

  // Content entry language: Admin can choose to enter in English or Marathi
  const [contentLang, setContentLang] = useState<Language>(() => {
    if (product?.translationSource) return product.translationSource;
    return 'en';
  });

  // Auto-translate on save toggle (default ON)
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  // Loading states
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Track if admin manually modified the counterpart language
  const [isCounterpartOverridden, setIsCounterpartOverridden] = useState<boolean>(() => {
    return Boolean(product?.customTranslation);
  });

  const [formData, setFormData] = useState<Product>(() => {
    if (product) {
      return { ...product, isSample: false };
    }
    return {
      id: `prod-${Date.now()}`,
      slug: `product-${Date.now()}`,
      nameEnglish: '',
      nameMarathi: '',
      categoryId: 'fertilizers',
      subcategoryId: 'water-soluble',
      descriptionEnglish: '',
      descriptionMarathi: '',
      image: '/assets/categories/fertilizers.png',
      availability: 'available',
      featured: false,
      displayOrder: 10,
      isSample: false,
      suitableCropsEnglish: ['Soybean', 'Cotton', 'Vegetables'],
      suitableCropsMarathi: ['सोयाबीन', 'कापूस', 'भाजीपाला'],
      keyPointsEnglish: ['Agricultural consultation available', 'Genuine quality product'],
      keyPointsMarathi: ['कृषी सल्ला उपलब्ध', 'उत्कृष्ट दर्जाचे उत्पादन'],
      translationSource: 'en'
    };
  });

  // Independent Product-Specific Price State
  const [priceInput, setPriceInput] = useState<string>(() => {
    if (product?.price !== undefined && product?.price !== null && product?.price !== '') {
      return String(product.price);
    }
    return '';
  });

  // Image Upload / URL State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'url'>(() => {
    if (product?.image?.startsWith('data:image/')) return 'upload';
    if (product?.image?.startsWith('http://') || product?.image?.startsWith('https://')) return 'url';
    return 'upload';
  });
  const [deviceImageBase64, setDeviceImageBase64] = useState<string | null>(() => {
    return product?.image?.startsWith('data:image/') ? product.image : null;
  });
  const [urlInput, setUrlInput] = useState<string>(() => {
    if (product?.imageUrl) return product.imageUrl;
    if (product?.image && !product.image.startsWith('data:image/')) return product.image;
    return '';
  });
  const [urlImageStatus, setUrlImageStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');

  const [cropsEnInput, setCropsEnInput] = useState(() => (formData.suitableCropsEnglish || []).join(', '));
  const [cropsMrInput, setCropsMrInput] = useState(() => (formData.suitableCropsMarathi || []).join(', '));
  const [pointsEnInput, setPointsEnInput] = useState(() => (formData.keyPointsEnglish || []).join('\n'));
  const [pointsMrInput, setPointsMrInput] = useState(() => (formData.keyPointsMarathi || []).join('\n'));

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  if (!isOpen) return null;

  const categoryList = categories && categories.length > 0 ? categories : [];
  const currentCategory = categoryList.find((c) => c.id === formData.categoryId);
  const targetLang: Language = contentLang === 'en' ? 'mr' : 'en';

  const bothLanguagesReady = Boolean(
    formData.nameEnglish.trim() &&
    formData.nameMarathi.trim() &&
    formData.descriptionEnglish.trim() &&
    formData.descriptionMarathi.trim()
  );

  const handleCategoryChange = (catId: string) => {
    const found = categoryList.find((c) => c.id === catId);
    const firstSubcat = found?.subcategories?.[0]?.id;
    setFormData((prev) => ({
      ...prev,
      categoryId: catId,
      subcategoryId: firstSubcat
    }));
  };

  const handleDeviceFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError(
        lang === 'mr'
          ? 'कृपया वैध प्रतिमा फाईल निवडा (PNG, JPG, WebP, SVG).'
          : 'Please select a valid image file (PNG, JPG, WebP, SVG).'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError(
        lang === 'mr'
          ? 'प्रतिमेचा आकार १०MB पेक्षा कमी असावा.'
          : 'Image file size should be less than 10MB.'
      );
      return;
    }

    setIsUploadingImage(true);
    setValidationError(null);

    try {
      const uploadRes = await uploadImageToServer(file, 'prod');
      if (uploadRes.success && uploadRes.url) {
        setDeviceImageBase64(uploadRes.url);
        setImageSourceMode('upload');
        setFormData((prev) => ({ ...prev, image: uploadRes.url!, imageUrl: uploadRes.url }));
      } else {
        setValidationError(
          uploadRes.error || (lang === 'mr' ? 'प्रतिमा अपलोड अयशस्वी.' : 'Image upload failed.')
        );
      }
    } catch {
      setValidationError(lang === 'mr' ? 'प्रतिमा अपलोड करताना त्रुटी आली.' : 'Failed to upload image to server.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setImageSourceMode('url');
    if (!val.trim()) {
      setUrlImageStatus('idle');
      return;
    }

    const trimmed = val.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/assets/')) {
      setUrlImageStatus('testing');
      const img = new Image();
      img.onload = () => {
        setUrlImageStatus('valid');
        setFormData((prev) => ({ ...prev, image: trimmed, imageUrl: trimmed }));
        setValidationError(null);
      };
      img.onerror = () => {
        setUrlImageStatus('invalid');
      };
      img.src = trimmed;
    } else {
      setUrlImageStatus('invalid');
    }
  };

  // Immediate "Translate Now" preview action
  const handleManualTranslateNow = async () => {
    const sourceName = contentLang === 'en' ? formData.nameEnglish : formData.nameMarathi;
    const sourceDesc = contentLang === 'en' ? formData.descriptionEnglish : formData.descriptionMarathi;
    const sourceCrops = contentLang === 'en' ? cropsEnInput : cropsMrInput;
    const sourcePoints = contentLang === 'en' ? pointsEnInput : pointsMrInput;

    if (!sourceName.trim() && !sourceDesc.trim()) {
      setValidationError(
        lang === 'mr'
          ? 'भाषांतर करण्यासाठी प्रथम उत्पादनाचे नाव किंवा वर्णन प्रविष्ट करा.'
          : 'Please enter product name or description first to preview translation.'
      );
      return;
    }

    setValidationError(null);
    setIsTranslating(true);

    try {
      if (contentLang === 'en') {
        const [trName, trDesc, trCrops, trPoints] = await Promise.all([
          sourceName.trim() ? translateText(sourceName, 'en', 'mr') : Promise.resolve(''),
          sourceDesc.trim() ? translateText(sourceDesc, 'en', 'mr') : Promise.resolve(''),
          sourceCrops.trim() ? translateCommaSeparated(sourceCrops, 'en', 'mr') : Promise.resolve(''),
          sourcePoints.trim() ? translateMultiLineText(sourcePoints, 'en', 'mr') : Promise.resolve('')
        ]);

        setFormData((prev) => ({
          ...prev,
          nameMarathi: trName || prev.nameMarathi,
          descriptionMarathi: trDesc || prev.descriptionMarathi
        }));
        if (trCrops) setCropsMrInput(trCrops);
        if (trPoints) setPointsMrInput(trPoints);
      } else {
        const [trName, trDesc, trCrops, trPoints] = await Promise.all([
          sourceName.trim() ? translateText(sourceName, 'mr', 'en') : Promise.resolve(''),
          sourceDesc.trim() ? translateText(sourceDesc, 'mr', 'en') : Promise.resolve(''),
          sourceCrops.trim() ? translateCommaSeparated(sourceCrops, 'mr', 'en') : Promise.resolve(''),
          sourcePoints.trim() ? translateMultiLineText(sourcePoints, 'mr', 'en') : Promise.resolve('')
        ]);

        setFormData((prev) => ({
          ...prev,
          nameEnglish: trName || prev.nameEnglish,
          descriptionEnglish: trDesc || prev.descriptionEnglish
        }));
        if (trCrops) setCropsEnInput(trCrops);
        if (trPoints) setPointsEnInput(trPoints);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation service error';
      setValidationError(
        lang === 'mr'
          ? `भाषांतर त्रुटी: ${msg}`
          : `Translation error: ${msg}`
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Primary language field validations
    const primaryName = contentLang === 'en' ? formData.nameEnglish : formData.nameMarathi;
    const primaryDesc = contentLang === 'en' ? formData.descriptionEnglish : formData.descriptionMarathi;

    if (!primaryName.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'इंग्रजी नाव आवश्यक आहे.' : 'English product name is required.')
          : (lang === 'mr' ? 'मराठी नाव आवश्यक आहे.' : 'Marathi product name is required.')
      );
      return;
    }

    if (!primaryDesc.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'इंग्रजी वर्णन आवश्यक आहे.' : 'English description is required.')
          : (lang === 'mr' ? 'मराठी वर्णन आवश्यक आहे.' : 'Marathi description is required.')
      );
      return;
    }

    let finalNameEn = formData.nameEnglish;
    let finalNameMr = formData.nameMarathi;
    let finalDescEn = formData.descriptionEnglish;
    let finalDescMr = formData.descriptionMarathi;
    let finalCropsEnStr = cropsEnInput;
    let finalCropsMrStr = cropsMrInput;
    let finalPointsEnStr = pointsEnInput;
    let finalPointsMrStr = pointsMrInput;

    // Auto-translate counterpart if enabled and needed
    if (autoTranslate) {
      setIsSaving(true);
      setIsTranslating(true);

      try {
        if (contentLang === 'en') {
          if (!finalNameMr.trim() || !isCounterpartOverridden) {
            try {
              const res = await translateText(formData.nameEnglish, 'en', 'mr');
              if (res) finalNameMr = res;
            } catch {
              if (!finalNameMr.trim()) finalNameMr = formData.nameEnglish;
            }
          }
          if (!finalDescMr.trim() || !isCounterpartOverridden) {
            try {
              const res = await translateText(formData.descriptionEnglish, 'en', 'mr');
              if (res) finalDescMr = res;
            } catch {
              if (!finalDescMr.trim()) finalDescMr = formData.descriptionEnglish;
            }
          }
          if (cropsEnInput.trim() && (!finalCropsMrStr.trim() || !isCounterpartOverridden)) {
            try {
              const res = await translateCommaSeparated(cropsEnInput, 'en', 'mr');
              if (res) finalCropsMrStr = res;
            } catch {
              if (!finalCropsMrStr.trim()) finalCropsMrStr = cropsEnInput;
            }
          }
          if (pointsEnInput.trim() && (!finalPointsMrStr.trim() || !isCounterpartOverridden)) {
            try {
              const res = await translateMultiLineText(pointsEnInput, 'en', 'mr');
              if (res) finalPointsMrStr = res;
            } catch {
              if (!finalPointsMrStr.trim()) finalPointsMrStr = pointsEnInput;
            }
          }
        } else {
          if (!finalNameEn.trim() || !isCounterpartOverridden) {
            try {
              const res = await translateText(formData.nameMarathi, 'mr', 'en');
              if (res) finalNameEn = res;
            } catch {
              if (!finalNameEn.trim()) finalNameEn = formData.nameMarathi;
            }
          }
          if (!finalDescEn.trim() || !isCounterpartOverridden) {
            try {
              const res = await translateText(formData.descriptionMarathi, 'mr', 'en');
              if (res) finalDescEn = res;
            } catch {
              if (!finalDescEn.trim()) finalDescEn = formData.descriptionMarathi;
            }
          }
          if (cropsMrInput.trim() && (!finalCropsEnStr.trim() || !isCounterpartOverridden)) {
            try {
              const res = await translateCommaSeparated(cropsMrInput, 'mr', 'en');
              if (res) finalCropsEnStr = res;
            } catch {
              if (!finalCropsEnStr.trim()) finalCropsEnStr = cropsMrInput;
            }
          }
          if (pointsMrInput.trim() && (!finalPointsEnStr.trim() || !isCounterpartOverridden)) {
            try {
              const res = await translateMultiLineText(pointsMrInput, 'mr', 'en');
              if (res) finalPointsEnStr = res;
            } catch {
              if (!finalPointsEnStr.trim()) finalPointsEnStr = pointsMrInput;
            }
          }
        }
      } catch {
        // Non-fatal: preserve content
      } finally {
        setIsSaving(false);
        setIsTranslating(false);
      }
    } else {
      if (contentLang === 'en') {
        if (!finalNameMr.trim()) finalNameMr = formData.nameEnglish;
        if (!finalDescMr.trim()) finalDescMr = formData.descriptionEnglish;
        if (!finalCropsMrStr.trim()) finalCropsMrStr = cropsEnInput;
        if (!finalPointsMrStr.trim()) finalPointsMrStr = pointsEnInput;
      } else {
        if (!finalNameEn.trim()) finalNameEn = formData.nameMarathi;
        if (!finalDescEn.trim()) finalDescEn = formData.descriptionMarathi;
        if (!finalCropsEnStr.trim()) finalCropsEnStr = cropsMrInput;
        if (!finalPointsEnStr.trim()) finalPointsEnStr = pointsMrInput;
      }
    }

    if (!finalNameMr.trim()) finalNameMr = finalNameEn || formData.nameEnglish;
    if (!finalNameEn.trim()) finalNameEn = finalNameMr || formData.nameMarathi;
    if (!finalDescMr.trim()) finalDescMr = finalDescEn || formData.descriptionEnglish;
    if (!finalDescEn.trim()) finalDescEn = finalDescMr || formData.descriptionMarathi;

    const suitableCropsEn = finalCropsEnStr.split(',').map((s) => s.trim()).filter(Boolean);
    const suitableCropsMr = finalCropsMrStr.split(',').map((s) => s.trim()).filter(Boolean);
    const keyPointsEn = finalPointsEnStr.split('\n').map((s) => s.trim()).filter(Boolean);
    const keyPointsMr = finalPointsMrStr.split('\n').map((s) => s.trim()).filter(Boolean);

    const generatedSlug = formData.slug || finalNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let cleanPrice: number | string | undefined = undefined;
    if (priceInput.trim()) {
      const cleaned = priceInput.replace(/[^0-9.]/g, '');
      const num = Number(cleaned);
      cleanPrice = !isNaN(num) && cleaned.length > 0 ? num : priceInput.trim();
    }

    let finalImage = formData.image;
    let finalImageUrl: string | undefined = undefined;
    if (imageSourceMode === 'upload' && deviceImageBase64) {
      finalImage = deviceImageBase64;
    } else if (imageSourceMode === 'url' && urlInput.trim()) {
      finalImage = urlInput.trim();
      finalImageUrl = urlInput.trim();
    } else if (deviceImageBase64) {
      finalImage = deviceImageBase64;
    } else if (urlInput.trim()) {
      finalImage = urlInput.trim();
      finalImageUrl = urlInput.trim();
    }

    if (finalImage && finalImage.startsWith('data:image/')) {
      try {
        const up = await uploadImageToServer(finalImage, 'prod');
        if (up.success && up.url) {
          finalImage = up.url;
          if (finalImageUrl) finalImageUrl = up.url;
        }
      } catch {
        // preserve
      }
    }

    const finalId = isEdit && product ? product.id : (formData.id || `prod-${Date.now()}`);

    const updatedProduct: Product = {
      ...formData,
      id: finalId,
      slug: generatedSlug,
      nameEnglish: finalNameEn,
      nameMarathi: finalNameMr,
      descriptionEnglish: finalDescEn,
      descriptionMarathi: finalDescMr,
      price: cleanPrice,
      image: finalImage,
      imageUrl: finalImageUrl,
      suitableCropsEnglish: suitableCropsEn,
      suitableCropsMarathi: suitableCropsMr,
      keyPointsEnglish: keyPointsEn,
      keyPointsMarathi: keyPointsMr,
      translationSource: contentLang,
      customTranslation: isCounterpartOverridden,
      isSample: false
    };

    onSave(updatedProduct);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-stone-50/80 border-b border-stone-200/80 text-stone-900 flex items-center justify-between">
          <div>
            <h2 id="product-modal-title" className="text-base sm:text-lg font-bold font-serif flex items-center gap-2 leading-normal overflow-visible text-stone-900">
              <Package className="w-5 h-5 text-emerald-700" />
              <span>{isEdit 
                ? (lang === 'mr' ? 'उत्पादन तपशील संपादित करा' : 'Edit Product Record')
                : (lang === 'mr' ? 'नवीन उत्पादन जोडा' : 'Add New Product')
              }</span>
              {isEdit && (
                <span className="text-[10px] font-mono bg-emerald-50 px-2 py-0.5 rounded-full text-emerald-800 border border-emerald-200">
                  ID: {formData.id}
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed overflow-visible">
              {lang === 'mr'
                ? 'एका भाषेत माहिती भरा, दुसरी भाषा आपोआप तयार होईल.'
                : 'Enter in one language only. The counterpart is automatically generated on save.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/70 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{validationError}</span>
            </div>
          )}

          {/* Bilingual Entry Toolbar */}
          <ContentLanguageSelector
            contentLang={contentLang}
            onSelectContentLang={(newLang) => setContentLang(newLang)}
            autoTranslate={autoTranslate}
            onToggleAutoTranslate={(enabled) => setAutoTranslate(enabled)}
            isTranslating={isTranslating}
            onManualTranslateNow={handleManualTranslateNow}
            hasBothTranslations={bothLanguagesReady}
            adminLang={lang}
          />

          {/* Primary Language Input Section */}
          <div className="space-y-4 p-5 rounded-2xl bg-white border border-emerald-700/30 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>
                  {contentLang === 'en'
                    ? (lang === 'mr' ? 'इंग्रजी माहिती (मुख्य इनपुट)' : 'English Content (Primary Input)')
                    : (lang === 'mr' ? 'मराठी माहिती (मुख्य इनपुट)' : 'Marathi Content (Primary Input)')}
                </span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {contentLang === 'en' ? 'Active: English' : 'Active: मराठी'}
              </span>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {contentLang === 'en'
                  ? (lang === 'mr' ? 'उत्पादनाचे इंग्रजी नाव *' : 'Product Name (English) *')
                  : (lang === 'mr' ? 'उत्पादनाचे मराठी नाव *' : 'Product Name (Marathi) *')}
              </label>
              <input
                type="text"
                required
                value={contentLang === 'en' ? formData.nameEnglish : formData.nameMarathi}
                onChange={(e) => {
                  setValidationError(null);
                  const val = e.target.value;
                  if (contentLang === 'en') {
                    setFormData((prev) => ({ ...prev, nameEnglish: val }));
                  } else {
                    setFormData((prev) => ({ ...prev, nameMarathi: val }));
                  }
                }}
                placeholder={contentLang === 'en' ? 'e.g. Mahyco Cotton Seeds / Water-Soluble NPK 19:19:19' : 'उदा. मायको कापूस बियाणे / विद्राव्य खत १९:१९:१९'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {contentLang === 'en'
                  ? (lang === 'mr' ? 'इंग्रजी वर्णन *' : 'Description (English) *')
                  : (lang === 'mr' ? 'मराठी वर्णन *' : 'Description (Marathi) *')}
              </label>
              <textarea
                rows={3}
                required
                value={contentLang === 'en' ? formData.descriptionEnglish : formData.descriptionMarathi}
                onChange={(e) => {
                  setValidationError(null);
                  const val = e.target.value;
                  if (contentLang === 'en') {
                    setFormData((prev) => ({ ...prev, descriptionEnglish: val }));
                  } else {
                    setFormData((prev) => ({ ...prev, descriptionMarathi: val }));
                  }
                }}
                placeholder={
                  contentLang === 'en'
                    ? 'Clear agricultural description of product utility, crop stages, and benefits...'
                    : 'पिकांची वाढ, वापर आणि फायद्यांविषयी माहितीपूर्ण कृषी वर्णन...'
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
              />
            </div>

            {/* Suitable Crops */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {contentLang === 'en'
                  ? (lang === 'mr' ? 'उपयुक्त पिके (इंग्रजी, स्वल्पविरामाने वेगळी करा)' : 'Suitable Crops (English, comma-separated)')
                  : (lang === 'mr' ? 'उपयुक्त पिके (मराठी, स्वल्पविरामाने वेगळी करा)' : 'Suitable Crops (Marathi, comma-separated)')}
              </label>
              <input
                type="text"
                value={contentLang === 'en' ? cropsEnInput : cropsMrInput}
                onChange={(e) => {
                  if (contentLang === 'en') {
                    setCropsEnInput(e.target.value);
                  } else {
                    setCropsMrInput(e.target.value);
                  }
                }}
                placeholder={contentLang === 'en' ? 'Soybean, Cotton, Vegetables' : 'सोयाबीन, कापूस, भाजीपाला'}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Key Highlights */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {contentLang === 'en'
                  ? (lang === 'mr' ? 'मुख्य वैशिष्ट्ये (इंग्रजी, प्रत्येक ओळीवर एक)' : 'Key Highlights (English, one per line)')
                  : (lang === 'mr' ? 'मुख्य वैशिष्ट्ये (मराठी, प्रत्येक ओळीवर एक)' : 'Key Highlights (Marathi, one per line)')}
              </label>
              <textarea
                rows={3}
                value={contentLang === 'en' ? pointsEnInput : pointsMrInput}
                onChange={(e) => {
                  if (contentLang === 'en') {
                    setPointsEnInput(e.target.value);
                  } else {
                    setPointsMrInput(e.target.value);
                  }
                }}
                placeholder={
                  contentLang === 'en'
                    ? '100% drip grade solubility\nBalanced crop nourishment\nConsult agronomist at shop'
                    : 'ठिबक सिंचनासाठी १००% विद्राव्य\nपिकांची संतुलित वाढ\nकेंद्रावर प्रत्यक्ष कृषी सल्ला उपलब्ध'
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
              />
            </div>
          </div>

          {/* Collapsible Counterpart Review Drawer */}
          <TranslationReviewDrawer
            adminLang={lang}
            targetLang={targetLang}
            isModified={isCounterpartOverridden}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {targetLang === 'mr'
                    ? (lang === 'mr' ? 'उत्पादनाचे मराठी नाव (भाषांतरित)' : 'Product Name (Marathi Translation)')
                    : (lang === 'mr' ? 'उत्पादनाचे इंग्रजी नाव (भाषांतरित)' : 'Product Name (English Translation)')}
                </label>
                <input
                  type="text"
                  value={targetLang === 'mr' ? formData.nameMarathi : formData.nameEnglish}
                  onChange={(e) => {
                    setIsCounterpartOverridden(true);
                    const val = e.target.value;
                    if (targetLang === 'mr') {
                      setFormData((prev) => ({ ...prev, nameMarathi: val }));
                    } else {
                      setFormData((prev) => ({ ...prev, nameEnglish: val }));
                    }
                  }}
                  placeholder={targetLang === 'mr' ? 'उदा. विद्राव्य खत १९:१९:१९' : 'e.g. Water-Soluble NPK 19:19:19'}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {targetLang === 'mr'
                    ? (lang === 'mr' ? 'मराठी वर्णन (भाषांतरित)' : 'Description (Marathi Translation)')
                    : (lang === 'mr' ? 'इंग्रजी वर्णन (भाषांतरित)' : 'Description (English Translation)')}
                </label>
                <textarea
                  rows={3}
                  value={targetLang === 'mr' ? formData.descriptionMarathi : formData.descriptionEnglish}
                  onChange={(e) => {
                    setIsCounterpartOverridden(true);
                    const val = e.target.value;
                    if (targetLang === 'mr') {
                      setFormData((prev) => ({ ...prev, descriptionMarathi: val }));
                    } else {
                      setFormData((prev) => ({ ...prev, descriptionEnglish: val }));
                    }
                  }}
                  placeholder={
                    targetLang === 'mr'
                      ? 'पिकांची वाढ, वापर आणि फायद्यांविषयी माहितीपूर्ण मराठी वर्णन...'
                      : 'Clear agricultural description of product utility...'
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    {targetLang === 'mr'
                      ? (lang === 'mr' ? 'उपयुक्त पिके (मराठी)' : 'Suitable Crops (Marathi)')
                      : (lang === 'mr' ? 'उपयुक्त पिके (इंग्रजी)' : 'Suitable Crops (English)')}
                  </label>
                  <input
                    type="text"
                    value={targetLang === 'mr' ? cropsMrInput : cropsEnInput}
                    onChange={(e) => {
                      setIsCounterpartOverridden(true);
                      if (targetLang === 'mr') {
                        setCropsMrInput(e.target.value);
                      } else {
                        setCropsEnInput(e.target.value);
                      }
                    }}
                    placeholder={targetLang === 'mr' ? 'सोयाबीन, कापूस, भाजीपाला' : 'Soybean, Cotton, Vegetables'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    {targetLang === 'mr'
                      ? (lang === 'mr' ? 'मुख्य वैशिष्ट्ये (मराठी)' : 'Key Highlights (Marathi)')
                      : (lang === 'mr' ? 'मुख्य वैशिष्ट्ये (इंग्रजी)' : 'Key Highlights (English)')}
                  </label>
                  <textarea
                    rows={2}
                    value={targetLang === 'mr' ? pointsMrInput : pointsEnInput}
                    onChange={(e) => {
                      setIsCounterpartOverridden(true);
                      if (targetLang === 'mr') {
                        setPointsMrInput(e.target.value);
                      } else {
                        setPointsEnInput(e.target.value);
                      }
                    }}
                    placeholder={
                      targetLang === 'mr'
                        ? 'ठिबक सिंचनासाठी १००% विद्राव्य'
                        : '100% drip grade solubility'
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </TranslationReviewDrawer>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {lang === 'mr' ? 'मुख्य वर्ग (Category) *' : 'Primary Category *'}
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              >
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'mr' ? `${c.nameMr} (${c.name})` : `${c.name} (${c.nameMr})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {lang === 'mr' ? 'उपवर्ग (Subcategory)' : 'Subcategory'}
              </label>
              <select
                value={formData.subcategoryId || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              >
                {(currentCategory?.subcategories || []).map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {lang === 'mr' ? `${sub.nameMr} (${sub.name})` : `${sub.name} (${sub.nameMr})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price, Stock Status & Featured Setting */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-stone-50 border border-stone-200">
            {/* Price Field */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5 flex items-center justify-between">
                <span>{lang === 'mr' ? 'किंमत (₹)' : 'Product Price (₹)'}</span>
                <span className="text-[10px] text-stone-500 font-normal">
                  {lang === 'mr' ? 'स्वतंत्र किंमत' : 'Per item'}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={(e) => {
                    setPriceInput(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="450"
                  className="w-full pl-8 pr-3.5 py-2 text-xs font-bold text-stone-900 rounded-xl border border-stone-300 bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 tabular-nums"
                />
              </div>
            </div>

            {/* Availability Status */}
            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {lang === 'mr' ? 'उपलब्धता स्थिती' : 'Availability Status'}
              </label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData((prev) => ({ 
                  ...prev, 
                  availability: e.target.value as 'available' | 'out_of_stock' 
                }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white font-semibold focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="available">
                  {lang === 'mr' ? 'उपलब्ध (In Stock)' : 'Available (In Stock)'}
                </option>
                <option value="out_of_stock">
                  {lang === 'mr' ? 'तात्पुरती अनुपलब्ध (Out of Stock)' : 'Out of Stock'}
                </option>
              </select>
            </div>

            {/* Featured Product Toggle */}
            <div className="flex items-center gap-2.5 pt-4 sm:pt-6">
              <input
                type="checkbox"
                id="feat-chk"
                checked={Boolean(formData.featured)}
                onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600 cursor-pointer accent-emerald-700"
              />
              <label htmlFor="feat-chk" className="text-xs font-bold text-stone-900 cursor-pointer">
                {lang === 'mr' ? 'वैशिष्ट्यीकृत उत्पादन (Featured)' : 'Featured on Home'}
              </label>
            </div>
          </div>

          {/* Product Image Section */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  {lang === 'mr' ? 'उत्पादन छायाचित्र (Product Image) *' : 'Product Image *'}
                </span>
                <span className="text-[11px] text-stone-500 block mt-0.5 leading-relaxed">
                  {lang === 'mr'
                    ? 'डिव्हाइसवरून फोटो अपलोड करा किंवा थेट इंटरनेट URL प्रविष्ट करा.'
                    : 'Upload directly from device or provide an image URL.'}
                </span>
              </div>

              {/* Mode selector pills */}
              <div className="flex items-center p-1 bg-stone-200/80 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setImageSourceMode('upload')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    imageSourceMode === 'upload'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {lang === 'mr' ? 'डिव्हाइस अपलोड' : 'Device Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceMode('url')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    imageSourceMode === 'url'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {lang === 'mr' ? 'इंटरनेट URL' : 'Image URL'}
                </button>
              </div>
            </div>

            {/* Upload From Device workflow */}
            {imageSourceMode === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleDeviceFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    {isUploadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>
                      {isUploadingImage
                        ? (lang === 'mr' ? 'अपलोड होत आहे...' : 'Uploading...')
                        : (lang === 'mr' ? 'डिव्हाइसवरून फोटो निवडा' : 'Select Photo from Device')}
                    </span>
                  </button>
                  <span className="text-[11px] text-stone-500">
                    {lang === 'mr' ? 'PNG, JPG, WebP (कमाल ५MB)' : 'PNG, JPG, WebP supported (max 5MB)'}
                  </span>
                </div>
              </div>
            )}

            {/* Internet URL workflow */}
            {imageSourceMode === 'url' && (
              <div className="space-y-2">
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/product-image.jpg"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-white font-mono text-stone-700 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                {urlImageStatus === 'invalid' && urlInput.trim() && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'ही URL अवैध आहे किंवा प्रतिमा लोड होऊ शकली नाही.' : 'Invalid URL or image could not be loaded.'}</span>
                  </p>
                )}
                {urlImageStatus === 'valid' && (
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'प्रतिमा URL यशस्वीरित्या तपासली.' : 'Image URL verified successfully.'}</span>
                  </p>
                )}
              </div>
            )}

            {/* Image Live Preview */}
            {(deviceImageBase64 || urlInput.trim() || formData.image) && (
              <div className="pt-3 border-t border-stone-200/80 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-stone-300 bg-white p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  <img
                    src={imageSourceMode === 'upload' && deviceImageBase64 ? deviceImageBase64 : (urlInput.trim() || formData.image)}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/categories/fertilizers.png';
                    }}
                  />
                </div>

                <div className="space-y-1 text-left min-w-0 flex-1">
                  <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'mr' ? 'निवडलेली प्रतिमा पूर्वावलोकन' : 'Selected Image Preview'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate font-mono">
                    {imageSourceMode === 'upload'
                      ? (deviceImageBase64 ? (lang === 'mr' ? 'डिव्हाइसवरून अपलोड केलेले छायाचित्र' : 'Device file stored with record') : 'No device file selected')
                      : (urlInput.trim() || formData.image)}
                  </p>
                  {deviceImageBase64 && imageSourceMode === 'upload' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer underline"
                    >
                      {lang === 'mr' ? 'दुसरा फोटो बदला' : 'Replace Image'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSaving || isTranslating}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || isTranslating}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-75"
            >
              {isSaving || isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'mr' ? 'भाषांतर व जतन...' : 'Translating & Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit 
                    ? (lang === 'mr' ? 'बदल जतन करा' : 'Save Changes')
                    : (lang === 'mr' ? 'उत्पादन जोडा' : 'Add Product')
                  }</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
