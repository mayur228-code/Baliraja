import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HeartHandshake, ShieldCheck, Award, Users } from 'lucide-react';
import type { Language } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedSectionHeading } from '../common/AnimatedSectionHeading';

interface StoryGrowingWithFarmersProps {
  lang: Language;
}

export const StoryGrowingWithFarmers: FC<StoryGrowingWithFarmersProps> = ({ lang }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const features = [
    {
      id: 'f1',
      title: t.storyGrowingFeature1,
      icon: Users,
      desc: lang === 'mr' ? 'केवळ दुकानापुरता सल्ला न देता, बांधावर जाऊन पिकांची पाहणी.' : 'Observing real crop conditions on the field rather than counter assumptions.'
    },
    {
      id: 'f2',
      title: t.storyGrowingFeature2,
      icon: ShieldCheck,
      desc: lang === 'mr' ? 'रोग-कीड किंवा प्रतिकूल हवामानात तातडीने योग्य निवारण.' : 'Immediate agronomic intervention during pest outbreaks or unpredictable weather.'
    },
    {
      id: 'f3',
      title: t.storyGrowingFeature3,
      icon: Award,
      desc: lang === 'mr' ? 'खर्चात बचत आणि उत्पादनात भरघोस वाढीचे शास्त्रशुद्ध नियोजन.' : 'Disciplined input expenditures focused on maximizing harvest yield.'
    }
  ];

  return (
    <section
      id="story-growing"
      aria-labelledby="story-growing-heading"
      className="relative py-12 sm:py-16 scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <AnimatedSectionHeading
          id="story-growing-heading"
          align="center"
          badge={
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{t.storyGrowingBadge}</span>
            </div>
          }
          title={t.storyGrowingHeading}
          subtitle={t.storyGrowingSubheading}
        />

        {/* Narrative Banner & 3 Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Narrative Block */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed">
              <p className="text-stone-800 font-medium">
                {t.storyGrowingP1}
              </p>
              <p className="text-stone-600">
                {t.storyGrowingP2}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <HeartHandshake className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold text-emerald-950">
                {lang === 'mr'
                  ? 'शेतकऱ्यांचा विश्वास हीच आमची खरी पुंजी आणि यशाची व्याख्या आहे.'
                  : 'Farmer trust is our greatest asset and our true measure of success.'}
              </p>
            </div>
          </motion.div>

          {/* 3 Interactive Feature Cards */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.id}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: '-30px' }}
                  transition={{ duration: 0.45, delay: idx * 0.08, ease: 'easeOut' }}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs hover:border-emerald-300 transition-colors flex items-start gap-4"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-stone-900">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
