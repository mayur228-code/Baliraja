import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Milestone, 
  Flag, 
  Search, 
  Sparkles, 
  Users, 
  ArrowUpRight 
} from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryTimelineProps {
  lang: Language;
}

export const StoryTimeline: FC<StoryTimelineProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const milestones = [
    {
      year: t.storyTimeline1Year,
      title: t.storyTimeline1Title,
      desc: t.storyTimeline1Desc,
      icon: Flag,
      tag: lang === 'mr' ? 'स्थापना' : 'Foundation',
      color: 'emerald'
    },
    {
      year: t.storyTimeline2Year,
      title: t.storyTimeline2Title,
      desc: t.storyTimeline2Desc,
      icon: Search,
      tag: lang === 'mr' ? 'शेत पाहणी' : 'Field Visits',
      color: 'amber'
    },
    {
      year: t.storyTimeline3Year,
      title: t.storyTimeline3Title,
      desc: t.storyTimeline3Desc,
      icon: Sparkles,
      tag: lang === 'mr' ? 'विशेष तंत्रज्ञान' : 'Specialization',
      color: 'teal'
    },
    {
      year: t.storyTimeline4Year,
      title: t.storyTimeline4Title,
      desc: t.storyTimeline4Desc,
      icon: Users,
      tag: lang === 'mr' ? '१ लाख+ शेतकरी' : '1 Lakh+ Farmers',
      color: 'emerald'
    },
    {
      year: t.storyTimeline5Year,
      title: t.storyTimeline5Title,
      desc: t.storyTimeline5Desc,
      icon: ArrowUpRight,
      tag: lang === 'mr' ? 'भविष्य' : 'Future',
      color: 'amber'
    }
  ];

  return (
    <section
      id="story-timeline"
      aria-labelledby="story-timeline-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-timeline-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <Milestone className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyTimelineBadge}</span>
            </div>
          }
          title={t.storyTimelineHeading}
          subtitle={t.storyTimelineSubheading}
        />

        {/* Vertical Timeline Container */}
        <div className="relative pl-6 sm:pl-8 md:pl-0">
          {/* Central / Left Connecting Vertical Line */}
          <div className="absolute top-4 bottom-4 left-6 sm:left-8 md:left-1/2 -ml-px w-0.5 bg-gradient-to-b from-emerald-500 via-amber-400 to-emerald-700 opacity-40" />

          <div className="space-y-8 sm:space-y-12 relative">
            {milestones.map((m, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = m.icon;

              const cardAnim = shouldReduceMotion
                ? { initial: { opacity: 1 }, whileInView: { opacity: 1 } }
                : {
                    initial: { opacity: 0, x: isEven ? -24 : 24 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: false, margin: '-40px' },
                    transition: { duration: 0.45, delay: idx * 0.08, ease: 'easeOut' as const }
                  };

              return (
                <div
                  key={m.year}
                  className={`relative flex flex-col md:flex-row items-start ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Timeline Center Node */}
                  <div className="absolute -left-6 sm:-left-8 md:left-1/2 -translate-x-1/2 top-4 w-7 h-7 rounded-full bg-white border-2 border-emerald-700 shadow-md flex items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping opacity-75" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-700 absolute" />
                  </div>

                  {/* Content Box (Left or Right on desktop) */}
                  <div className="w-full md:w-1/2 md:px-8">
                    <motion.div
                      {...cardAnim}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs hover:border-emerald-300 transition-all duration-300 space-y-3 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
                          <Icon className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                          <span>{m.year}</span>
                        </div>

                        <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                          {m.tag}
                        </span>
                      </div>

                      <h3 className="text-base font-bold font-serif text-stone-900 group-hover:text-emerald-900 transition-colors">
                        {m.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                        {m.desc}
                      </p>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
