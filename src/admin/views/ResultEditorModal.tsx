import { useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  RefreshCw,
  Sparkles,
  User,
  MapPin,
  Award
} from 'lucide-react';
import type { FarmerResult, Language } from '../../types';
import { translateText } from '../services/translationService';
import { uploadImageToServer } from '../services/uploadService';

interface ResultEditorModalProps {
  isOpen: boolean;
  lang: Language;
  mode?: 'create' | 'edit';
  result: FarmerResult | null;
  onClose: () => void;
  onSave: (result: FarmerResult) => void | Promise<void>;
}

export const ResultEditorModal: FC<ResultEditorModalProps> = ({
  isOpen,
  lang,
  mode,
  result,
  onClose,
  onSave
}) => {
  const isEdit = mode === 'edit' || Boolean(result);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial name and location from existing result based on current Admin Language
  const [nameInput, setNameInput] = useState<string>(() => {
    if (!result) return '';
    return lang === 'mr' 
      ? (result.name?.mr || result.nameMr || result.name?.en || result.nameEn || '') 
      : (result.name?.en || result.nameEn || result.name?.mr || result.nameMr || '');
  });

  const [locationInput, setLocationInput] = useState<string>(() => {
    if (!result) return '';
    return lang === 'mr' 
      ? (result.location?.mr || result.locationMr || result.location?.en || result.locationEn || '') 
      : (result.location?.en || result.locationEn || result.location?.mr || result.locationMr || '');
  });

  // Selected or uploaded image
  const [imageSrc, setImageSrc] = useState<string>(() => result?.image || '');

  // Loading & error states
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle image upload from device
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError(
        lang === 'mr' 
          ? 'कृपया वैध प्रतिमा फाईल निवडा (PNG, JPG, WebP, JFIF).' 
          : 'Please select a valid image file (PNG, JPG, WebP, JFIF).'
      );
      return;
    }

    // Limit to 10MB
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
      const uploadRes = await uploadImageToServer(file, 'result');
      if (uploadRes.success && uploadRes.url) {
        setImageSrc(uploadRes.url);
        setValidationError(null);
      } else {
        setValidationError(
          uploadRes.error || (lang === 'mr' ? 'प्रतिमा अपलोड अयशस्वी.' : 'Image upload failed.')
        );
      }
    } catch {
      setValidationError(
        lang === 'mr' ? 'प्रतिमा अपलोड करताना त्रुटी आली.' : 'Failed to upload image.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = nameInput.trim();
    const trimmedLocation = locationInput.trim();

    if (!trimmedName) {
      setValidationError(
        lang === 'mr' ? 'कृपया शेतकऱ्याचे नाव प्रविष्ट करा.' : 'Please enter farmer name.'
      );
      return;
    }

    if (!trimmedLocation) {
      setValidationError(
        lang === 'mr' ? 'कृपया गाव किंवा ठिकाण प्रविष्ट करा.' : 'Please enter village or location.'
      );
      return;
    }

    if (!imageSrc) {
      setValidationError(
        lang === 'mr' ? 'कृपया शेतकऱ्याचे छायाचित्र निवडा.' : 'Please upload a farmer photograph.'
      );
      return;
    }

    setIsTranslating(true);

    let finalNameEn = '';
    let finalNameMr = '';
    let finalLocEn = '';
    let finalLocMr = '';

    if (lang === 'en') {
      finalNameEn = trimmedName;
      finalLocEn = trimmedLocation;

      try {
        finalNameMr = await translateText(trimmedName, 'en', 'mr');
      } catch {
        finalNameMr = (isEdit && (result?.name?.mr || result?.nameMr)) ? (result.name?.mr || result.nameMr!) : trimmedName;
      }

      try {
        finalLocMr = await translateText(trimmedLocation, 'en', 'mr');
      } catch {
        finalLocMr = (isEdit && (result?.location?.mr || result?.locationMr)) ? (result.location?.mr || result.locationMr!) : trimmedLocation;
      }
    } else {
      // Admin language is Marathi
      finalNameMr = trimmedName;
      finalLocMr = trimmedLocation;

      try {
        finalNameEn = await translateText(trimmedName, 'mr', 'en');
      } catch {
        finalNameEn = (isEdit && (result?.name?.en || result?.nameEn)) ? (result.name?.en || result.nameEn!) : trimmedName;
      }

      try {
        finalLocEn = await translateText(trimmedLocation, 'mr', 'en');
      } catch {
        finalLocEn = (isEdit && (result?.location?.en || result?.locationEn)) ? (result.location?.en || result.locationEn!) : trimmedLocation;
      }
    }

    // Ensure image is uploaded to server if still base64
    let finalImageSrc = imageSrc;
    if (imageSrc.startsWith('data:image/')) {
      try {
        const up = await uploadImageToServer(imageSrc, 'result');
        if (up.success && up.url) {
          finalImageSrc = up.url;
        }
      } catch {
        // preserve
      }
    }

    const finalId = (isEdit && result) ? result.id : (result?.id || `res-${Date.now()}`);

    const finalResult: FarmerResult = {
      id: finalId,
      image: finalImageSrc,
      name: {
        en: finalNameEn,
        mr: finalNameMr
      },
      location: {
        en: finalLocEn,
        mr: finalLocMr
      },
      nameEn: finalNameEn,
      nameMr: finalNameMr,
      locationEn: finalLocEn,
      locationMr: finalLocMr,
      order: result?.order || 1,
      createdAt: result?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSave(finalResult);
    } catch {
      setValidationError(
        lang === 'mr' ? 'नोंद जतन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' : 'Failed to save farmer result. Please try again.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200/90 max-h-[92vh] flex flex-col overflow-hidden ring-1 ring-black/[0.03]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/20 flex items-center justify-center text-amber-700 shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 id="result-modal-title" className="text-base font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                {isEdit 
                  ? (lang === 'mr' ? 'शेतकरी निकाल संपादित करा' : 'Edit Farmer Result')
                  : (lang === 'mr' ? 'नवीन शेतकरी निकाल जोडा' : 'Add Farmer Result')}
              </h3>
              <p className="text-2xs text-stone-500 leading-relaxed">
                {lang === 'mr' 
                  ? 'डिव्हाइसमधून छायाचित्र जोडा व माहिती भरा. भाषांतर आपोआप होईल.' 
                  : 'Upload photo from device and enter details. Automatic translation handles the other language.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Validation Error banner */}
          {validationError && (
            <div className="p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 shadow-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="leading-relaxed">{validationError}</span>
            </div>
          )}

          {/* 1. Image Upload From Device */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-800 leading-relaxed">
              {lang === 'mr' ? 'शेतकऱ्याचे छायाचित्र (Farmer Photo from Device)' : 'Farmer Photograph (Upload From Device)'}
              <span className="text-red-500 ml-1">*</span>
            </label>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.jfif"
              onChange={handleFileUpload}
              className="hidden"
            />

            {imageSrc ? (
              /* Image Preview Box with Baliraja Watermark Logo preview */
              <div className="space-y-2.5">
                <div className="relative aspect-[3/4] max-h-[360px] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-stone-200 bg-stone-900/5 group shadow-inner">
                  <img
                    src={imageSrc}
                    alt="Farmer Result Preview"
                    className="w-full h-full object-cover select-none"
                  />

                  {/* Integrated Logo Preview */}
                  <div className="absolute top-3 right-3 z-10 pointer-events-none">
                    <div className="w-9 h-9 rounded-2xl p-1 bg-white/85 backdrop-blur-md border border-white/90 shadow-sm flex items-center justify-center">
                      <img
                        src="/assets/logo.png"
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white text-stone-900 rounded-xl text-xs font-bold shadow-md hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{lang === 'mr' ? 'प्रतिमा बदला' : 'Change Image'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-2xs text-stone-500 px-1">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'प्रतिमा लोड झाली आहे' : 'Photo ready for display'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    {lang === 'mr' ? 'दुसरी प्रतिमा निवडा (Upload New)' : 'Upload From Device'}
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone button to pick file from device */
              <div
                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${
                  isUploadingImage
                    ? 'border-emerald-400 bg-emerald-50/40 opacity-75'
                    : 'border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/30'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-stone-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center text-stone-500 mx-auto mb-3 transition-colors shadow-xs">
                  {isUploadingImage ? <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" /> : <Upload className="w-6 h-6" />}
                </div>
                <div className="text-xs font-bold text-stone-800 group-hover:text-emerald-900 leading-relaxed">
                  {isUploadingImage
                    ? (lang === 'mr' ? 'छायाचित्र अपलोड होत आहे...' : 'Uploading image...')
                    : (lang === 'mr' ? 'डिव्हाइसमधून छायाचित्र निवडा' : 'Upload Image From Device')}
                </div>
                <p className="text-3xs text-stone-500 mt-1">
                  Portrait 3:4 orientation recommended (JPG, PNG, JFIF, WebP, max 8MB)
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs group-hover:bg-emerald-800 transition-colors">
                    {isUploadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploadingImage ? (lang === 'mr' ? 'अपलोड सुरू आहे...' : 'Uploading...') : (lang === 'mr' ? 'छायाचित्र निवडा' : 'Upload From Device')}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Farmer Name Input (Controlled by current Admin Language) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="farmer-name-input" className="block text-xs font-bold text-stone-800 flex items-center gap-1.5 leading-relaxed">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {lang === 'mr' ? 'शेतकऱ्याचे नाव (Farmer Name in Marathi)' : 'Farmer Name (in English)'}
                </span>
                <span className="text-red-500">*</span>
              </label>
              
              <span className="inline-flex items-center gap-1 text-3xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                <span>
                  {lang === 'mr' ? 'इंग्रजीत आपोआप होईल' : 'Auto-translates to Marathi'}
                </span>
              </span>
            </div>

            <input
              id="farmer-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={
                lang === 'mr' 
                  ? 'उदा. श्री. ज्ञानेश्वर शिंदे / शेतकरी बांधव' 
                  : 'e.g. Mr. Dnyaneshwar Shinde / Farmer Partner'
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
            />
          </div>

          {/* 3. Location Input (Controlled by current Admin Language) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="farmer-location-input" className="block text-xs font-bold text-stone-800 flex items-center gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {lang === 'mr' ? 'गाव / ठिकाण (Location in Marathi)' : 'Village / Location (in English)'}
                </span>
                <span className="text-red-500">*</span>
              </label>
              
              <span className="inline-flex items-center gap-1 text-3xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                <span>
                  {lang === 'mr' ? 'इंग्रजीत आपोआप होईल' : 'Auto-translates to Marathi'}
                </span>
              </span>
            </div>

            <input
              id="farmer-location-input"
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder={
                lang === 'mr' 
                  ? 'उदा. जानेगाव, ता. कैज / कैज परिसर' 
                  : 'e.g. Janegaon, Kaij / Kaij Region'
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
            />

            <p className="text-3xs text-stone-500 leading-relaxed">
              {lang === 'mr'
                ? '💡 तुम्ही प्रविष्ट केलेली माहिती मूळ भाषा म्हणून जतन केली जाईल आणि दुसरी भाषा आपोआप भाषांतरित होईल.'
                : '💡 You only enter the details once in your active language. The counterpart language is translated automatically.'}
            </p>
          </div>

          {/* 4. Record ID Note */}
          {isEdit && result && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-3xs text-stone-600 font-mono">
              <span>{lang === 'mr' ? 'स्थिर ओळख (Immutable ID):' : 'Stable Unique ID:'}</span>
              <span className="font-bold text-stone-800">{result.id}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isTranslating}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isTranslating}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600/70 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="leading-relaxed">
                    {lang === 'mr' ? 'भाषांतर व जतन करत आहे...' : 'Translating & Saving...'}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="leading-relaxed">
                    {isEdit 
                      ? (lang === 'mr' ? 'बदल जतन करा' : 'Save Changes')
                      : (lang === 'mr' ? 'शेतकरी निकाल जोडा' : 'Save Farmer Result')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
