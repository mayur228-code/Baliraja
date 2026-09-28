import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Sparkles, 
  PhoneCall, 
  MessageCircle, 
  MapPin, 
  ArrowRight 
} from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryClosingProps {
  lang: Language;
  onContactClick?: () => void;
  onBackToHome?: () => void;
}

export const StoryClosing: FC<StoryClosingProps> = ({
  lang,
  onContactClick,
  onBackToHome
}) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  return (
    <section
      id="story-closing"
      aria-labelledby="story-closing-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12 text-center">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-closing-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyClosingBadge}</span>
            </div>
          }
          title={t.storyClosingHeading}
          subtitle={t.storyClosingSubheading}
        />

        {/* Cinematic Call to Action Box */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-950 text-white rounded-3xl sm:rounded-4xl p-8 sm:p-12 border border-emerald-800/50 shadow-2xl space-y-8 relative overflow-hidden"
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 relative z-10 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-emerald-100">
              {lang === 'mr' ? 'आपल्या शेतीसाठी विश्वासू सल्लागार' : 'A Trusted Partner for Your Agricultural Journey'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed font-normal">
              {lang === 'mr'
                ? 'आले, सोयाबीन, कापूस किंवा भाजीपाला पिकांच्या कोणत्याही समस्येसाठी थेट संपर्क साधा.'
                : 'Connect directly for tailored agronomic solutions across ginger, soybean, cotton, and vegetables.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:9881070520"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs sm:text-sm shadow-lg transition-transform duration-200 hover:scale-105 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 outline-hidden"
            >
              <PhoneCall className="w-4 h-4 text-emerald-800" aria-hidden="true" />
              <span>{t.storyClosingCallBtn}</span>
            </a>

            <a
              href="https://wa.me/919881070520"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-transform duration-200 hover:scale-105 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 outline-hidden"
            >
              <MessageCircle className="w-4 h-4 text-white" aria-hidden="true" />
              <span>{t.storyClosingWhatsappBtn}</span>
            </a>

            {onContactClick && (
              <button
                type="button"
                onClick={onContactClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 font-bold text-xs sm:text-sm border border-emerald-700/60 shadow-lg transition-transform duration-200 hover:scale-105 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 outline-hidden"
              >
                <MapPin className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>{t.storyClosingVisitBtn}</span>
              </button>
            )}
          </div>

          {/* Back to Home Link */}
          {onBackToHome && (
            <div className="pt-4 relative z-10">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors cursor-pointer font-semibold underline underline-offset-4"
              >
                <span>{t.backToHomeFromAbout}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
