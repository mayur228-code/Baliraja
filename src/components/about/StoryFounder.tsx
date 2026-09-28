import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Sprout, 
  Sparkles, 
  Users, 
  UserCheck, 
  MapPin, 
  PhoneCall, 
  CheckCircle 
} from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';
import { useContentStore } from '../../data/contentStore';
import ownerImg from '../../assets/owner.png';

interface StoryFounderProps {
  lang: Language;
  onContactClick?: () => void;
}

export const StoryFounder: FC<StoryFounderProps> = ({ lang, onContactClick }) => {
  const shouldReduceMotion = useReducedMotion();
  const { ownerProfile } = useContentStore();
  const t = translations[lang];
  const founderPhoto = ownerProfile?.image || ownerImg;

  const highlights = [
    {
      id: 'crop-advisor',
      title: t.storyFounderHighlight1Title,
      desc: t.storyFounderHighlight1Desc,
      icon: Sprout,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'ginger-specialist',
      title: t.storyFounderHighlight2Title,
      desc: t.storyFounderHighlight2Desc,
      icon: Sparkles,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'guided-farmers',
      title: t.storyFounderHighlight3Title,
      desc: t.storyFounderHighlight3Desc,
      icon: Users,
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200'
    }
  ];

  const leftMotion = shouldReduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: -30 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: false, margin: '-40px' },
        transition: { duration: 0.55, ease: 'easeOut' as const }
      };

  const rightMotion = shouldReduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: 30 },
        whileInView: { opacity: 1, x: 0 },
        viewport: { once: false, margin: '-40px' },
        transition: { duration: 0.55, ease: 'easeOut' as const, delay: 0.1 }
      };

  return (
    <section
      id="story-founder"
      aria-labelledby="story-founder-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-founder-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <UserCheck className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyFounderBadge}</span>
            </div>
          }
          title={t.storyFounderHeading}
          subtitle={t.storyFounderSubheading}
        />

        {/* Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
          {/* Left Column: Official Owner Photo with Premium Presentation */}
          <motion.div
            {...leftMotion}
            className="lg:col-span-5 flex flex-col items-center"
          >
            <div className="relative w-full max-w-sm">
              {/* Outer frame glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-600 via-amber-400 to-emerald-700 rounded-3xl blur-sm opacity-40 group-hover:opacity-75 transition duration-500" />

              {/* Card Container */}
              <div className="relative bg-white rounded-3xl p-3 border border-stone-200/90 shadow-xl overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-stone-100 aspect-3/4 flex items-center justify-center">
                  <img
                    src={founderPhoto}
                    alt={lang === 'mr' ? 'श्री. गणेश भीमराव शिंदे' : 'Mr. Ganesh Bhimrao Shinde'}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />

                  {/* Subtle bottom gradient on photo */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent flex flex-col justify-end p-4 text-white" />
                </div>

                {/* Info Bar Below Photo */}
                <div className="p-3 text-center space-y-1">
                  <h3 className="font-serif font-black text-stone-900 text-base sm:text-lg">
                    {lang === 'mr' ? 'श्री. गणेश भीमराव शिंदे' : 'Mr. Ganesh Bhimrao Shinde'}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-2xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <MapPin className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                    <span>{lang === 'mr' ? 'मूळ गाव: जानेगाव • कैज' : 'Native: Janegaon • Kaij'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Founder Story & Verified Expertise Highlights */}
          <motion.div
            {...rightMotion}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Editorial Bio Block */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span className="text-2xs font-bold uppercase tracking-wider text-emerald-900">
                  {lang === 'mr' ? 'प्रत्यक्ष बांधावरील अनुभव' : 'On-Ground Agricultural Experience'}
                </span>
              </div>

              <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                {t.storyFounderBio}
              </p>
            </div>

            {/* 3 Verified Expertise Highlights */}
            <div className="space-y-3">
              {highlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: '-30px' }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-emerald-300 transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl border shrink-0 ${item.colorClass}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <h4 className="text-sm font-bold text-stone-900">
                        {item.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Direct Consultation Connect */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
              <a
                href="tel:9881070520"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{lang === 'mr' ? 'थेट फोन करा (९८८१०७०५२०)' : 'Call Direct (9881070520)'}</span>
              </a>

              {onContactClick && (
                <button
                  type="button"
                  onClick={onContactClick}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 cursor-pointer"
                >
                  {lang === 'mr' ? 'केंद्राचा पत्ता व नकाशा →' : 'View Store Address & Map →'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
