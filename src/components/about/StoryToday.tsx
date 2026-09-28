import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Home, 
  Gem, 
  ExternalLink 
} from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { verifiedBusinessInfo } from '../../data/aboutData';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryTodayProps {
  lang: Language;
}

export const StoryToday: FC<StoryTodayProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const infoCards = [
    {
      id: 'location',
      title: t.storyTodayLocationTitle,
      desc: t.storyTodayLocationDesc,
      icon: MapPin,
      iconBg: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'roots',
      title: t.storyTodayOriginTitle,
      desc: t.storyTodayOriginDesc,
      icon: Home,
      iconBg: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'reach',
      title: t.storyTodayServiceTitle,
      desc: t.storyTodayServiceDesc,
      icon: Users,
      iconBg: 'bg-teal-100 text-teal-800'
    },
    {
      id: 'contact',
      title: t.storyTodayContactTitle,
      desc: t.storyTodayContactDesc,
      icon: Phone,
      iconBg: 'bg-emerald-100 text-emerald-800'
    }
  ];

  return (
    <section
      id="story-today"
      aria-labelledby="story-today-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-today-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <Building2 className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyTodayBadge}</span>
            </div>
          }
          title={t.storyTodayHeading}
          subtitle={t.storyTodaySubheading}
        />

        {/* 4 Verified Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {infoCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-30px' }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: 'easeOut' }}
                className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs hover:border-emerald-300 transition-colors flex items-start gap-4"
              >
                <div className={`p-3 rounded-2xl shrink-0 ${card.iconBg}`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-900">
                    {card.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Other Business Box */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="bg-stone-100/80 rounded-2xl p-5 sm:p-6 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
              <Gem className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {lang === 'mr' ? 'इतर व्यवसाय' : 'Other Business'}
              </h4>
              <div className="pt-0.5">
                <span className="inline-block text-sm sm:text-base font-black font-serif text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/80 shadow-2xs">
                  {lang === 'mr' ? 'बळीराजा ज्वेलर्स' : 'Baliraja Jewellers'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 font-normal pt-0.5">
                {lang === 'mr' ? 'सराफ लाईन, बसस्थानकाजवळ, कैज' : 'Saraf line near bustand, Kaij'}
              </p>
            </div>
          </div>

          <a
            href={verifiedBusinessInfo.location.googleMapsExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors shrink-0 self-start sm:self-center"
          >
            <span>{lang === 'mr' ? 'केंद्राचे नकाशावर स्थान' : 'Store Location on Maps'}</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
