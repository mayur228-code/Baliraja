import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Heart, 
  Users, 
  ShieldCheck, 
  MapPin, 
  Repeat, 
  Award 
} from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryBeliefsProps {
  lang: Language;
}

export const StoryBeliefs: FC<StoryBeliefsProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const beliefs = [
    {
      id: 'b1',
      title: t.storyBelief1Title,
      desc: t.storyBelief1Desc,
      icon: Users,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'b2',
      title: t.storyBelief2Title,
      desc: t.storyBelief2Desc,
      icon: ShieldCheck,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'b3',
      title: t.storyBelief3Title,
      desc: t.storyBelief3Desc,
      icon: MapPin,
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      id: 'b4',
      title: t.storyBelief4Title,
      desc: t.storyBelief4Desc,
      icon: Repeat,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'b5',
      title: t.storyBelief5Title,
      desc: t.storyBelief5Desc,
      icon: Award,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  ];

  return (
    <section
      id="story-beliefs"
      aria-labelledby="story-beliefs-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-beliefs-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <Heart className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyBeliefsBadge}</span>
            </div>
          }
          title={t.storyBeliefsHeading}
          subtitle={t.storyBeliefsSubheading}
        />

        {/* 5 Belief Cards (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beliefs.map((b, idx) => {
            const Icon = b.icon;
            const isWide = idx === 4; // 5th item expands nicely on 3-col grid if on lg

            return (
              <motion.div
                key={b.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-30px' }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: 'easeOut' }}
                className={`bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-4 ${
                  isWide ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className={`p-3 rounded-2xl border w-fit ${b.colorClass}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>

                  <h3 className="text-base font-bold font-serif text-stone-900">
                    {b.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {b.desc}
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
