import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Sprout, 
  Sparkles, 
  PackageOpen, 
  Phone, 
  ArrowRight, 
  AlertTriangle 
} from 'lucide-react';
import type { Language, FieldExperience } from '../../types';
import { fieldExperiences } from '../../data/fieldExperienceData';
import { translations } from '../../data/translations';
import { FieldExperienceCard } from './FieldExperienceCard';
import { FieldExperienceModal } from './FieldExperienceModal';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';

interface FieldExperienceSectionProps {
  lang: Language;
  onContactClick: () => void;
  onSelectProductCategory?: (categoryId: string) => void;
  experiences?: FieldExperience[];
}

export const FieldExperienceSection: FC<FieldExperienceSectionProps> = ({
  lang,
  onContactClick,
  onSelectProductCategory,
  experiences = fieldExperiences
}) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<FieldExperience | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const t = translations[lang];

  // Distinct crop options for local section filtering
  const cropFilters = useMemo(() => [
    { key: 'all', labelMr: 'सर्व पिके', labelEn: 'All Crops' },
    { key: 'ginger', labelMr: 'आले (अद्रक)', labelEn: 'Ginger' },
    { key: 'soybean', labelMr: 'सोयाबीन', labelEn: 'Soybean' },
    { key: 'cotton', labelMr: 'कापूस', labelEn: 'Cotton' },
    { key: 'vegetables', labelMr: 'भाजीपाला', labelEn: 'Vegetables' },
    { key: 'turmeric', labelMr: 'हळद', labelEn: 'Turmeric' }
  ], []);

  // Filtered field experiences based on local crop selection with static fallback
  const allExperiences = experiences || fieldExperiences;
  const filteredExperiences = useMemo(() => {
    if (selectedCrop === 'all') return allExperiences;
    return allExperiences.filter((item) => item.cropKey === selectedCrop);
  }, [selectedCrop, allExperiences]);

  return (
    <section
      id="field-experience"
      aria-labelledby="field-experience-heading"
      className="space-y-16 sm:space-y-20 py-8 border-t border-stone-200/90 text-left scroll-mt-24"
    >
      {/* 1. Section Header & Introduction */}
      <div className="group/heading space-y-4 max-w-3xl cursor-default select-none">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-emerald-700" aria-hidden="true" />
            <span>{t.fieldExperienceBadge}</span>
          </div>

          <h2
            id="field-experience-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-stone-900 tracking-tight leading-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-950"
          >
            {t.fieldExperienceHeading}
          </h2>

          {/* Animated Agricultural Underline matching Fertilizers reference */}
          <AnimatedUnderline align="left" />

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-2.5">
            {t.fieldExperienceSubheading}
          </p>
        </motion.div>
      </div>

      {/* 2. Crop Selection Filter Tabs */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-30px' }}
        transition={{ duration: 0.35, delay: 0.06, ease: 'easeOut' }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
          <div className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-stone-400">
            <Sprout className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            <span>{t.fieldExperienceFilterByCrop}</span>
          </div>

          {/* Filter Pills (Horizontally Scrollable on Small Mobile) */}
          <div 
            role="tablist"
            aria-label={t.fieldExperienceFilterByCrop}
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
          >
            {cropFilters.map((tab) => {
              const isActive = selectedCrop === tab.key;
              const tabLabel = lang === 'mr' ? tab.labelMr : tab.labelEn;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCrop(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                  }`}
                >
                  <span>{tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* 3. Field Experience Cards Grid */}
        {filteredExperiences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiences.map((exp, idx) => (
              <FieldExperienceCard
                key={exp.id}
                experience={exp}
                lang={lang}
                onViewDetails={setSelectedExperience}
                index={idx}
              />
            ))}
          </div>
        ) : (
          /* Empty State when no experiences match filter */
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-10 sm:p-14 border border-stone-200 text-center space-y-4 max-w-lg mx-auto my-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-100">
              <PackageOpen className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                {t.fieldExperienceEmptyTitle}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {t.fieldExperienceEmptyDesc}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedCrop('all')}
                className="flow-btn inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                <span>{t.fieldExperienceResetFilter}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Responsible Agricultural Disclaimer & Closing CTA Card */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-30px' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative rounded-3xl bg-gradient-to-br from-stone-900 via-stone-950 to-emerald-950 p-6 sm:p-8 md:p-10 text-white shadow-xl overflow-hidden border border-stone-800"
      >
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Text & Disclaimer Context */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <AlertTriangle className="w-3 h-3 text-amber-400" aria-hidden="true" />
              <span>{t.fieldExperienceDisclaimerTitle}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
              {t.fieldExperienceCtaTitle}
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {t.fieldExperienceCtaSubtitle}
            </p>

            <p className="text-2xs text-stone-400 border-t border-stone-800/80 pt-3 leading-relaxed">
              {t.fieldExperienceDisclaimerText}
            </p>
          </div>

          {/* Action Route Buttons (Flow Button System) */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onContactClick}
              className="flow-btn inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold py-3 px-6 rounded-xl shadow-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>{t.fieldExperienceCtaContactBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('catalog-browser');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flow-btn inline-flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-semibold py-3 px-5 rounded-xl border border-stone-700 cursor-pointer"
            >
              <span>{t.fieldExperienceCtaProductsBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 7. Field Experience Detail Modal */}
      <FieldExperienceModal
        experience={selectedExperience}
        lang={lang}
        onClose={() => setSelectedExperience(null)}
        onContactClick={onContactClick}
        onSelectProductCategory={onSelectProductCategory}
      />
    </section>
  );
};
