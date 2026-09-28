import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  ShieldCheck, 
  BookOpen, 
  Users, 
  MapPin, 
  Repeat,
  Compass
} from 'lucide-react';
import type { Language } from '../../types';
import { businessStoryPrinciples } from '../../data/aboutData';
import { translations } from '../../data/translations';

interface AboutApproachProps {
  lang: Language;
}

export const AboutApproach: FC<AboutApproachProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const getIcon = (name: string) => {
    switch (name) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-700" aria-hidden="true" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-emerald-700" aria-hidden="true" />;
      case 'Users':
        return <Users className="w-5 h-5 text-emerald-700" aria-hidden="true" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-emerald-700" aria-hidden="true" />;
      case 'Repeat':
        return <Repeat className="w-5 h-5 text-emerald-700" aria-hidden="true" />;
      default:
        return <Compass className="w-5 h-5 text-emerald-700" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="space-y-1.5 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
          <Compass className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
          <span>{t.ourApproachHeading}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black font-serif text-stone-900 tracking-tight leading-tight">
          {lang === 'mr' ? 'शेती सेवा आणि मार्गदर्शनाची मुख्य तत्त्वे' : 'Principles Guiding Our Agricultural Service'}
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {t.ourApproachSubheading}
        </p>
      </div>

      {/* 5 Principles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {businessStoryPrinciples.map((item, idx) => {
          const motionProps = shouldReduceMotion
            ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
            : {
                initial: { opacity: 0, y: 14 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: false, margin: '-20px' },
                transition: { duration: 0.35, delay: (idx % 3) * 0.06, ease: 'easeOut' as const }
              };

          return (
            <motion.div
              key={item.id}
              {...motionProps}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-xs hover:border-emerald-700/30 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 transition-transform">
                  {getIcon(item.iconName)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold font-serif text-stone-900 leading-tight">
                      {lang === 'mr' ? item.titleMr : item.titleEn}
                    </h4>
                    <span className="text-3xs font-mono font-bold text-stone-300">
                      0{idx + 1}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {lang === 'mr' ? item.descriptionMr : item.descriptionEn}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
