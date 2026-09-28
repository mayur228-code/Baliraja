import { useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { 
  Save, 
  ShieldCheck, 
  Info, 
  Loader2, 
  AlertCircle,
  Upload,
  RefreshCw,
  CheckCircle2,
  User,
  Building2,
  FileText
} from 'lucide-react';
import type { Language, OwnerProfile, VerifiedBusinessInfo } from '../../types';
import { useContentStore } from '../data/contentStore';
import { ContentLanguageSelector } from '../components/ContentLanguageSelector';
import { TranslationReviewDrawer } from '../components/TranslationReviewDrawer';
import { translateText } from '../services/translationService';
import { uploadImageToServer } from '../services/uploadService';

interface AboutManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const AboutManager: FC<AboutManagerProps> = ({ lang, onShowToast }) => {
  const { businessInfo, ownerProfile, saveBusinessInfo, saveOwnerProfile } = useContentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contentLang, setContentLang] = useState<Language>(lang);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCounterpartOverridden, setIsCounterpartOverridden] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [ownerData, setOwnerData] = useState<OwnerProfile>({ 
    ...ownerProfile,
    image: ownerProfile.image || '/assets/owner.png'
  });
  const [bizData, setBizData] = useState<VerifiedBusinessInfo>({ ...businessInfo });

  const targetLang: Language = contentLang === 'en' ? 'mr' : 'en';

  const bothLanguagesReady = Boolean(
    ownerData.name.trim() &&
    ownerData.nameMr.trim() &&
    ownerData.village.en.trim() &&
    ownerData.village.mr.trim()
  );

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Handle photo upload from device -> upload directly to secure server storage
  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError(
        lang === 'mr'
          ? 'कृपया वैध प्रतिमा फाईल निवडा (PNG, JPG, WebP).'
          : 'Please select a valid image file (PNG, JPG, WebP).'
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

    setIsUploadingPhoto(true);
    setValidationError(null);

    try {
      const uploadRes = await uploadImageToServer(file, 'owner');
      if (uploadRes.success && uploadRes.url) {
        setOwnerData((prev) => ({ ...prev, image: uploadRes.url! }));
      } else {
        setValidationError(
          uploadRes.error || (lang === 'mr' ? 'प्रतिमा अपलोड अयशस्वी.' : 'Image upload failed.')
        );
      }
    } catch {
      setValidationError(
        lang === 'mr' ? 'प्रतिमा अपलोड करताना त्रुटी आली.' : 'Failed to upload photo.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Instant Translate Now preview
  const handleManualTranslateNow = async () => {
    const sourceName = contentLang === 'en' ? ownerData.name : ownerData.nameMr;
    const sourceVillage = contentLang === 'en' ? ownerData.village.en : ownerData.village.mr;
    const sourceRole = contentLang === 'en' ? ownerData.role.en : ownerData.role.mr;
    const sourceBio = contentLang === 'en' ? ownerData.bio.en : ownerData.bio.mr;
    const sourceOtherBiz = contentLang === 'en' ? (bizData.otherBusinessNameEn || '') : (bizData.otherBusinessNameMr || '');

    if (!sourceName.trim() && !sourceVillage.trim() && !sourceBio.trim()) {
      setValidationError(
        lang === 'mr'
          ? 'भाषांतर करण्यासाठी प्रथम नाव किंवा माहिती प्रविष्ट करा.'
          : 'Please enter owner name or village details first.'
      );
      return;
    }

    setValidationError(null);
    setIsTranslating(true);

    try {
      if (contentLang === 'en') {
        const [trName, trVillage, trRole, trBio, trBiz] = await Promise.all([
          sourceName.trim() ? translateText(sourceName, 'en', 'mr') : Promise.resolve(''),
          sourceVillage.trim() ? translateText(sourceVillage, 'en', 'mr') : Promise.resolve(''),
          sourceRole.trim() ? translateText(sourceRole, 'en', 'mr') : Promise.resolve(''),
          sourceBio.trim() ? translateText(sourceBio, 'en', 'mr') : Promise.resolve(''),
          sourceOtherBiz.trim() ? translateText(sourceOtherBiz, 'en', 'mr') : Promise.resolve('')
        ]);

        setOwnerData((prev) => ({
          ...prev,
          nameMr: trName || prev.nameMr,
          village: { ...prev.village, mr: trVillage || prev.village.mr },
          role: { ...prev.role, mr: trRole || prev.role.mr },
          bio: { ...prev.bio, mr: trBio || prev.bio.mr }
        }));
        setBizData((prev) => ({
          ...prev,
          ownerNameMr: trName || prev.ownerNameMr,
          nativePlaceMr: trVillage || prev.nativePlaceMr,
          otherBusinessNameMr: trBiz || prev.otherBusinessNameMr
        }));
      } else {
        const [trName, trVillage, trRole, trBio, trBiz] = await Promise.all([
          sourceName.trim() ? translateText(sourceName, 'mr', 'en') : Promise.resolve(''),
          sourceVillage.trim() ? translateText(sourceVillage, 'mr', 'en') : Promise.resolve(''),
          sourceRole.trim() ? translateText(sourceRole, 'mr', 'en') : Promise.resolve(''),
          sourceBio.trim() ? translateText(sourceBio, 'mr', 'en') : Promise.resolve(''),
          sourceOtherBiz.trim() ? translateText(sourceOtherBiz, 'mr', 'en') : Promise.resolve('')
        ]);

        setOwnerData((prev) => ({
          ...prev,
          name: trName || prev.name,
          village: { ...prev.village, en: trVillage || prev.village.en },
          role: { ...prev.role, en: trRole || prev.role.en },
          bio: { ...prev.bio, en: trBio || prev.bio.en }
        }));
        setBizData((prev) => ({
          ...prev,
          ownerNameEn: trName || prev.ownerNameEn,
          nativePlaceEn: trVillage || prev.nativePlaceEn,
          otherBusinessNameEn: trBiz || prev.otherBusinessNameEn
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation error';
      setValidationError(
        lang === 'mr' ? `भाषांतर त्रुटी: ${msg}` : `Translation error: ${msg}`
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveAll = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const primaryName = contentLang === 'en' ? ownerData.name : ownerData.nameMr;
    const primaryVillage = contentLang === 'en' ? ownerData.village.en : ownerData.village.mr;

    if (!primaryName.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'संचालकाचे इंग्रजी नाव आवश्यक आहे.' : 'Owner name (English) is required.')
          : (lang === 'mr' ? 'संचालकाचे मराठी नाव आवश्यक आहे.' : 'Owner name (Marathi) is required.')
      );
      return;
    }

    if (!primaryVillage.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'मूळ गाव (इंग्रजी) आवश्यक आहे.' : 'Native place (English) is required.')
          : (lang === 'mr' ? 'मूळ गाव (मराठी) आवश्यक आहे.' : 'Native place (Marathi) is required.')
      );
      return;
    }

    let finalNameEn = ownerData.name;
    let finalNameMr = ownerData.nameMr;
    let finalVillageEn = ownerData.village.en;
    let finalVillageMr = ownerData.village.mr;
    let finalRoleEn = ownerData.role.en;
    let finalRoleMr = ownerData.role.mr;
    let finalBioEn = ownerData.bio.en;
    let finalBioMr = ownerData.bio.mr;
    let finalOtherBizEn = bizData.otherBusinessNameEn || '';
    let finalOtherBizMr = bizData.otherBusinessNameMr || '';

    if (autoTranslate) {
      setIsSaving(true);
      setIsTranslating(true);

      try {
        if (contentLang === 'en') {
          // Translate English -> Marathi
          if (!finalNameMr.trim() || !isCounterpartOverridden) {
            finalNameMr = await translateText(ownerData.name, 'en', 'mr');
          }
          if (!finalVillageMr.trim() || !isCounterpartOverridden) {
            finalVillageMr = await translateText(ownerData.village.en, 'en', 'mr');
          }
          if (finalRoleEn.trim() && (!finalRoleMr.trim() || !isCounterpartOverridden)) {
            finalRoleMr = await translateText(finalRoleEn, 'en', 'mr');
          }
          if (finalBioEn.trim() && (!finalBioMr.trim() || !isCounterpartOverridden)) {
            finalBioMr = await translateText(finalBioEn, 'en', 'mr');
          }
          if (finalOtherBizEn.trim() && (!finalOtherBizMr.trim() || !isCounterpartOverridden)) {
            finalOtherBizMr = await translateText(finalOtherBizEn, 'en', 'mr');
          }
        } else {
          // Translate Marathi -> English
          if (!finalNameEn.trim() || !isCounterpartOverridden) {
            finalNameEn = await translateText(ownerData.nameMr, 'mr', 'en');
          }
          if (!finalVillageEn.trim() || !isCounterpartOverridden) {
            finalVillageEn = await translateText(ownerData.village.mr, 'mr', 'en');
          }
          if (finalRoleMr.trim() && (!finalRoleEn.trim() || !isCounterpartOverridden)) {
            finalRoleEn = await translateText(finalRoleMr, 'mr', 'en');
          }
          if (finalBioMr.trim() && (!finalBioEn.trim() || !isCounterpartOverridden)) {
            finalBioEn = await translateText(finalBioMr, 'mr', 'en');
          }
          if (finalOtherBizMr.trim() && (!finalOtherBizEn.trim() || !isCounterpartOverridden)) {
            finalOtherBizEn = await translateText(finalOtherBizMr, 'mr', 'en');
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Translation error';
        setValidationError(
          lang === 'mr'
            ? `भाषांतर त्रुटी: ${msg} (तुमचा मजकूर सुरक्षित आहे. तुम्ही पुनरावलोकन ड्रॉवरमध्ये बदल करू शकता.)`
            : `Translation error: ${msg} (Your input is preserved. You may retry or fill manually in review drawer.)`
        );
        setIsSaving(false);
        setIsTranslating(false);
        return;
      } finally {
        setIsSaving(false);
        setIsTranslating(false);
      }
    } else {
      if (contentLang === 'en') {
        if (!finalNameMr.trim()) finalNameMr = ownerData.name;
        if (!finalVillageMr.trim()) finalVillageMr = ownerData.village.en;
        if (!finalRoleMr.trim()) finalRoleMr = finalRoleEn;
        if (!finalBioMr.trim()) finalBioMr = finalBioEn;
        if (!finalOtherBizMr.trim()) finalOtherBizMr = finalOtherBizEn;
      } else {
        if (!finalNameEn.trim()) finalNameEn = ownerData.nameMr;
        if (!finalVillageEn.trim()) finalVillageEn = ownerData.village.mr;
        if (!finalRoleEn.trim()) finalRoleEn = finalRoleMr;
        if (!finalBioEn.trim()) finalBioEn = finalBioMr;
        if (!finalOtherBizEn.trim()) finalOtherBizEn = finalOtherBizMr;
      }
    }

    let finalImage = ownerData.image || ownerProfile.image || '/assets/owner.png';
    if (finalImage && finalImage.startsWith('data:image/')) {
      try {
        const up = await uploadImageToServer(finalImage, 'owner');
        if (up.success && up.url) {
          finalImage = up.url;
        }
      } catch {
        // preserve
      }
    }

    const updatedOwner: OwnerProfile = {
      ...ownerData,
      image: finalImage,
      name: finalNameEn,
      nameMr: finalNameMr,
      village: { en: finalVillageEn, mr: finalVillageMr },
      role: { en: finalRoleEn, mr: finalRoleMr },
      bio: { en: finalBioEn, mr: finalBioMr }
    };

    const updatedBiz: VerifiedBusinessInfo = {
      ...bizData,
      ownerNameEn: finalNameEn,
      ownerNameMr: finalNameMr,
      nativePlaceEn: finalVillageEn,
      nativePlaceMr: finalVillageMr,
      otherBusinessNameEn: finalOtherBizEn,
      otherBusinessNameMr: finalOtherBizMr
    };

    saveOwnerProfile(updatedOwner);
    saveBusinessInfo(updatedBiz);

    setOwnerData(updatedOwner);
    setBizData(updatedBiz);

    onShowToast(
      'success',
      'About and Owner profile information saved successfully.',
      'परिचय आणि संचालक माहिती यशस्वीरित्या जतन केली.'
    );
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Transparency Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3.5 shadow-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block text-amber-950 mb-0.5">
            {lang === 'mr' ? 'व्यवसाय पारदर्शकता मार्गदर्शक' : 'Agricultural Transparency Guidelines'}
          </span>
          {lang === 'mr'
            ? 'गणेश शिंदे (जानेगाव) यांची माहिती प्रमाणित आहे. नमुना मजकूर (Demo Content) शेतकरी विश्वासासाठी स्पष्टपणे दर्शवला जातो. कोणतेही खोटे पुरस्कार अथवा प्रमाणपत्रे जोडू नयेत.'
            : 'Owner details (Ganesh Shinde, Janegaon) are verified. Demonstration fields remain transparently marked. Do NOT fabricate degrees, awards, or government authorizations.'}
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="leading-relaxed">{validationError}</span>
        </div>
      )}

      {/* Content Language Selector */}
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

      {/* Card 0: Centralized Founder Profile Photo (Shared Home & About) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3.5 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
              {lang === 'mr' ? 'संस्थापक प्रोफाइल छायाचित्र (Founder Profile Photo)' : 'Centralized Founder Profile Photo'}
            </h3>
          </div>
          <span className="text-3xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full self-start sm:self-auto">
            {lang === 'mr' ? 'Home व About सामायिक' : 'Shared: Home & About'}
          </span>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          {lang === 'mr'
            ? '💡 हे छायाचित्र एकाच वेळी Home पेजवरील "बळीराजाचे संस्थापक" आणि About पेजवरील "श्री. गणेश भीमराव शिंदे" या दोन्ही विभागांत आपोआप अपडेट होते.'
            : '💡 This single photo is centrally shared. Updating it here immediately propagates to both Home and About story founder sections.'}
        </p>

        {/* Hidden file input for native device upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
          {/* Photo Preview Container */}
          <div className="relative w-36 sm:w-40 aspect-[433/577] rounded-2xl overflow-hidden border-2 border-stone-200 bg-stone-100 shadow-sm shrink-0 group">
            <img
              src={ownerData.image || ownerProfile.image || '/assets/owner.png'}
              alt="Founder Profile Preview"
              className="w-full h-full object-contain select-none"
            />
            <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-2xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-white text-stone-900 rounded-xl text-2xs font-bold shadow-md hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3 text-emerald-700" />
                <span>{lang === 'mr' ? 'बदला' : 'Change'}</span>
              </button>
            </div>
          </div>

          {/* Upload Controls & Actions */}
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="space-y-1">
              <div className="text-xs font-bold text-stone-800 leading-relaxed">
                {lang === 'mr' ? 'डिव्हाइसमधून नवीन छायाचित्र निवडा' : 'Upload Founder Photo From Device'}
              </div>
              <p className="text-2xs text-stone-500">
                {lang === 'mr' 
                  ? 'समर्थित फॉरमॅट्स: PNG, JPG, WebP (कमाल आकार: ५MB)' 
                  : 'Supported formats: PNG, JPG, WebP (Max size: 5MB)'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <button
                type="button"
                disabled={isUploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-98"
              >
                {isUploadingPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {isUploadingPhoto
                    ? (lang === 'mr' ? 'अपलोड होत आहे...' : 'Uploading...')
                    : (lang === 'mr' ? 'फोटो निवडा (Upload Photo)' : 'Upload From Device')}
                </span>
              </button>

              {ownerData.image && ownerData.image !== '/assets/owner.png' && (
                <button
                  type="button"
                  onClick={() => setOwnerData((prev) => ({ ...prev, image: '/assets/owner.png' }))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-98"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{lang === 'mr' ? 'मूळ फोटोवर पूर्ववत करा' : 'Reset to Default'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-2xs text-emerald-700 font-semibold pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'mr' ? 'फोटो तयार आहे • जतन केल्यानंतर दोन्ही पृष्ठांवर दिसेल' : 'Photo ready • Saves to shared data model'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 1: Verified Owner Identity */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
              {lang === 'mr' ? 'संचालक ओळख माहिती (Verified Owner Details)' : 'Verified Proprietor Details'}
            </h3>
          </div>
          <span className="text-3xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
            Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
              {contentLang === 'en'
                ? (lang === 'mr' ? 'संचालकाचे नाव (इंग्रजी) *' : 'Owner Name (English) *')
                : (lang === 'mr' ? 'संचालकाचे नाव (मराठी) *' : 'Owner Name (Marathi) *')}
            </label>
            <input
              type="text"
              required
              value={contentLang === 'en' ? ownerData.name : ownerData.nameMr}
              onChange={(e) => {
                setValidationError(null);
                const val = e.target.value;
                if (contentLang === 'en') {
                  setOwnerData((prev) => ({ ...prev, name: val }));
                  setBizData((prev) => ({ ...prev, ownerNameEn: val }));
                } else {
                  setOwnerData((prev) => ({ ...prev, nameMr: val }));
                  setBizData((prev) => ({ ...prev, ownerNameMr: val }));
                }
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
              {contentLang === 'en'
                ? (lang === 'mr' ? 'मूळ गाव (इंग्रजी) *' : 'Native Place (English) *')
                : (lang === 'mr' ? 'मूळ गाव (मराठी) *' : 'Native Place (Marathi) *')}
            </label>
            <input
              type="text"
              required
              value={contentLang === 'en' ? ownerData.village.en : ownerData.village.mr}
              onChange={(e) => {
                setValidationError(null);
                const val = e.target.value;
                if (contentLang === 'en') {
                  setOwnerData((prev) => ({ ...prev, village: { ...prev.village, en: val } }));
                  setBizData((prev) => ({ ...prev, nativePlaceEn: val }));
                } else {
                  setOwnerData((prev) => ({ ...prev, village: { ...prev.village, mr: val } }));
                  setBizData((prev) => ({ ...prev, nativePlaceMr: val }));
                }
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
              {contentLang === 'en'
                ? (lang === 'mr' ? 'भूमिका (इंग्रजी)' : 'Role / Title (English)')
                : (lang === 'mr' ? 'भूमिका (मराठी)' : 'Role / Title (Marathi)')}
            </label>
            <input
              type="text"
              value={contentLang === 'en' ? ownerData.role.en : ownerData.role.mr}
              onChange={(e) => {
                const val = e.target.value;
                if (contentLang === 'en') {
                  setOwnerData((prev) => ({ ...prev, role: { ...prev.role, en: val } }));
                } else {
                  setOwnerData((prev) => ({ ...prev, role: { ...prev.role, mr: val } }));
                }
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Biography & Experience */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3.5 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                {lang === 'mr' ? 'परिचय व शेती सल्ला दृष्टिकोन' : 'Biography & Agricultural Approach'}
              </h3>
              <p className="text-2xs text-stone-500 leading-relaxed">
                {lang === 'mr' ? 'अधिकृत व्यक्तिगत माहिती उपलब्ध होईपर्यंत नमुना म्हणून दर्शवली जाते.' : 'Marked as demo until official biographical interview is confirmed.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input
              type="checkbox"
              id="demo-content-flag"
              checked={Boolean(ownerData.isDemoContent)}
              onChange={(e) => setOwnerData((prev) => ({ ...prev, isDemoContent: e.target.checked }))}
              className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="demo-content-flag" className="text-xs font-bold text-stone-700 cursor-pointer select-none leading-relaxed">
              {lang === 'mr' ? 'नमुना मजकूर बॅज (Demo Badge)' : 'Demo Content Status'}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
            {contentLang === 'en'
              ? (lang === 'mr' ? 'संचालक परिचय (इंग्रजी)' : 'Owner Biography (English)')
              : (lang === 'mr' ? 'संचालक परिचय (मराठी)' : 'Owner Biography (Marathi)')}
          </label>
          <textarea
            rows={3}
            value={contentLang === 'en' ? ownerData.bio.en : ownerData.bio.mr}
            onChange={(e) => {
              const val = e.target.value;
              if (contentLang === 'en') {
                setOwnerData((prev) => ({ ...prev, bio: { ...prev.bio, en: val } }));
              } else {
                setOwnerData((prev) => ({ ...prev, bio: { ...prev.bio, mr: val } }));
              }
            }}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
          />
        </div>
      </div>

      {/* Card 3: Other Business Entity */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-4">
        <div className="border-b border-stone-100 pb-3.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
              {lang === 'mr' ? 'इतर स्वतंत्र व्यवसाय (Other Business Entity)' : 'Other Business Entity'}
            </h3>
            <p className="text-2xs text-stone-500 leading-relaxed">
              {lang === 'mr' ? 'संचालकांशी संबंधित स्वतंत्र उपक्रम (उदा. बळीराजा ज्वेलर्स).' : 'Non-agricultural commercial enterprise associated with proprietor.'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
            {contentLang === 'en'
              ? (lang === 'mr' ? 'इतर व्यवसाय नाव (इंग्रजी)' : 'Other Business Name (English)')
              : (lang === 'mr' ? 'इतर व्यवसाय नाव (मराठी)' : 'Other Business Name (Marathi)')}
          </label>
          <input
            type="text"
            value={contentLang === 'en' ? (bizData.otherBusinessNameEn || '') : (bizData.otherBusinessNameMr || '')}
            onChange={(e) => {
              const val = e.target.value;
              if (contentLang === 'en') {
                setBizData((prev) => ({ ...prev, otherBusinessNameEn: val }));
              } else {
                setBizData((prev) => ({ ...prev, otherBusinessNameMr: val }));
              }
            }}
            placeholder={contentLang === 'en' ? 'e.g. Baliraja Jewellers' : 'उदा. बळीराजा ज्वेलर्स'}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                {targetLang === 'mr' ? 'संचालकाचे नाव (मराठी भाषांतर)' : 'Owner Name (English Translation)'}
              </label>
              <input
                type="text"
                value={targetLang === 'mr' ? ownerData.nameMr : ownerData.name}
                onChange={(e) => {
                  setIsCounterpartOverridden(true);
                  const val = e.target.value;
                  if (targetLang === 'mr') {
                    setOwnerData((prev) => ({ ...prev, nameMr: val }));
                    setBizData((prev) => ({ ...prev, ownerNameMr: val }));
                  } else {
                    setOwnerData((prev) => ({ ...prev, name: val }));
                    setBizData((prev) => ({ ...prev, ownerNameEn: val }));
                  }
                }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                {targetLang === 'mr' ? 'मूळ गाव (मराठी)' : 'Native Place (English)'}
              </label>
              <input
                type="text"
                value={targetLang === 'mr' ? ownerData.village.mr : ownerData.village.en}
                onChange={(e) => {
                  setIsCounterpartOverridden(true);
                  const val = e.target.value;
                  if (targetLang === 'mr') {
                    setOwnerData((prev) => ({ ...prev, village: { ...prev.village, mr: val } }));
                    setBizData((prev) => ({ ...prev, nativePlaceMr: val }));
                  } else {
                    setOwnerData((prev) => ({ ...prev, village: { ...prev.village, en: val } }));
                    setBizData((prev) => ({ ...prev, nativePlaceEn: val }));
                  }
                }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                {targetLang === 'mr' ? 'भूमिका (मराठी)' : 'Role / Title (English)'}
              </label>
              <input
                type="text"
                value={targetLang === 'mr' ? ownerData.role.mr : ownerData.role.en}
                onChange={(e) => {
                  setIsCounterpartOverridden(true);
                  const val = e.target.value;
                  if (targetLang === 'mr') {
                    setOwnerData((prev) => ({ ...prev, role: { ...prev.role, mr: val } }));
                  } else {
                    setOwnerData((prev) => ({ ...prev, role: { ...prev.role, en: val } }));
                  }
                }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {targetLang === 'mr' ? 'संचालक परिचय (मराठी भाषांतर)' : 'Owner Biography (English Translation)'}
            </label>
            <textarea
              rows={2}
              value={targetLang === 'mr' ? ownerData.bio.mr : ownerData.bio.en}
              onChange={(e) => {
                setIsCounterpartOverridden(true);
                const val = e.target.value;
                if (targetLang === 'mr') {
                  setOwnerData((prev) => ({ ...prev, bio: { ...prev.bio, mr: val } }));
                } else {
                  setOwnerData((prev) => ({ ...prev, bio: { ...prev.bio, en: val } }));
                }
              }}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {targetLang === 'mr' ? 'इतर व्यवसाय नाव (मराठी)' : 'Other Business Name (English)'}
            </label>
            <input
              type="text"
              value={targetLang === 'mr' ? (bizData.otherBusinessNameMr || '') : (bizData.otherBusinessNameEn || '')}
              onChange={(e) => {
                setIsCounterpartOverridden(true);
                const val = e.target.value;
                if (targetLang === 'mr') {
                  setBizData((prev) => ({ ...prev, otherBusinessNameMr: val }));
                } else {
                  setBizData((prev) => ({ ...prev, otherBusinessNameEn: val }));
                }
              }}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 leading-relaxed"
            />
          </div>
        </div>
      </TranslationReviewDrawer>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving || isTranslating}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-2 disabled:opacity-75 active:scale-98"
        >
          {isSaving || isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="leading-relaxed">{lang === 'mr' ? 'भाषांतर व जतन...' : 'Translating & Saving...'}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="leading-relaxed">{lang === 'mr' ? 'परिचय माहिती जतन करा' : 'Save About & Owner Data'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
