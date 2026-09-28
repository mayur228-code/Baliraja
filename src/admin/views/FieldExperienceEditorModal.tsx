import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { X, Save, AlertCircle, Sprout, Loader2, Package } from 'lucide-react';
import type { FieldExperience, Language, Product } from '../../types';
import { ContentLanguageSelector } from '../components/ContentLanguageSelector';
import { TranslationReviewDrawer } from '../components/TranslationReviewDrawer';
import { translateText } from '../services/translationService';

interface FieldExperienceEditorModalProps {
  isOpen: boolean;
  lang: Language;
  experience: FieldExperience | null;
  products: Product[];
  onClose: () => void;
  onSave: (item: FieldExperience) => void;
}

export const FieldExperienceEditorModal: FC<FieldExperienceEditorModalProps> = ({
  isOpen,
  lang,
  experience,
  products,
  onClose,
  onSave
}) => {
  const isEdit = Boolean(experience);

  // Content entry language
  const [contentLang, setContentLang] = useState<Language>(() => {
    if (experience?.translationSource) return experience.translationSource;
    return 'en';
  });

  // Auto-translate on save toggle (default ON)
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  // Loading states
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Track if counterpart has been manually edited
  const [isCounterpartOverridden, setIsCounterpartOverridden] = useState<boolean>(() => {
    return Boolean(experience?.customTranslation);
  });

  const [formData, setFormData] = useState<FieldExperience>(() => {
    if (experience) return { ...experience };
    return {
      id: `fe-${Date.now()}`,
      cropKey: 'soybean',
      cropNameEnglish: 'Soybean',
      cropNameMarathi: 'सोयाबीन',
      titleEnglish: 'Field Observation: Crop Vigor & Vegetative Stage',
      titleMarathi: 'शेती निरीक्षण: पीक जोमदार वाढ व शाकीय अवस्था',
      summaryEnglish: 'Practical agronomic guidance based on local soil and weather patterns.',
      summaryMarathi: 'स्थानिक जमीन आणि हवामानानुसार प्रत्यक्ष शेती सल्ला व निरीक्षण.',
      observationEnglish: 'Early vegetative development showed balanced branching under timely micronutrient application.',
      observationMarathi: 'योग्य वेळी सूक्ष्म अन्नद्रव्ये दिल्याने सुरुवातीच्या शाकीय वाढीत फुटवे उत्तम झाले.',
      practiceEnglish: 'Apply balanced nutrition and monitor for stem fly or leaf spot symptoms during early monsoon.',
      practiceMarathi: 'सुरुवातीच्या पावसाळ्यात खोडमाशी आणि पानांवरील ठिपक्यांवर लक्ष ठेवून संतुलित पोषण द्यावे.',
      seasonEnglish: 'Kharif',
      seasonMarathi: 'खरीप हंगाम',
      stageEnglish: 'Vegetative Growth (25-35 Days)',
      stageMarathi: 'शाकीय वाढ (२५-३५ दिवस)',
      isSample: true,
      relatedProductIds: products.slice(0, 2).map((p) => p.id),
      translationSource: 'en'
    };
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetLang: Language = contentLang === 'en' ? 'mr' : 'en';

  const bothLanguagesReady = Boolean(
    formData.titleEnglish.trim() &&
    formData.titleMarathi.trim() &&
    formData.cropNameEnglish.trim() &&
    formData.cropNameMarathi.trim() &&
    formData.observationEnglish.trim() &&
    formData.observationMarathi.trim()
  );

  const handleToggleProductRelation = (productId: string) => {
    const current = formData.relatedProductIds || [];
    if (current.includes(productId)) {
      setFormData((prev) => ({
        ...prev,
        relatedProductIds: current.filter((id) => id !== productId)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        relatedProductIds: [...current, productId]
      }));
    }
  };

  // Immediate "Translate Now" preview action
  const handleManualTranslateNow = async () => {
    const sourceCrop = contentLang === 'en' ? formData.cropNameEnglish : formData.cropNameMarathi;
    const sourceTitle = contentLang === 'en' ? formData.titleEnglish : formData.titleMarathi;
    const sourceSeason = contentLang === 'en' ? formData.seasonEnglish : formData.seasonMarathi;
    const sourceStage = contentLang === 'en' ? formData.stageEnglish : formData.stageMarathi;
    const sourceObs = contentLang === 'en' ? formData.observationEnglish : formData.observationMarathi;
    const sourcePrac = contentLang === 'en' ? formData.practiceEnglish : formData.practiceMarathi;
    const sourceSum = contentLang === 'en' ? formData.summaryEnglish : formData.summaryMarathi;

    if (!sourceCrop?.trim() && !sourceTitle?.trim() && !sourceObs?.trim()) {
      setValidationError(
        lang === 'mr'
          ? 'भाषांतर करण्यासाठी प्रथम पिकाचे नाव, शीर्षक किंवा निरीक्षण प्रविष्ट करा.'
          : 'Please enter crop name, title, or observation first to preview translation.'
      );
      return;
    }

    setValidationError(null);
    setIsTranslating(true);

    try {
      if (contentLang === 'en') {
        const [trCrop, trTitle, trSeason, trStage, trObs, trPrac, trSum] = await Promise.all([
          sourceCrop?.trim() ? translateText(sourceCrop, 'en', 'mr') : Promise.resolve(''),
          sourceTitle?.trim() ? translateText(sourceTitle, 'en', 'mr') : Promise.resolve(''),
          sourceSeason?.trim() ? translateText(sourceSeason, 'en', 'mr') : Promise.resolve(''),
          sourceStage?.trim() ? translateText(sourceStage, 'en', 'mr') : Promise.resolve(''),
          sourceObs?.trim() ? translateText(sourceObs, 'en', 'mr') : Promise.resolve(''),
          sourcePrac?.trim() ? translateText(sourcePrac, 'en', 'mr') : Promise.resolve(''),
          sourceSum?.trim() ? translateText(sourceSum, 'en', 'mr') : Promise.resolve('')
        ]);

        setFormData((prev) => ({
          ...prev,
          cropNameMarathi: trCrop || prev.cropNameMarathi,
          titleMarathi: trTitle || prev.titleMarathi,
          seasonMarathi: trSeason || prev.seasonMarathi,
          stageMarathi: trStage || prev.stageMarathi,
          observationMarathi: trObs || prev.observationMarathi,
          practiceMarathi: trPrac || prev.practiceMarathi,
          summaryMarathi: trSum || prev.summaryMarathi
        }));
      } else {
        const [trCrop, trTitle, trSeason, trStage, trObs, trPrac, trSum] = await Promise.all([
          sourceCrop?.trim() ? translateText(sourceCrop, 'mr', 'en') : Promise.resolve(''),
          sourceTitle?.trim() ? translateText(sourceTitle, 'mr', 'en') : Promise.resolve(''),
          sourceSeason?.trim() ? translateText(sourceSeason, 'mr', 'en') : Promise.resolve(''),
          sourceStage?.trim() ? translateText(sourceStage, 'mr', 'en') : Promise.resolve(''),
          sourceObs?.trim() ? translateText(sourceObs, 'mr', 'en') : Promise.resolve(''),
          sourcePrac?.trim() ? translateText(sourcePrac, 'mr', 'en') : Promise.resolve(''),
          sourceSum?.trim() ? translateText(sourceSum, 'mr', 'en') : Promise.resolve('')
        ]);

        setFormData((prev) => ({
          ...prev,
          cropNameEnglish: trCrop || prev.cropNameEnglish,
          cropKey: (trCrop || prev.cropNameEnglish).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          titleEnglish: trTitle || prev.titleEnglish,
          seasonEnglish: trSeason || prev.seasonEnglish,
          stageEnglish: trStage || prev.stageEnglish,
          observationEnglish: trObs || prev.observationEnglish,
          practiceEnglish: trPrac || prev.practiceEnglish,
          summaryEnglish: trSum || prev.summaryEnglish
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation error';
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

    const primaryCrop = contentLang === 'en' ? formData.cropNameEnglish : formData.cropNameMarathi;
    const primaryTitle = contentLang === 'en' ? formData.titleEnglish : formData.titleMarathi;
    const primaryObs = contentLang === 'en' ? formData.observationEnglish : formData.observationMarathi;
    const primaryPrac = contentLang === 'en' ? formData.practiceEnglish : formData.practiceMarathi;

    if (!primaryCrop.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'पिकाचे इंग्रजी नाव आवश्यक आहे.' : 'Crop name (English) is required.')
          : (lang === 'mr' ? 'पिकाचे मराठी नाव आवश्यक आहे.' : 'Crop name (Marathi) is required.')
      );
      return;
    }

    if (!primaryTitle.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'नोंद शीर्षक (इंग्रजी) आवश्यक आहे.' : 'Title (English) is required.')
          : (lang === 'mr' ? 'नोंद शीर्षक (मराठी) आवश्यक आहे.' : 'Title (Marathi) is required.')
      );
      return;
    }

    if (!primaryObs.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'प्रत्यक्ष निरीक्षण (इंग्रजी) आवश्यक आहे.' : 'Observation (English) is required.')
          : (lang === 'mr' ? 'प्रत्यक्ष निरीक्षण (मराठी) आवश्यक आहे.' : 'Observation (Marathi) is required.')
      );
      return;
    }

    let finalCropEn = formData.cropNameEnglish;
    let finalCropMr = formData.cropNameMarathi;
    let finalTitleEn = formData.titleEnglish;
    let finalTitleMr = formData.titleMarathi;
    let finalSeasonEn = formData.seasonEnglish || '';
    let finalSeasonMr = formData.seasonMarathi || '';
    let finalStageEn = formData.stageEnglish || '';
    let finalStageMr = formData.stageMarathi || '';
    let finalObsEn = formData.observationEnglish;
    let finalObsMr = formData.observationMarathi;
    let finalPracEn = formData.practiceEnglish || '';
    let finalPracMr = formData.practiceMarathi || '';
    let finalSumEn = formData.summaryEnglish || '';
    let finalSumMr = formData.summaryMarathi || '';

    if (autoTranslate) {
      setIsSaving(true);
      setIsTranslating(true);

      try {
        if (contentLang === 'en') {
          // Translate English -> Marathi
          if (!finalCropMr.trim() || !isCounterpartOverridden) {
            finalCropMr = await translateText(formData.cropNameEnglish, 'en', 'mr');
          }
          if (!finalTitleMr.trim() || !isCounterpartOverridden) {
            finalTitleMr = await translateText(formData.titleEnglish, 'en', 'mr');
          }
          if (finalSeasonEn.trim() && (!finalSeasonMr.trim() || !isCounterpartOverridden)) {
            finalSeasonMr = await translateText(finalSeasonEn, 'en', 'mr');
          }
          if (finalStageEn.trim() && (!finalStageMr.trim() || !isCounterpartOverridden)) {
            finalStageMr = await translateText(finalStageEn, 'en', 'mr');
          }
          if (!finalObsMr.trim() || !isCounterpartOverridden) {
            finalObsMr = await translateText(formData.observationEnglish, 'en', 'mr');
          }
          if (finalPracEn.trim() && (!finalPracMr.trim() || !isCounterpartOverridden)) {
            finalPracMr = await translateText(finalPracEn, 'en', 'mr');
          }
          if (finalSumEn.trim() && (!finalSumMr.trim() || !isCounterpartOverridden)) {
            finalSumMr = await translateText(finalSumEn, 'en', 'mr');
          }
        } else {
          // Translate Marathi -> English
          if (!finalCropEn.trim() || !isCounterpartOverridden) {
            finalCropEn = await translateText(formData.cropNameMarathi, 'mr', 'en');
          }
          if (!finalTitleEn.trim() || !isCounterpartOverridden) {
            finalTitleEn = await translateText(formData.titleMarathi, 'mr', 'en');
          }
          if (finalSeasonMr.trim() && (!finalSeasonEn.trim() || !isCounterpartOverridden)) {
            finalSeasonEn = await translateText(finalSeasonMr, 'mr', 'en');
          }
          if (finalStageMr.trim() && (!finalStageEn.trim() || !isCounterpartOverridden)) {
            finalStageEn = await translateText(finalStageMr, 'mr', 'en');
          }
          if (!finalObsEn.trim() || !isCounterpartOverridden) {
            finalObsEn = await translateText(formData.observationMarathi, 'mr', 'en');
          }
          if (finalPracMr.trim() && (!finalPracEn.trim() || !isCounterpartOverridden)) {
            finalPracEn = await translateText(finalPracMr, 'mr', 'en');
          }
          if (finalSumMr.trim() && (!finalSumEn.trim() || !isCounterpartOverridden)) {
            finalSumEn = await translateText(finalSumMr, 'mr', 'en');
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Translation error';
        setValidationError(
          lang === 'mr'
            ? `भाषांतर त्रुटी: ${msg} (तुमचा प्रविष्ट केलेला मजकूर सुरक्षित आहे. तुम्ही पुनरावलोकन ड्रॉवरमध्ये हाताने माहिती भरू शकता किंवा पुन्हा प्रयत्न करू शकता.)`
            : `Translation error: ${msg} (Your entered content is preserved. You may retry or manually fill the review drawer below.)`
        );
        setIsSaving(false);
        setIsTranslating(false);
        return;
      } finally {
        setIsSaving(false);
        setIsTranslating(false);
      }
    } else {
      // If auto-translate is disabled, ensure counterpart is not empty
      if (contentLang === 'en') {
        if (!finalCropMr.trim()) finalCropMr = formData.cropNameEnglish;
        if (!finalTitleMr.trim()) finalTitleMr = formData.titleEnglish;
        if (!finalSeasonMr.trim()) finalSeasonMr = finalSeasonEn;
        if (!finalStageMr.trim()) finalStageMr = finalStageEn;
        if (!finalObsMr.trim()) finalObsMr = formData.observationEnglish;
        if (!finalPracMr.trim()) finalPracMr = finalPracEn;
        if (!finalSumMr.trim()) finalSumMr = finalSumEn;
      } else {
        if (!finalCropEn.trim()) finalCropEn = formData.cropNameMarathi;
        if (!finalTitleEn.trim()) finalTitleEn = formData.titleMarathi;
        if (!finalSeasonEn.trim()) finalSeasonEn = finalSeasonMr;
        if (!finalStageEn.trim()) finalStageEn = finalStageMr;
        if (!finalObsEn.trim()) finalObsEn = formData.observationMarathi;
        if (!finalPracEn.trim()) finalPracEn = finalPracMr;
        if (!finalSumEn.trim()) finalSumEn = finalSumMr;
      }
    }

    const cropKey = finalCropEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') || formData.cropKey;

    const updatedRecord: FieldExperience = {
      ...formData,
      cropKey,
      cropNameEnglish: finalCropEn,
      cropNameMarathi: finalCropMr,
      titleEnglish: finalTitleEn,
      titleMarathi: finalTitleMr,
      seasonEnglish: finalSeasonEn,
      seasonMarathi: finalSeasonMr,
      stageEnglish: finalStageEn,
      stageMarathi: finalStageMr,
      observationEnglish: finalObsEn,
      observationMarathi: finalObsMr,
      practiceEnglish: finalPracEn || primaryPrac,
      practiceMarathi: finalPracMr || primaryPrac,
      summaryEnglish: finalSumEn || primaryObs.slice(0, 100),
      summaryMarathi: finalSumMr || primaryObs.slice(0, 100),
      translationSource: contentLang,
      customTranslation: isCounterpartOverridden
    };

    onSave(updatedRecord);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fe-modal-title"
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 ring-1 ring-black/[0.03]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-emerald-800 shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 id="fe-modal-title" className="text-base font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                {isEdit 
                  ? (lang === 'mr' ? 'शेती अनुभव नोंद संपादित करा' : 'Edit Field Experience Record')
                  : (lang === 'mr' ? 'नवीन शेती अनुभव नोंद जोडा' : 'Add Field Experience Record')}
              </h2>
              <p className="text-2xs text-stone-500 leading-relaxed">
                {lang === 'mr'
                  ? 'एका भाषेत शेती निरीक्षणे व सल्ला जोडा, दुसरी भाषा आपोआप तयार होईल.'
                  : 'Enter agronomic observations in one language. Counterpart language is auto-generated.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="leading-relaxed">{validationError}</span>
            </div>
          )}

          {/* Single-Language Toolbar */}
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
          <div className="space-y-4 p-5 rounded-2xl bg-white border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-2 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>
                  {contentLang === 'en'
                    ? (lang === 'mr' ? 'इंग्रजी माहिती (मुख्य इनपुट)' : 'English Content (Primary Input)')
                    : (lang === 'mr' ? 'मराठी माहिती (मुख्य इनपुट)' : 'Marathi Content (Primary Input)')}
                </span>
              </span>
              <span className="text-3xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {contentLang === 'en' ? 'Active: English' : 'Active: मराठी'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop Name */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
                  {contentLang === 'en'
                    ? (lang === 'mr' ? 'पिकाचे नाव (इंग्रजी) *' : 'Crop Name (English) *')
                    : (lang === 'mr' ? 'पिकाचे नाव (मराठी) *' : 'Crop Name (Marathi) *')}
                </label>
                <input
                  type="text"
                  required
                  value={contentLang === 'en' ? formData.cropNameEnglish : formData.cropNameMarathi}
                  onChange={(e) => {
                    setValidationError(null);
                    const val = e.target.value;
                    if (contentLang === 'en') {
                      setFormData((prev) => ({
                        ...prev,
                        cropNameEnglish: val,
                        cropKey: val.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      }));
                    } else {
                      setFormData((prev) => ({ ...prev, cropNameMarathi: val }));
                    }
                  }}
                  placeholder={contentLang === 'en' ? 'e.g. Soybean, Ginger, Cotton...' : 'उदा. सोयाबीन, आले (अद्रक), कापूस...'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
                  {contentLang === 'en'
                    ? (lang === 'mr' ? 'नोंद शीर्षक (इंग्रजी) *' : 'Record Title (English) *')
                    : (lang === 'mr' ? 'नोंद शीर्षक (मराठी) *' : 'Record Title (Marathi) *')}
                </label>
                <input
                  type="text"
                  required
                  value={contentLang === 'en' ? formData.titleEnglish : formData.titleMarathi}
                  onChange={(e) => {
                    setValidationError(null);
                    const val = e.target.value;
                    if (contentLang === 'en') {
                      setFormData((prev) => ({ ...prev, titleEnglish: val }));
                    } else {
                      setFormData((prev) => ({ ...prev, titleMarathi: val }));
                    }
                  }}
                  placeholder={
                    contentLang === 'en'
                      ? 'Field Observation: Crop Vigor & Vegetative Stage...'
                      : 'शेती निरीक्षण: पीक जोमदार वाढ व शाकीय अवस्था...'
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Season */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
                  {contentLang === 'en'
                    ? (lang === 'mr' ? 'हंगाम (इंग्रजी)' : 'Season (English)')
                    : (lang === 'mr' ? 'हंगाम (मराठी)' : 'Season (Marathi)')}
                </label>
                <input
                  type="text"
                  value={contentLang === 'en' ? (formData.seasonEnglish || '') : (formData.seasonMarathi || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (contentLang === 'en') {
                      setFormData((prev) => ({ ...prev, seasonEnglish: val }));
                    } else {
                      setFormData((prev) => ({ ...prev, seasonMarathi: val }));
                    }
                  }}
                  placeholder={contentLang === 'en' ? 'Kharif / Rabi' : 'खरीप / रब्बी'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
                  {contentLang === 'en'
                    ? (lang === 'mr' ? 'पीक वाढीची अवस्था (इंग्रजी)' : 'Growth Stage (English)')
                    : (lang === 'mr' ? 'पीक वाढीची अवस्था (मराठी)' : 'Growth Stage (Marathi)')}
                </label>
                <input
                  type="text"
                  value={contentLang === 'en' ? (formData.stageEnglish || '') : (formData.stageMarathi || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (contentLang === 'en') {
                      setFormData((prev) => ({ ...prev, stageEnglish: val }));
                    } else {
                      setFormData((prev) => ({ ...prev, stageMarathi: val }));
                    }
                  }}
                  placeholder={contentLang === 'en' ? 'Flowering (45-60 Days)' : 'फुलोरा अवस्था (४५-६० दिवस)'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
                />
              </div>
            </div>

            {/* Observation */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
                {contentLang === 'en'
                  ? (lang === 'mr' ? 'प्रत्यक्ष निरीक्षण (इंग्रजी) *' : 'Field Observation (English) *')
                  : (lang === 'mr' ? 'प्रत्यक्ष निरीक्षण (मराठी) *' : 'Field Observation (Marathi) *')}
              </label>
              <textarea
                rows={3}
                required
                value={contentLang === 'en' ? formData.observationEnglish : formData.observationMarathi}
                onChange={(e) => {
                  setValidationError(null);
                  const val = e.target.value;
                  if (contentLang === 'en') {
                    setFormData((prev) => ({ ...prev, observationEnglish: val }));
                  } else {
                    setFormData((prev) => ({ ...prev, observationMarathi: val }));
                  }
                }}
                placeholder={
                  contentLang === 'en'
                    ? 'Early vegetative development showed balanced branching under timely micronutrient application...'
                    : 'योग्य वेळी सूक्ष्म अन्नद्रव्ये दिल्याने सुरुवातीच्या शाकीय वाढीत फुटवे उत्तम झाले...'
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
              />
            </div>

            {/* Practice / Advisory */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
                {contentLang === 'en'
                  ? (lang === 'mr' ? 'शेती सल्ला / पद्धत (इंग्रजी)' : 'Practical Technique / Advisory (English)')
                  : (lang === 'mr' ? 'शेती सल्ला / पद्धत (मराठी)' : 'Practical Technique / Advisory (Marathi)')}
              </label>
              <textarea
                rows={2}
                value={contentLang === 'en' ? (formData.practiceEnglish || '') : (formData.practiceMarathi || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (contentLang === 'en') {
                    setFormData((prev) => ({ ...prev, practiceEnglish: val }));
                  } else {
                    setFormData((prev) => ({ ...prev, practiceMarathi: val }));
                  }
                }}
                placeholder={
                  contentLang === 'en'
                    ? 'Apply balanced nutrition and monitor for stem fly during early monsoon...'
                    : 'सुरुवातीच्या पावसाळ्यात खोडमाशीवर लक्ष ठेवून संतुलित पोषण द्यावे...'
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Collapsible Counterpart Review / Override Drawer */}
          <TranslationReviewDrawer
            adminLang={lang}
            targetLang={targetLang}
            isModified={isCounterpartOverridden}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                    {targetLang === 'mr'
                      ? (lang === 'mr' ? 'पिकाचे नाव (मराठी भाषांतर)' : 'Crop Name (Marathi Translation)')
                      : (lang === 'mr' ? 'पिकाचे नाव (इंग्रजी भाषांतर)' : 'Crop Name (English Translation)')}
                  </label>
                  <input
                    type="text"
                    value={targetLang === 'mr' ? formData.cropNameMarathi : formData.cropNameEnglish}
                    onChange={(e) => {
                      setIsCounterpartOverridden(true);
                      const val = e.target.value;
                      if (targetLang === 'mr') {
                        setFormData((prev) => ({ ...prev, cropNameMarathi: val }));
                      } else {
                        setFormData((prev) => ({ ...prev, cropNameEnglish: val }));
                      }
                    }}
                    placeholder={targetLang === 'mr' ? 'उदा. सोयाबीन' : 'e.g. Soybean'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                    {targetLang === 'mr'
                      ? (lang === 'mr' ? 'नोंद शीर्षक (मराठी भाषांतर)' : 'Title (Marathi Translation)')
                      : (lang === 'mr' ? 'नोंद शीर्षक (इंग्रजी भाषांतर)' : 'Title (English Translation)')}
                  </label>
                  <input
                    type="text"
                    value={targetLang === 'mr' ? formData.titleMarathi : formData.titleEnglish}
                    onChange={(e) => {
                      setIsCounterpartOverridden(true);
                      const val = e.target.value;
                      if (targetLang === 'mr') {
                        setFormData((prev) => ({ ...prev, titleMarathi: val }));
                      } else {
                        setFormData((prev) => ({ ...prev, titleEnglish: val }));
                      }
                    }}
                    placeholder={targetLang === 'mr' ? 'शेती निरीक्षण...' : 'Field Observation...'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                    {targetLang === 'mr' ? 'हंगाम (मराठी)' : 'Season (English)'}
                  </label>
                  <input
                    type="text"
                    value={targetLang === 'mr' ? (formData.seasonMarathi || '') : (formData.seasonEnglish || '')}
                    onChange={(e) => {
                      setIsCounterpartOverridden(true);
                      const val = e.target.value;
                      if (targetLang === 'mr') {
                        setFormData((prev) => ({ ...prev, seasonMarathi: val }));
                      } else {
                        setFormData((prev) => ({ ...prev, seasonEnglish: val }));
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                    {targetLang === 'mr' ? 'पीक वाढ अवस्था (मराठी)' : 'Growth Stage (English)'}
                  </label>
                  <input
                    type="text"
                    value={targetLang === 'mr' ? (formData.stageMarathi || '') : (formData.stageEnglish || '')}
                    onChange={(e) => {
                      setIsCounterpartOverridden(true);
                      const val = e.target.value;
                      if (targetLang === 'mr') {
                        setFormData((prev) => ({ ...prev, stageMarathi: val }));
                      } else {
                        setFormData((prev) => ({ ...prev, stageEnglish: val }));
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 leading-relaxed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                  {targetLang === 'mr'
                    ? (lang === 'mr' ? 'प्रत्यक्ष निरीक्षण (मराठी भाषांतर)' : 'Observation (Marathi Translation)')
                    : (lang === 'mr' ? 'प्रत्यक्ष निरीक्षण (इंग्रजी भाषांतर)' : 'Observation (English Translation)')}
                </label>
                <textarea
                  rows={2}
                  value={targetLang === 'mr' ? formData.observationMarathi : formData.observationEnglish}
                  onChange={(e) => {
                    setIsCounterpartOverridden(true);
                    const val = e.target.value;
                    if (targetLang === 'mr') {
                      setFormData((prev) => ({ ...prev, observationMarathi: val }));
                    } else {
                      setFormData((prev) => ({ ...prev, observationEnglish: val }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                  {targetLang === 'mr'
                    ? (lang === 'mr' ? 'शेती सल्ला / पद्धत (मराठी भाषांतर)' : 'Advisory / Technique (Marathi Translation)')
                    : (lang === 'mr' ? 'शेती सल्ला / पद्धत (इंग्रजी भाषांतर)' : 'Advisory / Technique (English Translation)')}
                </label>
                <textarea
                  rows={2}
                  value={targetLang === 'mr' ? (formData.practiceMarathi || '') : (formData.practiceEnglish || '')}
                  onChange={(e) => {
                    setIsCounterpartOverridden(true);
                    const val = e.target.value;
                    if (targetLang === 'mr') {
                      setFormData((prev) => ({ ...prev, practiceMarathi: val }));
                    } else {
                      setFormData((prev) => ({ ...prev, practiceEnglish: val }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </TranslationReviewDrawer>

          {/* Related Products Connection */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" />
              <label className="block text-xs font-bold text-stone-800 leading-relaxed">
                {lang === 'mr' ? 'संबंधित कृषी उत्पादने (Related Product IDs)' : 'Related Agricultural Inputs'}
              </label>
            </div>
            <p className="text-3xs text-stone-500 leading-relaxed">
              {lang === 'mr' 
                ? 'या अनुभवाशी जोडण्यासाठी उपलब्ध उत्पादने निवडा. अस्तित्वात असलेलेच आयडी जोडले जातात.' 
                : 'Select matching inputs from your verified product catalog. Prevents broken ID links.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = (formData.relatedProductIds || []).includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleToggleProductRelation(p.id)}
                    className={`p-2.5 rounded-xl text-left border flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs' 
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={isSelected}
                      className="w-3.5 h-3.5 text-emerald-600 rounded border-stone-300 pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-relaxed">
                        {lang === 'mr' ? p.nameMarathi : p.nameEnglish}
                      </div>
                      <div className="text-3xs text-stone-400 font-mono">
                        {p.id}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Checkbox */}
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="fe-sample"
              checked={formData.isSample}
              onChange={(e) => setFormData((prev) => ({ ...prev, isSample: e.target.checked }))}
              className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="fe-sample" className="text-xs font-bold text-stone-800 cursor-pointer select-none leading-relaxed">
              {lang === 'mr' ? 'नमुना नोंद बॅज लावा (Mark as Demonstration/Sample Record)' : 'Mark as Demonstration / Sample Record'}
            </label>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              disabled={isSaving || isTranslating}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || isTranslating}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600/70 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              {isSaving || isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="leading-relaxed">{lang === 'mr' ? 'भाषांतर व जतन...' : 'Translating & Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="leading-relaxed">{isEdit 
                    ? (lang === 'mr' ? 'बदल जतन करा' : 'Save Changes')
                    : (lang === 'mr' ? 'नोंद जोडा' : 'Add Record')
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
