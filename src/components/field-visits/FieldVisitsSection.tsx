import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { useContentStore } from '../../data/contentStore';
import {
  ProgressSlider,
  SliderContent,
  SliderWrapper,
  SliderBtnGroup,
  SliderBtn,
} from '../ui/progressive-carousel';
import { FieldVisitsBackground } from './FieldVisitsBackground';
import { cn } from '../../lib/utils';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';

interface FieldVisitsSectionProps {
  lang: Language;
}

/**
 * Field Visits Section.
 * Showcases genuine photographic record of Baliraja's field visits,
 * founder field advisory, and interactions with local farmers.
 * Highly optimized for 60/120fps performance:
 * - GPU-composited CSS progress animations
 * - Zero per-frame React re-renders
 * - Hardware layer promotion on image container
 * - Instantaneous (0ms) click responses
 */
export const FieldVisitsSection: FC<FieldVisitsSectionProps> = ({ lang }) => {
  const { fieldVisits } = useContentStore();
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  // Data-driven mapping to active language from central store
  const stackItems = useMemo(() => {
    return fieldVisits.map((item) => ({
      id: item.id,
      title: lang === 'mr' ? item.titleMr : item.titleEn,
      imageSrc: item.imageSrc,
      alt: lang === 'mr' ? (item.altMr || item.titleMr) : (item.altEn || item.titleEn),
      tag: lang === 'mr' ? (item.tagMr || 'शेत भेट') : (item.tagEn || 'Field Visit'),
      description: lang === 'mr' ? item.descriptionMr : item.descriptionEn
    }));
  }, [fieldVisits, lang]);

  const sliderValues = useMemo(
    () => stackItems.map((item) => item.id),
    [stackItems]
  );
  const [selectedSlideId, setSelectedSlideId] = useState<string>('');
  const activeSlide = (selectedSlideId && stackItems.some((s) => s.id === selectedSlideId))
    ? selectedSlideId
    : (stackItems[0]?.id || 'visit-1');

  if (stackItems.length === 0) return null;

  return (
    <section
      id="field-visits"
      aria-labelledby="field-visits-heading"
      className="relative py-12 sm:py-16 lg:py-20 my-6 rounded-3xl bg-gradient-to-b from-[#fbfdfa] via-[#f5f8f2]/90 to-[#fbfdfa] overflow-hidden scroll-mt-24"
    >
      {/* ── Lightweight GPU-Friendly Agricultural Background ── */}
      <FieldVisitsBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Centered Section Header & Animated Underline ── */}
        <div className="group/heading text-center max-w-2xl mx-auto mb-6 sm:mb-10 cursor-default select-none">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h2
              id="field-visits-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-emerald-950 tracking-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900"
            >
              {t.fieldVisitsHeading}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
              {t.fieldVisitsSubheading}
            </p>
          </motion.div>

          {/* Animated Agricultural Underline matching Fertilizers reference */}
          <AnimatedUnderline />
        </div>

        {/* ── Progressive Carousel Showcase (Hardware Promoted) ── */}
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative w-full max-w-5xl mx-auto p-1.5 sm:p-2.5 rounded-3xl bg-white/90 border border-stone-200/90 shadow-xl overflow-hidden backdrop-blur-xs"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          <ProgressSlider
            vertical={false}
            activeSlider={activeSlide}
            sliderValues={sliderValues}
            duration={5000}
            onSlideChange={setSelectedSlideId}
            className="w-full"
          >
            {/* Wide Main Photograph Container */}
            <SliderContent className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[500px] rounded-2xl sm:rounded-[calc(1.5rem-4px)] overflow-hidden bg-stone-100">
              {stackItems.map((item) => (
                <SliderWrapper
                  key={item.id}
                  value={item.id}
                  className="relative w-full h-full"
                >
                  <img
                    src={item.imageSrc}
                    alt={item.alt}
                    width={1200}
                    height={800}
                    decoding="async"
                    loading={item.id === activeSlide ? 'eager' : 'lazy'}
                    draggable={false}
                    className="w-full h-full object-cover object-center select-none"
                  />

                  {/* Top-Left Authentic Tag Badge (Transparent White Glass) */}
                  {item.tag && (
                    <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/25 backdrop-blur-md border border-white/50 text-emerald-950 text-2xs sm:text-xs font-bold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        {item.tag}
                      </span>
                    </div>
                  )}
                </SliderWrapper>
              ))}
            </SliderContent>

            {/* Overlaid Progressive Slide Controls (Transparent White Glassmorphism) */}
            <SliderBtnGroup 
              className={cn(
                'absolute bottom-2.5 sm:bottom-4 inset-x-2.5 sm:inset-x-4 z-20 grid gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 shadow-lg',
                stackItems.length === 1 && 'grid-cols-1 max-w-xs mx-auto',
                stackItems.length === 2 && 'grid-cols-2 max-w-lg mx-auto',
                stackItems.length === 3 && 'grid-cols-2 sm:grid-cols-3',
                stackItems.length === 4 && 'grid-cols-2 sm:grid-cols-4',
                stackItems.length === 5 && 'grid-cols-2 sm:grid-cols-5',
                stackItems.length >= 6 && 'grid-cols-2 sm:grid-flow-col sm:auto-cols-fr overflow-x-auto'
              )}
            >
              {stackItems.map((item, index) => {
                const isLastOddOnMobile = (stackItems.length % 2 === 1) && (index === stackItems.length - 1);
                const isSelected = activeSlide === item.id;

                return (
                  <SliderBtn
                    key={item.id}
                    value={item.id}
                    className={cn(
                      'cursor-pointer p-2.5 sm:p-3 rounded-xl text-left transition-all duration-200 border select-none',
                      isLastOddOnMobile
                        ? 'col-span-2 sm:col-span-1'
                        : 'col-span-1',
                      isSelected
                        ? 'border-emerald-600/40 bg-white/35 text-emerald-950 shadow-xs ring-1 ring-emerald-600/20'
                        : 'border-white/25 bg-white/10 text-stone-700 hover:bg-white/25 hover:text-stone-900'
                    )}
                    progressBarClass="bg-gradient-to-r from-emerald-600/35 to-amber-500/35 h-full rounded-xl"
                  >
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[38px] sm:min-h-[44px]">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={cn(
                            'text-[10px] sm:text-2xs font-extrabold tracking-wider uppercase',
                            isSelected ? 'text-emerald-800' : 'text-stone-600'
                          )}
                        >
                          0{index + 1}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_6px_rgba(5,150,105,0.5)]" />
                        )}
                      </div>
                      <h3
                        className={cn(
                          'text-2xs sm:text-xs md:text-sm tracking-tight line-clamp-1',
                          isSelected
                            ? 'font-bold text-emerald-950'
                            : 'font-semibold text-stone-800'
                        )}
                      >
                        {item.title}
                      </h3>
                    </div>
                  </SliderBtn>
                );
              })}
            </SliderBtnGroup>
          </ProgressSlider>
        </motion.div>
      </div>
    </section>
  );
};
