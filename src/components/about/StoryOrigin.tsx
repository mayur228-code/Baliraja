import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sprout, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryOriginProps {
  lang: Language;
}

export const StoryOrigin: FC<StoryOriginProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const leftColAnim = shouldReduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: -20 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: false, margin: '-40px' },
        transition: { duration: 0.5, ease: 'easeOut' as const }
      };

  const rightColAnim = shouldReduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: 20 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: false, margin: '-40px' },
        transition: { duration: 0.5, ease: 'easeOut' as const, delay: 0.1 }
      };

  return (
    <section
      id="story-origin"
      aria-labelledby="story-origin-heading"
      className="relative py-10 sm:py-14 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
        {/* Section Heading with Animated Underline */}
        <AnimatedSectionHeading
          id="story-origin-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyOriginBadge}</span>
            </div>
          }
          title={t.storyOriginHeading}
          subtitle={t.storyOriginSubheading}
        />

        {/* Narrative & Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left: Origin Story Narrative */}
          <motion.div
            {...leftColAnim}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed">
              <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-wider text-emerald-800">
                <Sprout className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>{lang === 'mr' ? 'संकल्प आणि प्रेरणा' : 'The Conviction'}</span>
              </div>

              <p className="text-stone-800 font-medium">
                {t.storyOriginP1}
              </p>

              <p className="text-stone-600">
                {t.storyOriginP2}
              </p>
            </div>

            {/* Grounded Key Facts */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    {lang === 'mr' ? '१००% प्रामाणिक निविष्ठा' : '100% Genuine Inputs'}
                  </h4>
                  <p className="text-2xs text-stone-500">
                    {lang === 'mr' ? 'प्रमाणित कंपन्यांचीच उत्पादने' : 'Direct certified supply'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    {lang === 'mr' ? 'प्रत्यक्ष शेतातील पाहणी' : 'On-Ground Diagnosis'}
                  </h4>
                  <p className="text-2xs text-stone-500">
                    {lang === 'mr' ? 'समस्या ओळखूनच उपाय' : 'Tailored to real crop stage'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Milestone Visual Card */}
          <motion.div
            {...rightColAnim}
            className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-xl flex flex-col justify-between relative overflow-hidden"
          >
            {/* Subtle background glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-2xs font-bold uppercase tracking-wider">
                <MapPin className="w-3 h-3 text-amber-400" aria-hidden="true" />
                <span>{lang === 'mr' ? 'स्थानिक पाळेमुळे' : 'Roots in Kaij'}</span>
              </div>

              <div className="space-y-1">
                <div className="text-4xl sm:text-5xl font-black font-serif text-amber-400">
                  {lang === 'mr' ? '२०१६' : '2016'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-emerald-100 uppercase tracking-wide">
                  {lang === 'mr' ? 'स्थापना वर्ष • कैज, जि. बीड' : 'Established in Kaij, Beed'}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                {lang === 'mr'
                  ? 'जानेगाव या मूळ शेतकरी गावातून सुरू झालेला हा विचार आज संपूर्ण कैज व मराठवाड्यातील शेतकरी बांधवांसाठी विश्वासाचा दीपस्तंभ बनला आहे.'
                  : 'Beginning from the agrarian village of Janegaon, this vision has grown into an enduring pillar of agricultural trust across Kaij and the Marathwada region.'}
              </p>
            </div>

            <div className="pt-6 relative z-10">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-2xs font-semibold text-emerald-200">
                  {lang === 'mr' ? 'शेतीशी अतूट नातं' : 'Bonded with the Soil'}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {lang === 'mr' ? '८+ वर्षे अखंड सेवा' : '8+ Years of Dedicated Service'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
