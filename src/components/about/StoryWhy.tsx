import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HelpCircle, ShieldAlert, Eye, TrendingUp, Quote } from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryWhyProps {
  lang: Language;
}

export const StoryWhy: FC<StoryWhyProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const cards = [
    {
      id: 'no-sales-pressure',
      title: t.storyWhyCard1Title,
      desc: t.storyWhyCard1Desc,
      icon: ShieldAlert,
      badge: lang === 'mr' ? 'प्रामाणिक सल्ला' : 'Honest Advice',
      borderClass: 'border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'field-observation',
      title: t.storyWhyCard2Title,
      desc: t.storyWhyCard2Desc,
      icon: Eye,
      badge: lang === 'mr' ? 'प्रत्यक्ष पाहणी' : 'Field Tested',
      borderClass: 'border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'farmer-prosperity',
      title: t.storyWhyCard3Title,
      desc: t.storyWhyCard3Desc,
      icon: TrendingUp,
      badge: lang === 'mr' ? 'शाश्वत नफा' : 'Sustainable Yield',
      borderClass: 'border-teal-200 hover:border-teal-400',
      iconBg: 'bg-teal-100 text-teal-800'
    }
  ];

  return (
    <section
      id="story-why"
      aria-labelledby="story-why-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12 text-center">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-why-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyWhyBadge}</span>
            </div>
          }
          title={t.storyWhyHeading}
        />

        {/* Large Editorial Statement Quote Card */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl border border-emerald-700/50 overflow-hidden"
        >
          <Quote className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 pointer-events-none" aria-hidden="true" />

          <p className="relative z-10 text-base sm:text-xl lg:text-2xl font-serif font-bold text-emerald-50 leading-relaxed max-w-3xl mx-auto">
            "{t.storyWhyStatement}"
          </p>
        </motion.div>

        {/* 3 Core Value Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-30px' }}
                transition={{ duration: 0.45, delay: idx * 0.1, ease: 'easeOut' }}
                className={`bg-white rounded-3xl p-6 sm:p-7 border shadow-xs transition-all duration-300 flex flex-col justify-between space-y-4 ${card.borderClass}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${card.iconBg}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-serif text-stone-900 leading-snug">
                    {card.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
