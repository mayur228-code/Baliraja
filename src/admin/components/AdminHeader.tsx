import type { FC } from 'react';
import { Menu, Languages, ShieldCheck, ChevronRight } from 'lucide-react';
import type { Language } from '../../types';
import type { AdminSection } from '../types/adminTypes';

interface AdminHeaderProps {
  currentSection: AdminSection;
  lang: Language;
  onToggleLang: () => void;
  onOpenMobileMenu: () => void;
}

export const AdminHeader: FC<AdminHeaderProps> = ({
  currentSection,
  lang,
  onToggleLang,
  onOpenMobileMenu
}) => {
  const titles: Record<AdminSection, { en: string; mr: string; groupEn: string; groupMr: string; descEn: string; descMr: string }> = {
    overview: {
      groupEn: 'Dashboard',
      groupMr: 'डॅशबोर्ड',
      en: 'Dashboard Overview',
      mr: 'डॅशबोर्ड सारांश',
      descEn: 'Factual metrics and content status for Baliraja Krishi Seva Kendra',
      descMr: 'बळीराजा कृषी सेवा केंद्राची खरी सामग्री स्थिती व आकडेवारी'
    },
    categories: {
      groupEn: 'Catalog',
      groupMr: 'सूची',
      en: 'Category Management',
      mr: 'वर्गवारी प्रणाली व्यवस्थापन',
      descEn: 'Configure categories, photos, icons, and display sequences with live sync',
      descMr: 'वर्गवाऱ्या, छायाचित्रे, कृषी आयकॉन्स आणि क्रम व्यवस्थापित करा'
    },
    products: {
      groupEn: 'Catalog',
      groupMr: 'सूची',
      en: 'Product Catalog',
      mr: 'उत्पादने व उपलब्धता व्यवस्थापन',
      descEn: 'Manage agricultural inputs, stock availability, and featured showcase status',
      descMr: 'कृषी निविष्ठा, उपलब्धता आणि वैशिष्ट्यीकृत उत्पादनांचे व्यवस्थापन'
    },
    brands: {
      groupEn: 'Catalog',
      groupMr: 'सूची',
      en: 'Connected Brands',
      mr: 'जोडलेले ब्रँड्स व्यवस्थापन',
      descEn: 'Manage agricultural companies and partner brand logos showcased on Home page',
      descMr: 'मुख्य पृष्ठावर दर्शविल्या जाणाऱ्या कृषी कंपन्या व भागीदार ब्रँड्सचे व्यवस्थापन'
    },
    'field-visits': {
      groupEn: 'Media & Proof',
      groupMr: 'माध्यम व पुरावा',
      en: 'Field Visits Gallery',
      mr: 'शेत भेट छायाचित्रे व्यवस्थापन',
      descEn: 'Manage authentic field photographs and titles in the progressive carousel',
      descMr: 'संकेतस्थळावरील शेत भेट कॅरोसेलमध्ये दर्शविली जाणारी छायाचित्रे आणि शीर्षकांचे व्यवस्थापन'
    },
    'our-results': {
      groupEn: 'Media & Proof',
      groupMr: 'माध्यम व पुरावा',
      en: 'Farmer Results Showcase',
      mr: 'आमचे निकाल व्यवस्थापन',
      descEn: 'Manage authentic farmer yield photographs, names, and locations with alternating flow',
      descMr: 'शेतकऱ्यांचे प्रत्यक्ष उत्पादन छायाचित्रे, शेतकरी नाव व ठिकाण व्यवस्थापन'
    },
    'field-experience': {
      groupEn: 'Agronomy Records',
      groupMr: 'कृषी नोंदी',
      en: 'Farmer Experiences & Crop Stages',
      mr: 'शेतकरी अनुभव व पीक निरीक्षणे',
      descEn: 'Practical field records, crop growth stages, and agronomic takeaways',
      descMr: 'प्रत्यक्ष शेतातील अनुभव, पीक वाढीच्या अवस्था व तंत्रज्ञान नोंदी'
    },
    about: {
      groupEn: 'Store & Profile',
      groupMr: 'दुकान व परिचय',
      en: 'About & Proprietor Profile',
      mr: 'परिचय व संचालक माहिती',
      descEn: 'Verified proprietor details (Ganesh Shinde, Janegaon) and transparent demo markers',
      descMr: 'प्रमाणित संचालक माहिती (गणेश शिंदे, जानेगाव) व स्पष्ट नमुना खुणा'
    },
    'contact-location': {
      groupEn: 'Store & Profile',
      groupMr: 'दुकान व परिचय',
      en: 'Contact & Shop Location',
      mr: 'संपर्क, पत्ता व नकाशा',
      descEn: 'Official phone, WhatsApp, address in Kaij, and Google Maps integration',
      descMr: 'अधिकृत संपर्क क्रमांक, व्हॉट्सॲप, कैज येथील पत्ता आणि नकाशा'
    },
    settings: {
      groupEn: 'System',
      groupMr: 'प्रणाली',
      en: 'Settings & Data Backup',
      mr: 'सेटिंग्ज व डेटा बॅकअप',
      descEn: 'JSON export/import, server email config, password change, and defaults',
      descMr: 'डेटा बॅकअप आयात/निर्यात, प्रशासकीय ईमेल, पासवर्ड बदल आणि प्रणाली माहिती'
    }
  };

  const active = titles[currentSection] || titles.overview;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        {/* Left: Mobile menu button & breadcrumb heading */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100/80 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-stone-500 mb-0.5">
              <span>{lang === 'mr' ? 'प्रशासक पोर्टल' : 'Admin Portal'}</span>
              <ChevronRight className="w-3 h-3 text-stone-400" />
              <span className="text-emerald-700 font-semibold">{lang === 'mr' ? active.groupMr : active.groupEn}</span>
            </div>

            <h1 className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-normal overflow-visible truncate">
              {lang === 'mr' ? active.mr : active.en}
            </h1>
            <p className="hidden md:block text-xs text-stone-500 font-normal truncate mt-0.5">
              {lang === 'mr' ? active.descMr : active.descEn}
            </p>
          </div>
        </div>

        {/* Right: Language switch & Admin badge */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            aria-label="Switch portal language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
            <span className="flex items-center gap-1">
              <span className={lang === 'mr' ? 'text-emerald-700 font-bold' : 'text-stone-400 font-normal'}>मराठी</span>
              <span className="text-stone-300">/</span>
              <span className={lang === 'en' ? 'text-emerald-700 font-bold' : 'text-stone-400 font-normal'}>EN</span>
            </span>
          </button>

          {/* Admin User Badge */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-stone-200">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex items-center justify-center font-bold shadow-xs">
                <span className="text-xs font-serif">B</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-stone-900 leading-tight">Admin</div>
              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Authorized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
