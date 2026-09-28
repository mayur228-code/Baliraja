import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Compass, 
  Sprout, 
  BookOpen, 
  Lightbulb, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryPillarsProps {
  lang: Language;
}

export const StoryPillars: FC<StoryPillarsProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const pillars = [
    {
      step: '01',
      title: t.storyPillar1Title,
      subtitle: t.storyPillar1Subtitle,
      desc: t.storyPillar1Desc,
      icon: Sprout,
      color: 'emerald',
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      step: '02',
      title: t.storyPillar2Title,
      subtitle: t.storyPillar2Subtitle,
      desc: t.storyPillar2Desc,
      icon: BookOpen,
      color: 'amber',
      iconBg: 'bg-amber-100 text-amber-800'
    },
    {
      step: '03',
      title: t.storyPillar3Title,
      subtitle: t.storyPillar3Subtitle,
      desc: t.storyPillar3Desc,
      icon: Lightbulb,
      color: 'teal',
      iconBg: 'bg-teal-100 text-teal-800'
    },
    {
      step: '04',
      title: t.storyPillar4Title,
      subtitle: t.storyPillar4Subtitle,
      desc: t.storyPillar4Desc,
      icon: ShieldCheck,
      color: 'emerald',
      iconBg: 'bg-emerald-100 text-emerald-800'
    }
  ];

  return (
    <section
      id="story-pillars"
      aria-labelledby="story-pillars-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-pillars-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <Compass className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyPillarsBadge}</span>
            </div>
          }
          title={t.storyPillarsHeading}
          subtitle={t.storyPillarsSubheading}
        />

        {/* 4 Connected Progressive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isLast = idx === pillars.length - 1;

            return (
              <motion.div
                key={pillar.step}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-30px' }}
                transition={{ duration: 0.45, delay: idx * 0.1, ease: 'easeOut' }}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-5 relative group"
              >
                {/* Arrow Connector on desktop between cards */}
                {!isLast && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-stone-100 border border-stone-200 items-center justify-center text-stone-400 group-hover:text-emerald-700 group-hover:border-emerald-300 transition-colors">
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${pillar.iconBg}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-black font-serif text-stone-300 group-hover:text-emerald-800 transition-colors">
                      {pillar.step}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold font-serif text-stone-900 group-hover:text-emerald-900 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-emerald-700">
                      {pillar.subtitle}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <div className="h-1 w-full rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                      style={{ width: `${(idx + 1) * 25}%` }}
                    />
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
