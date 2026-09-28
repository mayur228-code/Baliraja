import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { 
  Save, 
  Phone, 
  MapPin, 
  Info,
  Loader2,
  AlertCircle,
  Building2,
  Share2,
  Compass
} from 'lucide-react';
import { InstagramIcon } from '../../components/common/InstagramIcon';
import type { Language, VerifiedBusinessInfo } from '../../types';
import { useContentStore } from '../data/contentStore';
import { ContentLanguageSelector } from '../components/ContentLanguageSelector';
import { TranslationReviewDrawer } from '../components/TranslationReviewDrawer';
import { translateText } from '../services/translationService';

interface ContactLocationManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const ContactLocationManager: FC<ContactLocationManagerProps> = ({ lang, onShowToast }) => {
  const { businessInfo, saveBusinessInfo } = useContentStore();

  const [contentLang, setContentLang] = useState<Language>(lang);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCounterpartOverridden, setIsCounterpartOverridden] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState<VerifiedBusinessInfo>({ ...businessInfo });

  const targetLang: Language = contentLang === 'en' ? 'mr' : 'en';

  const bothLanguagesReady = Boolean(
    formData.shopAddressEn.trim() &&
    formData.shopAddressMr.trim()
  );

  const handleManualTranslateNow = async () => {
    const sourceAddress = contentLang === 'en' ? formData.shopAddressEn : formData.shopAddressMr;

    if (!sourceAddress.trim()) {
      setValidationError(
        lang === 'mr' ? 'भाषांतर करण्यासाठी प्रथम पत्ता प्रविष्ट करा.' : 'Please enter shop address first.'
      );
      return;
    }

    setValidationError(null);
    setIsTranslating(true);

    try {
      if (contentLang === 'en') {
        const trAddr = await translateText(sourceAddress, 'en', 'mr');
        setFormData((prev) => ({
          ...prev,
          shopAddressMr: trAddr || prev.shopAddressMr,
          location: { ...prev.location, addressMr: trAddr || prev.location.addressMr }
        }));
      } else {
        const trAddr = await translateText(sourceAddress, 'mr', 'en');
        setFormData((prev) => ({
          ...prev,
          shopAddressEn: trAddr || prev.shopAddressEn,
          location: { ...prev.location, addressEn: trAddr || prev.location.addressEn }
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation error';
      setValidationError(lang === 'mr' ? `भाषांतर त्रुटी: ${msg}` : `Translation error: ${msg}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const primaryAddress = contentLang === 'en' ? formData.shopAddressEn : formData.shopAddressMr;

    if (!primaryAddress.trim()) {
      setValidationError(
        contentLang === 'en'
          ? (lang === 'mr' ? 'दुकानाचा पत्ता (इंग्रजी) आवश्यक आहे.' : 'Shop address (English) is required.')
          : (lang === 'mr' ? 'दुकानाचा पत्ता (मराठी) आवश्यक आहे.' : 'Shop address (Marathi) is required.')
      );
      return;
    }

    let finalAddrEn = formData.shopAddressEn;
    let finalAddrMr = formData.shopAddressMr;

    if (autoTranslate) {
      setIsSaving(true);
      setIsTranslating(true);

      try {
        if (contentLang === 'en') {
          if (!finalAddrMr.trim() || !isCounterpartOverridden) {
            finalAddrMr = await translateText(formData.shopAddressEn, 'en', 'mr');
          }
        } else {
          if (!finalAddrEn.trim() || !isCounterpartOverridden) {
            finalAddrEn = await translateText(formData.shopAddressMr, 'mr', 'en');
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Translation error';
        setValidationError(
          lang === 'mr'
            ? `पत्ता भाषांतर त्रुटी: ${msg} (तुमचा पत्ता सुरक्षित आहे. तुम्ही ड्रॉवरमध्ये बदल करू शकता.)`
            : `Address translation error: ${msg} (Your input is preserved. You may fill review drawer manually.)`
        );
        setIsSaving(false);
        setIsTranslating(false);
        return;
      } finally {
        setIsSaving(false);
        setIsTranslating(false);
      }
    } else {
      if (contentLang === 'en' && !finalAddrMr.trim()) {
        finalAddrMr = finalAddrEn;
      } else if (contentLang === 'mr' && !finalAddrEn.trim()) {
        finalAddrEn = finalAddrMr;
      }
    }

    const updatedData: VerifiedBusinessInfo = {
      ...formData,
      shopAddressEn: finalAddrEn,
      shopAddressMr: finalAddrMr,
      location: {
        ...formData.location,
        addressEn: finalAddrEn,
        addressMr: finalAddrMr
      }
    };

    saveBusinessInfo(updatedData);
    setFormData(updatedData);

    onShowToast(
      'success',
      'Contact and Location settings saved.',
      'संपर्क व पत्ता माहिती यशस्वीरित्या जतन केली.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Guidance Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-100/90 border border-stone-200 text-stone-800 text-xs flex items-start gap-3.5 shadow-xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block text-stone-900 mb-0.5">
            {lang === 'mr' ? 'अधिकृत संपर्क व नकाशा नियम' : 'Contact & Location Credibility Guidelines'}
          </span>
          {lang === 'mr'
            ? 'कैज येथील मंगळवार पेठेतील पत्ता, फोन व व्हॉट्सॲप प्रमाणित आहेत. इन्स्टाग्राम खाते अधिकृतपणे सुरू होईपर्यंत रिक्त ठेवावे. खोटे निर्देशांक (Coordinates) जोडू नयेत.'
            : 'Phone, WhatsApp, and Mangalwar Peth Kaij address are verified business details. Instagram remains empty until an official profile is created. Do NOT invent fake coordinates.'}
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="leading-relaxed">{validationError}</span>
        </div>
      )}

      {/* Content Language Selector for address entry */}
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

      {/* Card 1: Shop Identity */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-4">
        <div className="border-b border-stone-100 pb-3.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
            {lang === 'mr' ? 'केंद्राचे नाव (Shop Name)' : 'Shop Identity'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'केंद्राचे नाव (मराठी) *' : 'Shop Name (Marathi) *'}
            </label>
            <input
              type="text"
              required
              value={formData.businessNameMr}
              onChange={(e) => setFormData((prev) => ({ ...prev, businessNameMr: e.target.value }))}
              placeholder="बळीराजा कृषी सेवा केंद्र"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'केंद्राचे नाव (इंग्रजी) *' : 'Shop Name (English) *'}
            </label>
            <input
              type="text"
              required
              value={formData.businessNameEn}
              onChange={(e) => setFormData((prev) => ({ ...prev, businessNameEn: e.target.value }))}
              placeholder="Baliraja Krishi Seva Kendra"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed font-medium"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Direct Communication Channels */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-4">
        <div className="border-b border-stone-100 pb-3.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
            {lang === 'mr' ? 'थेट संपर्क वाहिन्या' : 'Direct Communication Channels'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'फोन क्रमांक *' : 'Phone Number *'}
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="9881070520"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'व्हॉट्सॲप क्रमांक *' : 'WhatsApp Number *'}
            </label>
            <input
              type="text"
              required
              value={formData.whatsapp}
              onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
              placeholder="9881070520"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'ईमेल पत्ता *' : 'Email Address *'}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder={lang === 'mr' ? 'उदा. contact@baliraja.in' : 'e.g. contact@baliraja.in'}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Card 3: Shop Physical Address & Location */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-4">
        <div className="border-b border-stone-100 pb-3.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
            {lang === 'mr' ? 'दुकानाचा प्रत्यक्ष पत्ता व नकाशा' : 'Physical Shop Location & Map in Kaij'}
          </h3>
        </div>

        {/* Primary Address Input */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5 leading-relaxed">
            {contentLang === 'en'
              ? (lang === 'mr' ? 'संपूर्ण पत्ता (इंग्रजी) *' : 'Full Address (English) *')
              : (lang === 'mr' ? 'संपूर्ण पत्ता (मराठी) *' : 'Full Address (Marathi) *')}
          </label>
          <textarea
            rows={2}
            required
            value={contentLang === 'en' ? formData.shopAddressEn : formData.shopAddressMr}
            onChange={(e) => {
              setValidationError(null);
              const val = e.target.value;
              if (contentLang === 'en') {
                setFormData((prev) => ({ 
                  ...prev, 
                  shopAddressEn: val,
                  location: { ...prev.location, addressEn: val }
                }));
              } else {
                setFormData((prev) => ({ 
                  ...prev, 
                  shopAddressMr: val,
                  location: { ...prev.location, addressMr: val }
                }));
              }
            }}
            placeholder={
              contentLang === 'en'
                ? 'e.g. Near Old Bus Stand, Mangalwar Peth, Kaij, Dist. Beed - 431123'
                : 'उदा. जुन्या बस स्टँडजवळ, मंगळवार पेठ, कैज, जि. बीड - ४३११२३'
            }
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs leading-relaxed"
          />
        </div>

        {/* Counterpart Review Drawer */}
        <TranslationReviewDrawer
          adminLang={lang}
          targetLang={targetLang}
          isModified={isCounterpartOverridden}
        >
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {targetLang === 'mr' ? 'संपूर्ण पत्ता (मराठी भाषांतर)' : 'Full Address (English Translation)'}
            </label>
            <textarea
              rows={2}
              value={targetLang === 'mr' ? formData.shopAddressMr : formData.shopAddressEn}
              onChange={(e) => {
                setIsCounterpartOverridden(true);
                const val = e.target.value;
                if (targetLang === 'mr') {
                  setFormData((prev) => ({ 
                    ...prev, 
                    shopAddressMr: val,
                    location: { ...prev.location, addressMr: val }
                  }));
                } else {
                  setFormData((prev) => ({ 
                    ...prev, 
                    shopAddressEn: val,
                    location: { ...prev.location, addressEn: val }
                  }));
                }
              }}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none leading-relaxed"
            />
          </div>
        </TranslationReviewDrawer>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'तालुका / शहर' : 'City / Taluka'}
            </label>
            <input
              type="text"
              value={formData.location.cityEn}
              onChange={(e) => setFormData((prev) => ({ 
                ...prev, 
                location: { ...prev.location, cityEn: e.target.value, cityMr: e.target.value }
              }))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'जिल्हा' : 'District'}
            </label>
            <input
              type="text"
              value={formData.location.districtEn}
              onChange={(e) => setFormData((prev) => ({ 
                ...prev, 
                location: { ...prev.location, districtEn: e.target.value, districtMr: e.target.value }
              }))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'पिनकोड' : 'Pincode'}
            </label>
            <input
              type="text"
              value={formData.location.pincode}
              onChange={(e) => setFormData((prev) => ({ 
                ...prev, 
                location: { ...prev.location, pincode: e.target.value }
              }))}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Coordinates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5 leading-relaxed">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'mr' ? 'अक्षांश (Latitude) *' : 'Latitude *'}</span>
            </label>
            <input
              type="number"
              step="any"
              value={formData.location.latitude ?? 18.7042}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                setFormData((prev) => {
                  const lng = prev.location.longitude ?? 75.9556;
                  const newLat = isNaN(lat) ? 18.7042 : lat;
                  return {
                    ...prev,
                    location: {
                      ...prev.location,
                      latitude: isNaN(lat) ? undefined : lat,
                      googleMapsExternalUrl: prev.location.googleMapsExternalUrl.includes('query=')
                        ? `https://www.google.com/maps/search/?api=1&query=${newLat},${lng}`
                        : prev.location.googleMapsExternalUrl
                    }
                  };
                });
              }}
              placeholder="18.7042"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs font-mono"
            />
            <span className="text-3xs text-stone-400 mt-1 block leading-relaxed">
              {lang === 'mr' ? 'मुख्य पृष्ठावरील नकाशा केंद्रबिंदू व मार्कर आपोआप हलतील.' : 'Interactive Leaflet map center & marker move automatically.'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5 leading-relaxed">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'mr' ? 'रेखांश (Longitude) *' : 'Longitude *'}</span>
            </label>
            <input
              type="number"
              step="any"
              value={formData.location.longitude ?? 75.9556}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                setFormData((prev) => {
                  const lat = prev.location.latitude ?? 18.7042;
                  const newLng = isNaN(lng) ? 75.9556 : lng;
                  return {
                    ...prev,
                    location: {
                      ...prev.location,
                      longitude: isNaN(lng) ? undefined : lng,
                      googleMapsExternalUrl: prev.location.googleMapsExternalUrl.includes('query=')
                        ? `https://www.google.com/maps/search/?api=1&query=${lat},${newLng}`
                        : prev.location.googleMapsExternalUrl
                    }
                  };
                });
              }}
              placeholder="75.9556"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs font-mono"
            />
            <span className="text-3xs text-stone-400 mt-1 block leading-relaxed">
              {lang === 'mr' ? 'नकाशा व Get Directions साठी अचूक रेखांश.' : 'Accurate longitude for map rendering & navigation.'}
            </span>
          </div>
        </div>

        {/* External Navigation Link */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
            {lang === 'mr' ? 'गुगल मॅप्स नेव्हिगेशन लिंक (Get Directions URL)' : 'Google Maps Navigation URL (Get Directions Button)'}
          </label>
          <input
            type="text"
            value={formData.location.googleMapsExternalUrl}
            onChange={(e) => setFormData((prev) => ({ 
              ...prev, 
              location: { ...prev.location, googleMapsExternalUrl: e.target.value }
            }))}
            placeholder="https://www.google.com/maps/search/?api=1&query=..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 font-mono text-stone-600 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs"
          />
          <span className="text-3xs text-stone-400 mt-1 block leading-relaxed">
            {lang === 'mr' 
              ? 'शेतकऱ्यांनी "Get Directions" वर क्लिक केल्यावर ही बाह्य लिंक नवीन टॅबमध्ये उघडेल.' 
              : 'Opened externally in a new window when farmers click "Get Directions".'}
          </span>
        </div>
      </div>

      {/* Card 4: Social Channels */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-4">
        <div className="border-b border-stone-100 pb-3.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
              {lang === 'mr' ? 'सोशल मीडिया जोडणी (Instagram)' : 'Social Media Channels'}
            </h3>
            <p className="text-2xs text-stone-500 leading-relaxed">
              {lang === 'mr' 
                ? 'सध्या इन्स्टाग्राम खाते रिक्त ठेवले आहे. अधिकृत खाते तयार झाल्यावरच येथे लिंक भरावी.' 
                : 'Instagram is intentionally unconfigured until an official shop account is established.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5 leading-relaxed">
              <InstagramIcon className="w-3.5 h-3.5 text-stone-600" />
              <span>{lang === 'mr' ? 'इन्स्टाग्राम URL (वैकल्पिक)' : 'Instagram URL (Optional)'}</span>
            </label>
            <input
              type="url"
              value={formData.social.instagramUrl || ''}
              onChange={(e) => setFormData((prev) => ({ 
                ...prev, 
                social: { ...prev.social, instagramUrl: e.target.value || undefined }
              }))}
              placeholder="https://instagram.com/baliraja_krishi"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
            <span className="text-3xs text-stone-400 mt-1 block leading-relaxed">
              {lang === 'mr' ? 'रिक्त ठेवल्यास मुख्य संकेतस्थळावर "लवकरच येत आहे" दर्शवले जाईल.' : 'Leave empty to display graceful "Coming Soon" state.'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'इन्स्टाग्राम हँडल (Handle)' : 'Instagram Handle (Optional)'}
            </label>
            <input
              type="text"
              value={formData.social.instagramHandle || ''}
              onChange={(e) => setFormData((prev) => ({ 
                ...prev, 
                social: { ...prev.social, instagramHandle: e.target.value || undefined }
              }))}
              placeholder="@baliraja_kaij"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>
        </div>
      </div>

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
              <span className="leading-relaxed">{lang === 'mr' ? 'संपर्क व पत्ता जतन करा' : 'Save Contact & Location'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
