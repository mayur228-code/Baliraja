import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  Info, 
  Phone,
  Sprout,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import type { Language, NavSection } from '../types';
import { translations } from '../data/translations';
import { useVideoVisibility } from '../lib/useVisibilityObserver';

interface HeroProps {
  lang: Language;
  onSelectSection: (section: NavSection, categoryId?: string, subcategoryId?: string) => void;
}

export const Hero: FC<HeroProps> = ({ lang, onSelectSection }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [brandNameAvailable, setBrandNameAvailable] = useState(true);
  const [badgeWidth, setBadgeWidth] = useState<number | undefined>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 480 ? 280 : 340;
    }
    return 340;
  });

  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  // Auto-pause video when scrolled out of viewport to conserve CPU/GPU
  useVideoVisibility(videoRef);

  // Measure exact rendered width of the text line so the brand-name image spans the same horizontal distance
  useEffect(() => {
    const el = badgeRef.current;
    if (!el) return;

    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setBadgeWidth(Math.round(rect.width));
      }
    };

    updateWidth();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
          if (width > 0) {
            setBadgeWidth(Math.round(width));
          }
        }
      });
      resizeObserver.observe(el);
    }

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(updateWidth);
    }

    window.addEventListener('resize', updateWidth);
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateWidth);
    };
  }, [lang]);

  // Gracefully initiate autoplay without unhandled rejections
  useEffect(() => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoReady(true);
          })
          .catch(() => {
            // Autoplay policy prevented playback; poster fallback remains visible
            setVideoReady(false);
          });
      }
    }
  }, []);

  // Motion animation helper respecting prefers-reduced-motion
  const getMotionProps = (delaySeconds: number) => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 }
      };
    }
    return {
      initial: { opacity: 0, y: 16 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: false, margin: '-20px' },
      transition: {
        duration: 0.4,
        delay: delaySeconds,
        ease: 'easeOut' as const
      }
    };
  };

  return (
    <section 
      role="region" 
      aria-label={lang === 'mr' ? 'मुख्य परिचय विभाग' : 'Hero Introduction Section'}
      className="relative w-full overflow-hidden bg-stone-950 min-h-[580px] sm:min-h-[620px] md:min-h-[660px] lg:min-h-[720px] xl:min-h-[760px] flex items-center"
    >
      {/* 1. Cinematic Background Video Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
        {/* Poster Image Fallback (Always present beneath or on error to prevent layout shift) */}
        <img
          src="/assets/videos/hero_poster.jpg"
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover object-[35%_center] sm:object-[45%_center] md:object-[60%_35%] lg:object-[65%_35%] xl:object-[center_35%] transition-opacity duration-1000 ${
            videoReady && !videoError ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
        />

        {/* Real Video Asset from Project */}
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/assets/videos/hero_poster.jpg"
            aria-hidden="true"
            tabIndex={-1}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover object-[35%_center] sm:object-[45%_center] md:object-[60%_35%] lg:object-[65%_35%] xl:object-[center_35%] transition-opacity duration-1000 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source src="/assets/videos/bg_animated_video.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* 2. Controlled Directional Overlays for Optimal Text Readability without Large Solid Panels */}
      {/* Desktop: Gentle gradient from left to right, protecting typography while keeping the field scene and subjects bright */}
      <div 
        className="absolute inset-0 hidden md:block bg-gradient-to-r from-stone-950/85 via-stone-950/50 to-stone-950/15 pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Mobile / Tablet: Balanced soft scrim protecting top-left text without hiding people or cinematic background */}
      <div 
        className="absolute inset-0 block md:hidden bg-gradient-to-r from-stone-950/80 via-stone-950/45 to-transparent pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute inset-0 block md:hidden bg-gradient-to-b from-stone-950/60 via-transparent to-stone-950/70 pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Subtle top edge vignette to blend seamlessly with the header */}
      <div 
        className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-stone-950/60 via-transparent to-transparent pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Subtle bottom edge gradient transitioning into page background */}
      <div 
        className="absolute bottom-0 inset-x-0 h-14 sm:h-16 bg-gradient-to-t from-stone-950/75 via-transparent to-transparent pointer-events-none" 
        aria-hidden="true" 
      />

      {/* 3. Hero Editorial Content Composition */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-[520px] xl:max-w-[580px] space-y-5 sm:space-y-6">
          
          {/* Step 1 & 2: Brand Identity & Badge Group (Shared visual alignment system) */}
          <motion.div 
            {...getMotionProps(0.06)}
            className="inline-flex flex-col items-start gap-2.5 sm:gap-3 max-w-full"
          >
            {/* Step 1: Official Brand-Name Image (Visually spans the exact same horizontal distance as the text line below) */}
            {brandNameAvailable && (
              <div 
                className="flex items-center justify-start max-w-full transition-[width] duration-150 ease-out"
                style={{ 
                  width: badgeWidth ? `${badgeWidth}px` : 'fit-content',
                }}
              >
                <img
                  src="/assets/brand/brand-name.png"
                  alt={t.businessName}
                  className="w-full h-auto object-contain block select-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)] filter"
                  onError={() => setBrandNameAvailable(false)}
                />
              </div>
            )}

            {/* Step 2: Official Identity Badge (Defines the width boundary of this visual group) */}
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-2 bg-stone-900/80 hover:bg-stone-900/95 text-emerald-300 border border-emerald-500/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-md transition-colors w-fit max-w-full"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{t.heroBadge}</span>
            </div>
          </motion.div>

          {/* Step 3: Main Headline: Rooted in Agriculture. Driven by Experience. (Elevated Typography with Baliraja Color System) */}
          <motion.div 
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
          >
            <h1 className="text-2.5xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-5xl font-black font-serif text-white overflow-visible leading-[1.32] sm:leading-[1.3] md:leading-[1.28]">
              {lang === 'mr' ? (
                <span className="block tracking-normal overflow-visible pt-0.5 pb-0.5">
                  <span className="text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">शेतीशी </span>
                  <span className="marathi-gradient-emerald font-bold">
                    नातं.
                  </span>{' '}
                  <span className="inline-block sm:block mt-1 sm:mt-1.5 font-serif overflow-visible">
                    <span className="text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">अनुभवातून </span>
                    <span className="marathi-gradient-amber font-extrabold">
                      मार्गदर्शन.
                    </span>
                  </span>
                </span>
              ) : (
                <span className="block tracking-tight">
                  <span className="text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">Rooted in </span>
                  <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(5,150,105,0.45)] font-bold">
                    Agriculture.
                  </span>{' '}
                  <span className="inline-block sm:block mt-0.5 sm:mt-1.5 font-serif">
                    <span className="text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">Driven by </span>
                    <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(245,158,11,0.45)] font-extrabold">
                      Experience.
                    </span>
                  </span>
                </span>
              )}
            </h1>
          </motion.div>

          {/* Subheadline: Concise, safe, field-oriented description */}
          <motion.div {...getMotionProps(0.28)}>
            <p className="text-stone-200 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg font-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {t.heroSubheadline}
            </p>
          </motion.div>

          {/* Key Value Highlight Pills: Lively micro-interactions with Framer Motion */}
          <motion.div 
            {...getMotionProps(0.36)}
            className="flex flex-wrap gap-2 sm:gap-2.5 pt-1"
          >
            {/* Ginger Specialization */}
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="group inline-flex items-center gap-1.5 bg-stone-900/75 hover:bg-stone-900/95 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-200 hover:text-emerald-100 backdrop-blur-md px-3 py-1.5 rounded-full text-2xs sm:text-xs font-medium shadow-xs hover:shadow-[0_4px_16px_-2px_rgba(16,185,129,0.3)] transition-colors duration-200 cursor-default select-none"
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-115 group-hover:rotate-6 transition-transform duration-200 shrink-0" aria-hidden="true" />
              <span>{t.heroGingerHighlight}</span>
            </motion.div>

            {/* Field Experience */}
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="group inline-flex items-center gap-1.5 bg-stone-900/75 hover:bg-stone-900/95 border border-amber-500/30 hover:border-amber-400/60 text-stone-200 hover:text-stone-100 backdrop-blur-md px-3 py-1.5 rounded-full text-2xs sm:text-xs font-medium shadow-xs hover:shadow-[0_4px_16px_-2px_rgba(245,158,11,0.25)] transition-colors duration-200 cursor-default select-none"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 group-hover:scale-115 transition-transform duration-200 shrink-0" aria-hidden="true" />
              <span>{t.heroFieldTestedHighlight}</span>
            </motion.div>

            {/* Quality Inputs */}
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className="group inline-flex items-center gap-1.5 bg-stone-900/75 hover:bg-stone-900/95 border border-stone-700/70 hover:border-emerald-400/50 text-stone-200 hover:text-stone-100 backdrop-blur-md px-3 py-1.5 rounded-full text-2xs sm:text-xs font-medium shadow-xs hover:shadow-[0_4px_16px_-2px_rgba(16,185,129,0.25)] transition-colors duration-200 cursor-default select-none"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-115 transition-transform duration-200 shrink-0" aria-hidden="true" />
              <span>{t.heroQualityInputsHighlight}</span>
            </motion.div>
          </motion.div>

            {/* CTA Group: Lively, polished Flow buttons */}
            <motion.div 
              {...getMotionProps(0.44)}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              {/* Primary CTA: Explore Products (21st.dev Premium Flow Button) */}
              <button
                type="button"
                onClick={() => onSelectSection('products')}
                className="flow-btn inline-flex items-center justify-center gap-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border border-emerald-500/40 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-600/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-hidden"
                aria-label={t.heroExploreProductsCta}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.heroExploreProductsCta}</span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </button>

              {/* Secondary CTA: About Us */}
              <button
                type="button"
                onClick={() => onSelectSection('about')}
                className="flow-btn inline-flex items-center justify-center gap-2 bg-stone-900/80 hover:bg-stone-800 text-stone-100 hover:text-white font-semibold text-xs sm:text-sm px-4.5 sm:px-5 py-3 sm:py-3.5 rounded-xl border border-stone-700/80 hover:border-emerald-500/40 backdrop-blur-md shadow-md hover:shadow-lg hover:shadow-stone-950/50 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-hidden"
                aria-label={t.heroAboutCta}
              >
                <Info className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{t.heroAboutCta}</span>
              </button>

              {/* Tertiary CTA: Contact Us */}
              <button
                type="button"
                onClick={() => onSelectSection('contact')}
                className="flow-btn inline-flex items-center justify-center gap-2 bg-stone-900/60 hover:bg-stone-800/90 text-stone-300 hover:text-white font-medium text-xs sm:text-sm px-4 sm:px-4.5 py-3 sm:py-3.5 rounded-xl border border-stone-800/80 hover:border-stone-600/80 backdrop-blur-md shadow-sm hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 focus-visible:outline-hidden"
                aria-label={t.heroContactCta}
              >
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{t.heroContactCta}</span>
              </button>
            </motion.div>

        </div>
      </div>
    </section>
  );
};
