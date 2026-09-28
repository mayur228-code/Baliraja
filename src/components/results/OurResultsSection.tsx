import type { FC } from 'react';
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { User, MapPin } from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { useContentStore } from '../../data/contentStore';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';
import { cn } from '../../lib/utils';

interface OurResultsSectionProps {
  lang: Language;
}

/**
 * Our Results Section
 * Displays authentic farmer yield and crop result portrait photographs
 * with an alternating left/right viewport entrance animation.
 */
export const OurResultsSection: FC<OurResultsSectionProps> = ({ lang }) => {
  const { results } = useContentStore();
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  // Map to localized data strings
  const localizedResults = useMemo(() => {
    return results.map((item, index) => {
      const nameEn = item.name?.en || item.nameEn || 'Farmer Partner';
      const nameMr = item.name?.mr || item.nameMr || 'शेतकरी बांधव';
      const locEn = item.location?.en || item.locationEn || 'Kaij Region';
      const locMr = item.location?.mr || item.locationMr || 'कैज परिसर';

      const displayName = lang === 'mr' ? nameMr : nameEn;
      const displayLocation = lang === 'mr' ? locMr : locEn;

      // Determine left or right entry: even -> left, odd -> right
      const isFromLeft = index % 2 === 0;

      return {
        id: item.id,
        image: item.image,
        displayName,
        displayLocation,
        isFromLeft,
        index
      };
    });
  }, [results, lang]);

  if (localizedResults.length === 0) return null;

  return (
    <section
      id="our-results"
      aria-labelledby="our-results-heading"
      className="relative py-12 sm:py-16 lg:py-20 my-6 rounded-3xl bg-gradient-to-b from-[#fbfdfa] via-[#f7faf4]/90 to-[#fbfdfa] overflow-hidden scroll-mt-24 border border-stone-100"
    >
      {/* ── Background Subtle Agricultural Ambience ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {/* Soft natural radial glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-amber-100/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-emerald-50/50 blur-3xl" />
        
        {/* Subtle geometric grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #065f46 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Heading & Animated Underline (Standardized across website) ── */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <AnimatedSectionHeading
            id="our-results-heading"
            title={t.ourResultsHeading}
            subtitle={t.ourResultsSubheading}
            underlineWidthClass="h-0.5 sm:h-[3px] w-16 sm:w-20 md:w-24"
            underlineGradientClass="bg-gradient-to-r from-emerald-800 via-emerald-600 to-amber-500"
          />
        </div>

        {/* ── Alternating Left + Right Portrait Cards Flow ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-8 justify-items-center">
          {localizedResults.map((item) => {
            const initialX = shouldReduceMotion ? 0 : (item.isFromLeft ? -70 : 70);
            const initialScale = shouldReduceMotion ? 1 : 0.96;
            const staggerDelay = (item.index % 3) * 0.08;

            return (
              <motion.div
                key={item.id}
                initial={{
                  x: initialX,
                  opacity: 0,
                  scale: initialScale
                }}
                whileInView={{
                  x: 0,
                  opacity: 1,
                  scale: 1
                }}
                viewport={{ once: false, margin: '-20px' }}
                transition={{
                  duration: 0.38,
                  ease: [0.22, 1, 0.36, 1],
                  delay: staggerDelay
                }}
                className={cn(
                  'w-full max-w-[320px] sm:max-w-[340px] group flex flex-col',
                  // Subtle vertical offset for visual rhythm on desktop
                  item.index % 3 === 1 ? 'lg:translate-y-4' : ''
                )}
              >
                <div className="relative w-full rounded-3xl bg-white border border-stone-200/90 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 ease-out overflow-hidden flex flex-col justify-between">
                  {/* ── Portrait Photograph Container (~3:4 aspect ratio) ── */}
                  <div className="relative w-full aspect-[3/4] sm:h-[420px] bg-stone-100 overflow-hidden select-none">
                    <img
                      src={item.image}
                      alt={`${item.displayName} - ${item.displayLocation}`}
                      width={600}
                      height={800}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-200 ease-out"
                    />

                    {/* Subtle gradient scrim at bottom to enhance transition */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                    {/* ── Official Baliraja Brand Logo (Top-Right of Every Photo - Clean Circular, No White Box) ── */}
                    <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none select-none">
                      <img
                        src="/assets/logo.png"
                        alt="Baliraja Logo"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* ── Clean & Minimal Farmer Information (Below Photo) ── */}
                  <div className="p-4 sm:p-5 bg-white border-t border-stone-100 space-y-1.5">
                    {/* Farmer Name */}
                    <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-sm sm:text-base leading-snug">
                      <User className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      <span className="truncate" title={item.displayName}>
                        {item.displayName}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-stone-600 text-xs sm:text-sm font-medium leading-normal">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                      <span className="truncate" title={item.displayLocation}>
                        {item.displayLocation}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
