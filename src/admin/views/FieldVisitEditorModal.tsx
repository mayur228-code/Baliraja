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
  Camera
} from 'lucide-react';
import type { FieldVisitItem, Language } from '../../types';
import { translateText } from '../services/translationService';
import { optimizeImage } from '../../lib/imageOptimizer';
import { uploadImageToServer } from '../services/uploadService';

interface FieldVisitEditorModalProps {
  isOpen: boolean;
  lang: Language;
  mode?: 'create' | 'edit';
  visit: FieldVisitItem | null;
  onClose: () => void;
  onSave: (visit: FieldVisitItem) => void | Promise<void>;
}

export const FieldVisitEditorModal: FC<FieldVisitEditorModalProps> = ({
  isOpen,
  lang,
  mode,
  visit,
  onClose,
  onSave
}) => {
  const isEdit = mode === 'edit' || Boolean(visit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single Title input based on currently selected Admin Language
  const [titleInput, setTitleInput] = useState<string>(() => {
    if (!visit) return '';
    return lang === 'mr' ? (visit.titleMr || visit.titleEn) : (visit.titleEn || visit.titleMr);
  });

  // Selected or uploaded image
  const [imageSrc, setImageSrc] = useState<string>(() => visit?.imageSrc || '');

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
          ? 'कृपया वैध प्रतिमा फाईल निवडा (PNG, JPG, WebP, SVG).' 
          : 'Please select a valid image file (PNG, JPG, WebP, SVG).'
      );
      return;
    }

    // Limit to 10MB input file
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
      const optimized = await optimizeImage(file);
      if (optimized) {
        const uploadRes = await uploadImageToServer(optimized, 'visit');
        if (uploadRes.success && uploadRes.url) {
          setImageSrc(uploadRes.url);
          setValidationError(null);
        } else {
          setValidationError(uploadRes.error || (lang === 'mr' ? 'प्रतिमा अपलोड अयशस्वी.' : 'Image upload failed.'));
        }
      }
    } catch {
      setValidationError(
        lang === 'mr' ? 'प्रतिमा अपलोड करताना त्रुटी आली.' : 'Failed to process and upload image.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = titleInput.trim();
    if (!trimmedTitle) {
      setValidationError(
        lang === 'mr' ? 'कृपया शेत भेटीचे शीर्षक प्रविष्ट करा.' : 'Please enter a field visit title.'
      );
      return;
    }

    if (!imageSrc) {
      setValidationError(
        lang === 'mr' ? 'कृपया शेत भेटीचे छायाचित्र निवडा.' : 'Please select a photograph for this field visit.'
      );
      return;
    }

    setIsTranslating(true);

    let finalTitleEn = '';
    let finalTitleMr = '';

    if (lang === 'en') {
      finalTitleEn = trimmedTitle;
      try {
        finalTitleMr = await translateText(trimmedTitle, 'en', 'mr');
      } catch {
        // Fallback without losing English title or blocking save
        finalTitleMr = (isEdit && visit?.titleMr) ? visit.titleMr : trimmedTitle;
      }
    } else {
      // Admin Language is Marathi
      finalTitleMr = trimmedTitle;
      try {
        finalTitleEn = await translateText(trimmedTitle, 'mr', 'en');
      } catch {
        // Fallback without losing Marathi title or blocking save
        finalTitleEn = (isEdit && visit?.titleEn) ? visit.titleEn : trimmedTitle;
      }
    }

    // STRICTLY IMMUTABLE ID on Edit, stable new ID on Create
    const finalId = (isEdit && visit) ? visit.id : `visit-${Date.now()}`;

    // Ensure image is uploaded to server if still base64
    let finalImageSrc = imageSrc;
    if (imageSrc.startsWith('data:image/')) {
      try {
        const optimized = await optimizeImage(imageSrc);
        const up = await uploadImageToServer(optimized || imageSrc, 'visit');
        if (up.success && up.url) {
          finalImageSrc = up.url;
        }
      } catch {
        // keep imageSrc
      }
    }

    const finalVisit: FieldVisitItem = {
      id: finalId,
      titleEn: finalTitleEn,
      titleMr: finalTitleMr,
      imageSrc: finalImageSrc,
      altEn: finalTitleEn,
      altMr: finalTitleMr,
      tagEn: visit?.tagEn || 'Field Visit',
      tagMr: visit?.tagMr || 'शेत भेट',
      descriptionEn: visit?.descriptionEn || '',
      descriptionMr: visit?.descriptionMr || '',
      order: visit?.order,
      createdAt: visit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSave(finalVisit);
    } catch {
      setValidationError(
        lang === 'mr' ? 'नोंद जतन करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' : 'Failed to save field visit. Please try again.'
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
      aria-labelledby="field-visit-modal-title"
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200/90 max-h-[92vh] flex flex-col overflow-hidden ring-1 ring-black/[0.03]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200/70 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 id="field-visit-modal-title" className="text-base font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                {isEdit 
                  ? (lang === 'mr' ? 'शेत भेट छायाचित्र संपादित करा' : 'Edit Field Visit Photo')
                  : (lang === 'mr' ? 'नवीन शेत भेट छायाचित्र जोडा' : 'Add New Field Visit Photo')}
              </h3>
              <p className="text-2xs text-stone-500 leading-relaxed">
                {lang === 'mr' 
                  ? 'छायाचित्र जोडा व शीर्षक लिहा. इतर भाषेतील भाषांतर आपोआप होईल.' 
                  : 'Upload photo from device and enter title once. Automatic translation handles the other language.'}
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

          {/* 1. Image Upload from Device */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-800 leading-relaxed">
              {lang === 'mr' ? 'शेत भेट प्रत्यक्ष छायाचित्र' : 'Field Visit Photograph'}
              <span className="text-red-500 ml-1">*</span>
            </label>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {imageSrc ? (
              /* Image Preview Box */
              <div className="space-y-2.5">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-900/5 group shadow-inner">
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="w-full h-full object-cover select-none"
                  />
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
                <div className="text-xs font-bold text-stone-800 group-hover:text-emerald-900">
                  {isUploadingImage
                    ? (lang === 'mr' ? 'छायाचित्र अपलोड होत आहे...' : 'Uploading image...')
                    : (lang === 'mr' ? 'डिव्हाइसमधून छायाचित्र निवडा' : 'Upload Image From Device')}
                </div>
                <p className="text-3xs text-stone-500 mt-1">
                  PNG, JPG, WebP {lang === 'mr' ? '(कमाल १०MB)' : '(Max 10MB)'}
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs group-hover:bg-emerald-800 transition-colors">
                    {isUploadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{isUploadingImage ? (lang === 'mr' ? 'अपलोड सुरू आहे...' : 'Uploading...') : (lang === 'mr' ? 'छायाचित्र निवडा' : 'Select Photo')}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Single Title Input (Controlled by current Admin Language) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="field-visit-title" className="block text-xs font-bold text-stone-800 leading-relaxed">
                {lang === 'mr' ? 'शेत भेट शीर्षक (Title in Marathi)' : 'Field Visit Title (Title in English)'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              
              <span className="inline-flex items-center gap-1 text-3xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                <span>
                  {lang === 'mr' 
                    ? 'इंग्रजी भाषांतर आपोआप होईल' 
                    : 'Auto-translates to Marathi'}
                </span>
              </span>
            </div>

            <input
              id="field-visit-title"
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder={
                lang === 'mr' 
                  ? 'उदा. आले पिकाच्या शेताला भेट किंवा प्रत्यक्ष पीक पाहणी' 
                  : 'e.g. Farmer Visit to Ginger Field or Direct Crop Guidance'
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
              autoFocus
            />

            <p className="text-3xs text-stone-500 leading-relaxed">
              {lang === 'mr'
                ? '💡 तुम्ही प्रविष्ट केलेले शीर्षक मूळ भाषा म्हणून जतन केले जाईल आणि संकेतस्थळासाठी इंग्रजी भाषांतर आपोआप तयार होईल.'
                : '💡 You only enter the title once. It is stored as the source language, and the Marathi title will be generated automatically.'}
            </p>
          </div>

          {/* 3. Record ID Note */}
          {isEdit && visit && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-3xs text-stone-600 font-mono">
              <span>{lang === 'mr' ? 'स्थिर ओळख (Immutable ID):' : 'Stable Unique ID:'}</span>
              <span className="font-bold text-stone-800">{visit.id}</span>
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
                      : (lang === 'mr' ? 'शेत भेट जोडा' : 'Save Field Visit')}
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
