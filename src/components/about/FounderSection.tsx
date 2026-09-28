import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Sprout, 
  Sparkles, 
  Users, 
  PhoneCall, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { useContentStore } from '../../data/contentStore';
import ownerImg from '../../assets/owner.png';
import logoImg from '../../assets/logo.png';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';

interface FounderSectionProps {
  lang: Language;
  onKnowMore: () => void;
  onGoHome?: () => void;
}

export const FounderSection: FC<FounderSectionProps> = ({
  lang,
  onKnowMore,
  onGoHome
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { ownerProfile, businessInfo } = useContentStore();
  const t = translations[lang];
  const founderPhoto = ownerProfile?.image || ownerImg;

  // Optimized highlights configuration
  const highlights = [
    {
      id: 'crop-advisor',
      titleEn: t.founderSkillCropAdvisorTitle,
      titleMr: t.founderSkillCropAdvisorTitleMr,
      desc: t.founderSkillCropAdvisorDesc,
      icon: Sprout,
      colorClasses: {
        iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        badge: 'bg-emerald-100/60 text-emerald-900'
      }
    },
    {
      id: 'ginger-specialist',
      titleEn: t.founderSkillGingerSpecialistTitle,
      titleMr: t.founderSkillGingerSpecialistTitleMr,
      desc: t.founderSkillGingerSpecialistDesc,
      icon: Sparkles,
      colorClasses: {
        iconBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        badge: 'bg-amber-100/60 text-amber-900'
      }
    },
    {
      id: 'guided-farmers',
      titleEn: t.founderSkillGuidedFarmersTitle,
      titleMr: t.founderSkillGuidedFarmersTitleMr,
      desc: t.founderSkillGuidedFarmersDesc,
      icon: Users,
      colorClasses: {
        iconBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
        badge: 'bg-teal-100/60 text-teal-900'
      }
    }
  ];

  const handleHomeNavigation = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="about"
      aria-labelledby="founder-section-heading"
      className="relative py-12 sm:py-16 lg:py-20 my-6 rounded-3xl bg-gradient-to-b from-stone-50/90 via-white/95 to-stone-50/90 border border-stone-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden scroll-mt-24"
    >
      {/* Anchor for founder navigation */}
      <span id="founder" className="sr-only" aria-hidden="true" />

      {/* ========================================================= */}
      {/* TOP-LEFT CORNER — Interactive Baliraja Brand Logo Watermark */}
      {/* ========================================================= */}
      <button
        type="button"
        onClick={handleHomeNavigation}
        aria-label={lang === 'mr' ? 'मुख्यपृष्ठावर जा (Home)' : 'Navigate to Home page'}
        title={lang === 'mr' ? 'बळीराजा कृषी सेवा केंद्र - मुख्यपृष्ठ' : 'Baliraja Krishi Seva Kendra - Home'}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl p-1 opacity-30 hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-300 ease-out cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 select-none group"
      >
        <img
          src={logoImg}
          alt="Baliraja Logo"
          className="w-full h-full object-contain aspect-square transition-transform duration-200 group-hover:scale-105"
        />
      </button>

      {/* Main Responsive Two-Column Layout */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ========================================================= */}
          {/* LEFT SIDE — Restored Founder Photo & Centered Identity    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            {/* 
              Restored Owner Photo (Foreground):
              - Exactly as restored: authentic 433/577 aspect ratio, object-contain.
              - No circular crop, no border, no distortion.
              - Slide-in from left towards right entrance animation (Owner photo ONLY).
            */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: '-20px' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              whileHover={shouldReduceMotion ? undefined : { 
                y: -4, 
                scale: 1.015,
                transition: { duration: 0.2, ease: 'easeOut' } 
              }}
              className="relative w-full max-w-[260px] sm:max-w-[300px] md:max-w-[320px] aspect-[433/577] flex items-center justify-center cursor-default select-none will-change-transform"
            >
              <img
                src={founderPhoto}
                alt={lang === 'mr' ? 'श्री. गणेश भीमराव शिंदे - संस्थापक, बळीराजा कृषी सेवा केंद्र' : 'Mr. Ganesh Bhimrao Shinde - Founder, Baliraja Krishi Seva Kendra'}
                className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.09)] transition-all duration-300"
                loading="eager"
              />
            </motion.div>

            {/* Centrally Aligned Founder Name & Role sharing the photo's center */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-20px' }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              className="mt-4 sm:mt-5 text-center space-y-1.5"
            >
              <h3 
                id="founder-name"
                className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight"
              >
                {lang === 'mr' ? t.founderName : t.founderNameEn}
              </h3>

              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>{t.founderRole}</span>
              </div>
            </motion.div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE — Introduction & Skill Cards                   */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-7 text-center lg:text-left">
            
            {/* Top Founder of Baliraja Heading & Brand Logo Unit (Prominent Intentional Unit with 21st.dev Shimmer) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-20px' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={shouldReduceMotion ? undefined : { 
                y: -2,
                scale: 1.01,
                transition: { duration: 0.2, ease: 'easeOut' }
              }}
              className="inline-flex mx-auto lg:mx-0 will-change-transform group/founder-badge"
            >
              <button
                type="button"
                onClick={onGoHome}
                className="relative overflow-hidden inline-flex items-center gap-2.5 sm:gap-3 lg:gap-3.5 px-3.5 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 rounded-2xl sm:rounded-full bg-emerald-50/95 border border-emerald-200/90 shadow-2xs hover:shadow-xs hover:border-emerald-300 hover:bg-emerald-100/60 transition-all duration-300 select-none cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
                aria-label={lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Go to Home'}
                title={lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Go to Home'}
              >
                {/* Brand logo icon mark from existing assets/logo.png with subtle coordinated sheen */}
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full shrink-0 p-0.5 bg-white/90 border border-emerald-200/80 shadow-2xs overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover/founder-badge:scale-105">
                  <img
                    src={logoImg}
                    alt="Baliraja Brand Logo"
                    className="w-full h-full rounded-full object-contain aspect-square select-none relative z-0"
                    aria-hidden="true"
                  />
                  {/* Subtle Coordinated 21st.dev Shine Overlay on Logo */}
                  <span
                    className="founder-logo-sheen absolute inset-0 rounded-full pointer-events-none z-10"
                    aria-hidden="true"
                  />
                </div>

                {/* Noticeably larger two-tone brand heading text with 21st.dev-style Shimmer */}
                <h3 className="relative inline-block text-sm sm:text-base md:text-lg lg:text-xl font-bold font-serif tracking-tight leading-none transition-colors duration-300">
                  {/* Base Layer: Crisp authentic two-tone brand colors */}
                  {lang === 'mr' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-700 font-extrabold">बळीराजाचे</span>
                      <span className="text-emerald-950 font-bold">संस्थापक</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="text-emerald-950 font-bold">Founder of</span>
                      <span className="text-amber-700 font-extrabold">Baliraja</span>
                    </span>
                  )}

                  {/* Shimmer Overlay: Smooth 21st.dev diagonal light sweep across letterforms */}
                  <span
                    className="founder-text-shimmer absolute inset-0 pointer-events-none select-none flex items-center gap-1.5"
                    aria-hidden="true"
                  >
                    {lang === 'mr' ? (
                      <>
                        <span className="font-extrabold">बळीराजाचे</span>
                        <span className="font-bold">संस्थापक</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">Founder of</span>
                        <span className="font-extrabold">Baliraja</span>
                      </>
                    )}
                  </span>
                </h3>
              </button>
            </motion.div>

            {/* Foreground Heading & 1-2 Lines Introduction */}
            <div className="group/heading space-y-3.5 relative z-10 cursor-default select-none">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-20px' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <h2
                  id="founder-section-heading"
                  className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-stone-900 tracking-tight leading-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-950"
                >
                  {t.founderHeading}
                </h2>

                {/* Subtle animated underline matching Fertilizers animation reference */}
                <AnimatedUnderline
                  align="responsive"
                  gradientClass="bg-gradient-to-r from-emerald-600 to-amber-500"
                />

                {/* 1–2 Lines Concise Introduction */}
                <p className="text-sm sm:text-base text-stone-700 leading-relaxed max-w-2xl mx-auto lg:mx-0 mt-3">
                  {t.founderIntro}
                </p>
              </motion.div>
            </div>

            {/* 
              3 Prominent Expertise & Trust Highlights:
              - OPTIMIZED: Quick, smooth, responsive entrance (350ms, 60ms stagger)
              - Immediate hover response (150ms)
              - Hardware-accelerated with solid high-performance background (no backdrop-blur layout thrashing)
            */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 relative z-10">
              {highlights.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: '-20px' }}
                    transition={{ 
                      duration: 0.35, 
                      delay: shouldReduceMotion ? 0 : index * 0.06,
                      ease: 'easeOut' 
                    }}
                    whileHover={shouldReduceMotion ? undefined : { 
                      y: -3, 
                      scale: 1.015,
                      transition: { duration: 0.15, ease: 'easeOut' } 
                    }}
                    className="p-4 sm:p-4.5 rounded-2xl bg-white/85 backdrop-blur-xs border border-white/80 hover:border-emerald-300/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_rgba(5,150,105,0.08)] transition-all duration-200 flex flex-col items-center sm:items-start text-center sm:text-left group will-change-transform"
                  >
                    {/* Professional Icon Container */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-3 shrink-0 transition-transform duration-150 group-hover:scale-105 ${item.colorClasses.iconBg}`}>
                      <IconComponent className="w-5 h-5" aria-hidden="true" />
                    </div>

                    {/* Title */}
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                      {lang === 'mr' ? item.titleMr : item.titleEn}
                    </h4>

                    {/* Subtitle / Context */}
                    <p className="text-2xs sm:text-xs text-stone-500 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Buttons: Contact & Know More (Flow Button System) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-20px' }}
              transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2 relative z-10"
            >
              {/* Contact Button (Direct Native Call, displaying ONLY "Contact") */}
              <a
                href={`tel:${businessInfo.phone || '9881070520'}`}
                className="flow-btn w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold text-sm shadow-xs hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-hidden cursor-pointer"
                aria-label={t.founderContactBtn}
              >
                <PhoneCall className="w-4 h-4 text-emerald-200" aria-hidden="true" />
                <span>{t.founderContactBtn}</span>
              </a>

              {/* Know More Button (Navigates to dedicated About Page) */}
              <button
                type="button"
                onClick={onKnowMore}
                className="flow-btn flow-btn-light w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 hover:text-emerald-900 font-bold text-sm border border-stone-300 hover:border-emerald-600 shadow-2xs hover:shadow-xs focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 outline-hidden cursor-pointer group"
              >
                <span>{t.founderKnowMoreBtn}</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all duration-150" aria-hidden="true" />
              </button>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
};
