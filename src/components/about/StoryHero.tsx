import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, ChevronDown } from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';

interface StoryHeroProps {
  lang: Language;
  onExploreClick?: () => void;
}

export const StoryHero: FC<StoryHeroProps> = ({ lang, onExploreClick }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const handleScrollDown = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      const el = document.getElementById('story-origin');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="relative w-full rounded-3xl sm:rounded-4xl overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 text-white min-h-[300px] sm:min-h-[340px] lg:min-h-[380px] flex flex-col items-center justify-center text-center p-6 sm:p-8 lg:p-12 shadow-xl border border-emerald-600/30 select-none">
      {/* Subtle Ambient Glassmorphic Glows */}
      <div className="absolute -top-16 -left-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" aria-hidden="true" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center space-y-4 sm:space-y-5">
        {/* Badge */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-inner"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" aria-hidden="true" />
          <span>{t.storyHeroBadge}</span>
        </motion.div>

        {/* Centered Heading */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
          className="space-y-1.5 group/hero-heading cursor-default text-center"
        >
          <div className="text-xs sm:text-sm font-bold tracking-widest uppercase text-amber-300/95 font-mono drop-shadow-sm">
            {lang === 'mr' ? 'बळीराजा कृषी सेवा केंद्र' : 'BALIRAJA'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-serif text-white tracking-tight leading-tight drop-shadow-md">
            {lang === 'mr' ? 'आमची यशोगाथा' : 'OUR STORY'}
          </h1>

          {/* Animated Underline */}
          <div className="flex justify-center pt-1">
            <AnimatedUnderline
              align="center"
              widthClass="h-1 sm:h-1.5 w-24 sm:w-32 md:w-40"
              gradientClass="bg-gradient-to-r from-amber-400 via-emerald-300 to-amber-400"
            />
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.16 }}
          className="text-xs sm:text-sm md:text-base text-emerald-100/90 max-w-2xl leading-relaxed font-normal drop-shadow-xs"
        >
          {t.storyHeroSubtitle}
        </motion.p>

        {/* Scroll down trigger */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="pt-2 sm:pt-4"
        >
          <button
            type="button"
            onClick={handleScrollDown}
            className="group/scroll inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-medium text-emerald-100 hover:text-white transition-all duration-300 backdrop-blur-md cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 outline-hidden"
          >
            <span>{t.storyScrollDown}</span>
            <ChevronDown className="w-4 h-4 text-amber-300 group-hover/scroll:translate-y-0.5 transition-transform duration-300" aria-hidden="true" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
