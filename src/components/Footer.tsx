import { useState } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Store, 
  Phone, 
  MapPin, 
  Mail, 
  ShoppingBag, 
  Info, 
  Calculator, 
  Compass
} from 'lucide-react';
import { InstagramIcon } from './common/InstagramIcon';
import type { Language, NavSection } from '../types';
import { translations } from '../data/translations';
import { useContentStore } from '../data/contentStore';

interface FooterProps {
  lang: Language;
  onSelectSection: (section: NavSection) => void;
}

const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

const getFadeUpAnim = (delay: number, shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: false, margin: '-20px' },
  transition: {
    duration: shouldReduceMotion ? 0 : 0.35,
    delay: shouldReduceMotion ? 0 : delay,
    ease: EASE_PREMIUM
  }
});

const getLogoAnim = (delay: number, shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.94, y: 8 },
  whileInView: { opacity: 1, scale: 1, y: 0 },
  viewport: { once: false, margin: '-20px' },
  transition: {
    duration: shouldReduceMotion ? 0 : 0.35,
    delay: shouldReduceMotion ? 0 : delay,
    ease: EASE_PREMIUM
  }
});

const getBrandNameAnim = (delay: number, shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, margin: '-20px' },
  transition: {
    duration: shouldReduceMotion ? 0 : 0.35,
    delay: shouldReduceMotion ? 0 : delay,
    ease: EASE_PREMIUM
  }
});

const getLinkAnim = (delay: number, shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: false, margin: '-20px' },
  transition: {
    duration: shouldReduceMotion ? 0 : 0.35,
    delay: shouldReduceMotion ? 0 : delay,
    ease: EASE_PREMIUM
  }
});

const getSocialIconAnim = (delay: number, shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.92, y: 8 },
  whileInView: { opacity: 1, scale: 1, y: 0 },
  viewport: { once: false, margin: '-20px' },
  transition: {
    duration: shouldReduceMotion ? 0 : 0.35,
    delay: shouldReduceMotion ? 0 : delay,
    ease: EASE_PREMIUM
  },
  whileHover: shouldReduceMotion ? undefined : { scale: 1.08, y: -2, transition: { duration: 0.18, ease: 'easeOut' as const } },
  whileTap: shouldReduceMotion ? undefined : { scale: 0.95 }
});

const getBottomTextAnim = (delay: number, shouldReduceMotion: boolean | null) => ({
  initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, margin: '-20px' },
  transition: {
    duration: shouldReduceMotion ? 0 : 0.35,
    delay: shouldReduceMotion ? 0 : delay,
    ease: EASE_PREMIUM
  }
});

const WhatsAppIcon: FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 0 1 2.4 5.83c0 4.54-3.7 8.24-8.24 8.24-1.45 0-2.88-.38-4.14-1.11l-.3-.18-3.08.81.82-3-.2-.31a8.19 8.19 0 0 1-1.26-4.45c0-4.54 3.7-8.24 8.24-8.24m4.53 11.66c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.61.12.17 1.78 2.73 4.32 3.82.6.26 1.08.42 1.45.54.61.19 1.16.17 1.6.1.49-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.07-.1-.24-.16-.49-.29" />
  </svg>
);

export const Footer: FC<FooterProps> = ({ lang, onSelectSection }) => {
  const [logoAvailable, setLogoAvailable] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];
  const { businessInfo } = useContentStore();

  const currentYear = new Date().getFullYear();
  const yearText = lang === 'mr' ? '२०२६' : currentYear.toString();

  const handleGoHome = () => {
    onSelectSection('products');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (section: NavSection, anchorId?: string) => {
    if (anchorId) {
      if (section === 'products') {
        onSelectSection('products');
        setTimeout(() => {
          const el = document.getElementById(anchorId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 80);
        return;
      }
    }
    onSelectSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" role="contentinfo" className="bg-[#0f2d20] text-emerald-100/90 mt-16 sm:mt-20 border-t border-emerald-800/60 relative overflow-hidden text-left scroll-mt-6">
      {/* Subtle top agricultural gradient line */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-400" aria-hidden="true" />

      {/* Top Banner with Agricultural Credibility Note */}
      <div className="bg-[#0b2419]/70 py-3.5 px-4 text-center border-b border-emerald-800/40">
        <motion.p
          {...getFadeUpAnim(0.02, shouldReduceMotion)}
          className="text-emerald-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span>
            {lang === 'mr'
              ? 'बळीराजा कृषी सेवा केंद्र — प्रत्यक्ष शेती मार्गदर्शन व कृषी निविष्ठा केंद्र'
              : 'Baliraja Krishi Seva Kendra — Practical Agricultural Guidance & Crop Inputs'}
          </span>
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          
          {/* Col 1: Brand, Text, Tagline & Social Handles (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col items-center sm:items-start space-y-4">
            <div className="inline-flex flex-col items-center text-center space-y-3.5">
              {/* Clickable Brand Row (Brand Logo PNG → Brand Name PNG) */}
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleGoHome();
                }}
                className="inline-flex items-center justify-center gap-3.5 group cursor-pointer p-1.5 rounded-2xl transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:drop-shadow-[0_6px_16px_rgba(16,185,129,0.35)] active:translate-y-0 active:scale-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label={lang === 'mr' ? 'बळीराजा कृषी सेवा केंद्र - मुख्यपृष्ठ' : 'Baliraja Krishi Seva Kendra - Home'}
              >
                {/* Brand Logo PNG (preserving exact natural colors and circular shape) */}
                {logoAvailable ? (
                  <motion.img
                    src="/assets/logo.png"
                    alt="Baliraja Logo"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain shrink-0 shadow-md ring-2 ring-emerald-400/30"
                    onError={() => setLogoAvailable(false)}
                    {...getLogoAnim(0.05, shouldReduceMotion)}
                  />
                ) : (
                  <motion.div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center border border-emerald-600 shrink-0"
                    {...getLogoAnim(0.05, shouldReduceMotion)}
                  >
                    <Store className="w-6 h-6 text-emerald-300" />
                  </motion.div>
                )}

                {/* Brand Name PNG (from assets, original appearance, proportions and colors preserved) */}
                <motion.img
                  src="/assets/brand/brand_name.png"
                  alt={lang === 'mr' ? 'बळीराजा' : 'Baliraja'}
                  className="h-9 sm:h-10 md:h-11 w-auto max-w-[180px] sm:max-w-[210px] md:max-w-[240px] object-contain shrink-0 drop-shadow-sm transition-transform duration-200"
                  {...getBrandNameAnim(0.10, shouldReduceMotion)}
                />
              </a>

              {/* Exact Business Entity Text with Dynamic Language Switching */}
              <motion.h3 
                className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug"
                {...getFadeUpAnim(0.15, shouldReduceMotion)}
              >
                {lang === 'mr' ? 'बळीराजा कृषी सेवा केंद्र , केज' : 'Baliraja Krishi Seva Kendra , Kaij'}
              </motion.h3>

              {/* Exact Tagline with Dynamic Language Switching */}
              <motion.p 
                className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-md font-medium"
                {...getFadeUpAnim(0.20, shouldReduceMotion)}
              >
                {lang === 'mr'
                  ? 'शेती आणि शेतकरी , शेतकऱ्याची प्रगती हाच एकमेव उद्देश...'
                  : 'Agriculture and the farmer , progress of farmer is the only focus...'}
              </motion.p>

              {/* Social Media Row with Smooth Pop-up / Lift Interaction */}
              <div className="pt-2 flex items-center justify-center gap-3">
                {/* WhatsApp */}
                <motion.a
                  href={`https://wa.me/91${businessInfo.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-900/60 hover:bg-emerald-700/80 text-emerald-200 hover:text-white border border-emerald-700/50 hover:border-emerald-400 transition-colors duration-200 hover:shadow-[0_4px_16px_rgba(16,185,129,0.4)] focus-visible:ring-2 focus-visible:ring-emerald-400 outline-hidden"
                  aria-label={t.contactWhatsAppBtn}
                  title={t.contactWhatsAppBtn}
                  {...getSocialIconAnim(0.25, shouldReduceMotion)}
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                </motion.a>

                {/* Instagram */}
                <motion.a
                  href={businessInfo.social.instagramUrl || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-900/60 hover:bg-emerald-700/80 text-emerald-200 hover:text-white border border-emerald-700/50 hover:border-emerald-400 transition-colors duration-200 hover:shadow-[0_4px_16px_rgba(16,185,129,0.4)] focus-visible:ring-2 focus-visible:ring-emerald-400 outline-hidden"
                  aria-label="Instagram"
                  title={businessInfo.social.instagramUrl ? 'Instagram' : t.contactInstagramComingSoon}
                  {...getSocialIconAnim(0.30, shouldReduceMotion)}
                >
                  <InstagramIcon className="w-5 h-5" />
                </motion.a>

                {/* Google Maps Location */}
                <motion.a
                  href={businessInfo.location.googleMapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-900/60 hover:bg-emerald-700/80 text-emerald-200 hover:text-white border border-emerald-700/50 hover:border-emerald-400 transition-colors duration-200 hover:shadow-[0_4px_16px_rgba(16,185,129,0.4)] focus-visible:ring-2 focus-visible:ring-emerald-400 outline-hidden"
                  aria-label={t.openInGoogleMapsBtn}
                  title={t.openInGoogleMapsBtn}
                  {...getSocialIconAnim(0.35, shouldReduceMotion)}
                >
                  <Compass className="w-5 h-5 text-emerald-300" />
                </motion.a>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links with Pop-up / Lift Motion (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <motion.h4 
              className="text-white font-bold text-xs uppercase tracking-wider border-l-2 border-emerald-400 pl-2.5"
              {...getFadeUpAnim(0.15, shouldReduceMotion)}
            >
              {t.footerQuickNav}
            </motion.h4>

            <ul className="space-y-2.5 text-xs">
              <motion.li {...getLinkAnim(0.20, shouldReduceMotion)}>
                <button
                  type="button"
                  onClick={() => handleNavClick('products', 'products-section')}
                  className="text-emerald-100/80 hover:text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:drop-shadow-[0_2px_8px_rgba(52,211,153,0.35)] active:translate-y-0 active:scale-100 cursor-pointer flex items-center gap-2 group origin-left"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400/80 group-hover:text-emerald-300 transition-colors" />
                  <span>{t.footerNavHome}</span>
                </button>
              </motion.li>
              <motion.li {...getLinkAnim(0.25, shouldReduceMotion)}>
                <button
                  type="button"
                  onClick={() => handleNavClick('products', 'catalog-browser')}
                  className="text-emerald-100/80 hover:text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:drop-shadow-[0_2px_8px_rgba(52,211,153,0.35)] active:translate-y-0 active:scale-100 cursor-pointer flex items-center gap-2 group origin-left"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-400/80 group-hover:text-emerald-300 transition-colors" />
                  <span>{t.footerNavProducts}</span>
                </button>
              </motion.li>
              <motion.li {...getLinkAnim(0.30, shouldReduceMotion)}>
                <button
                  type="button"
                  onClick={() => handleNavClick('products', 'about')}
                  className="text-emerald-100/80 hover:text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:drop-shadow-[0_2px_8px_rgba(52,211,153,0.35)] active:translate-y-0 active:scale-100 cursor-pointer flex items-center gap-2 group origin-left"
                >
                  <Info className="w-3.5 h-3.5 text-emerald-400/80 group-hover:text-emerald-300 transition-colors" />
                  <span>{t.footerNavAbout}</span>
                </button>
              </motion.li>
              <motion.li {...getLinkAnim(0.40, shouldReduceMotion)}>
                <button
                  type="button"
                  onClick={() => handleNavClick('products', 'contact')}
                  className="text-emerald-100/80 hover:text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:drop-shadow-[0_2px_8px_rgba(52,211,153,0.35)] active:translate-y-0 active:scale-100 cursor-pointer flex items-center gap-2 group origin-left"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400/80 group-hover:text-emerald-300 transition-colors" />
                  <span>{t.footerNavContact}</span>
                </button>
              </motion.li>
              <motion.li {...getLinkAnim(0.45, shouldReduceMotion)}>
                <button
                  type="button"
                  onClick={() => handleNavClick('calculators')}
                  className="text-emerald-100/80 hover:text-amber-300 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04] hover:drop-shadow-[0_2px_8px_rgba(251,191,36,0.35)] active:translate-y-0 active:scale-100 cursor-pointer flex items-center gap-2 group origin-left"
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
                  <span>{t.footerNavCalculators}</span>
                </button>
              </motion.li>
            </ul>
          </div>

          {/* Col 3: Direct Contact Information with Pop-up Links (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <motion.h4 
              className="text-white font-bold text-xs uppercase tracking-wider border-l-2 border-emerald-400 pl-2.5"
              {...getFadeUpAnim(0.18, shouldReduceMotion)}
            >
              {t.contactDetails}
            </motion.h4>

            <div className="space-y-3.5 text-xs text-emerald-100/80">
              {/* Address */}
              <motion.div 
                className="flex items-start gap-3"
                {...getLinkAnim(0.24, shouldReduceMotion)}
              >
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <span className="text-emerald-200 font-semibold block">{t.addressLabel}</span>
                  <span className="leading-relaxed block">
                    {lang === 'mr' ? businessInfo.location.addressMr : businessInfo.location.addressEn}
                  </span>
                </div>
              </motion.div>

              {/* Phone */}
              <motion.div 
                className="flex items-start gap-3"
                {...getLinkAnim(0.30, shouldReduceMotion)}
              >
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <span className="text-emerald-200 font-semibold block">{t.navContact}</span>
                  <a
                    href={`tel:${businessInfo.phone}`}
                    className="text-white hover:text-emerald-300 font-bold tracking-wide inline-block transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:drop-shadow-[0_2px_8px_rgba(52,211,153,0.35)] active:translate-y-0 active:scale-100 origin-left"
                    aria-label={`Call ${businessInfo.phone}`}
                  >
                    +91 {businessInfo.phone}
                  </a>
                </div>
              </motion.div>

              {/* Email */}
              <motion.div 
                className="flex items-start gap-3"
                {...getLinkAnim(0.36, shouldReduceMotion)}
              >
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <span className="text-emerald-200 font-semibold block">Email</span>
                  <a
                    href={`mailto:${businessInfo.email}`}
                    className="text-emerald-100 hover:text-white inline-block break-all transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:drop-shadow-[0_2px_8px_rgba(52,211,153,0.35)] active:translate-y-0 active:scale-100 origin-left"
                    aria-label={`Send email to ${businessInfo.email}`}
                  >
                    {businessInfo.email}
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Informational Disclaimer */}
        <div className="mt-14 pt-6 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/70">
          <motion.p
            {...getBottomTextAnim(0.48, shouldReduceMotion)}
          >
            {lang === 'mr' ? `© ${yearText} बळीराजा कृषी सेवा केंद्र. सर्व हक्क राखीव.` : `© ${yearText} Baliraja Krishi Seva Kendra. All rights reserved.`}
          </motion.p>

          <motion.p 
            className="text-emerald-300/80 text-2xs flex items-center gap-1.5"
            {...getBottomTextAnim(0.52, shouldReduceMotion)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>{t.footerDisclaimerNotice}</span>
          </motion.p>
        </div>
      </div>
    </footer>
  );
};
