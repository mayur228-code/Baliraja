import { useEffect } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  X, 
  ArrowLeft, 
  Sprout, 
  Calendar, 
  Layers, 
  Eye, 
  CheckSquare2, 
  ShieldCheck, 
  Info, 
  Phone, 
  MessageCircle, 
  Package,
  AlertTriangle
} from 'lucide-react';
import type { Language, FieldExperience } from '../../types';
import { translations } from '../../data/translations';
import { sampleProducts } from '../../data/productData';
import { businessPlaceholderInfo } from '../../data/mockData';

interface FieldExperienceModalProps {
  experience: FieldExperience | null;
  lang: Language;
  onClose: () => void;
  onContactClick: () => void;
  onSelectProductCategory?: (categoryId: string) => void;
}

export const FieldExperienceModal: FC<FieldExperienceModalProps> = ({
  experience,
  lang,
  onClose,
  onContactClick,
  onSelectProductCategory
}) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  // Close on Escape key press & body scroll lock
  useEffect(() => {
    if (!experience) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [experience, onClose]);

  if (!experience) return null;

  const title = lang === 'mr' ? experience.titleMarathi : experience.titleEnglish;
  const cropName = lang === 'mr' ? experience.cropNameMarathi : experience.cropNameEnglish;
  const summary = lang === 'mr' ? experience.summaryMarathi : experience.summaryEnglish;
  const observation = lang === 'mr' ? experience.observationMarathi : experience.observationEnglish;
  const practice = lang === 'mr' ? experience.practiceMarathi : experience.practiceEnglish;
  const season = lang === 'mr' ? experience.seasonMarathi : experience.seasonEnglish;
  const stage = lang === 'mr' ? experience.stageMarathi : experience.stageEnglish;
  const keyInsights = lang === 'mr' ? experience.keyInsightsMarathi : experience.keyInsightsEnglish;

  // Single source of truth lookup for related products
  const relatedProducts = experience.relatedProductIds
    ? sampleProducts.filter((p) => experience.relatedProductIds?.includes(p.id))
    : [];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-field-experience-title"
      >
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm cursor-pointer"
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 16 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' as const }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh] text-left"
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>{lang === 'mr' ? 'अनुभवांवर परत जा' : 'Back to Field Experiences'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                {cropName}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={t.fieldExperienceCloseModal}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 sm:p-8 md:p-10 overflow-y-auto space-y-8">
            {/* Header Area */}
            <div className="space-y-3 border-b border-stone-100 pb-6">
              {/* Badges: Crop, Season, Stage, Sample Pill */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-stone-900 text-stone-100 text-3xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  <Info className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
                  <span>{t.fieldExperienceSampleBadge}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300/80 text-2xs font-bold px-3 py-1 rounded-full">
                  <Sprout className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                  <span>{cropName}</span>
                </span>

                {season && (
                  <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 border border-stone-200 text-2xs font-semibold px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3 text-stone-500" aria-hidden="true" />
                    <span>{season}</span>
                  </span>
                )}

                {stage && (
                  <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 border border-stone-200 text-2xs font-semibold px-2.5 py-1 rounded-full">
                    <Layers className="w-3 h-3 text-stone-500" aria-hidden="true" />
                    <span>{stage}</span>
                  </span>
                )}
              </div>

              {/* Title & Summary */}
              <h2 
                id="modal-field-experience-title" 
                className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight leading-tight pt-1"
              >
                {title}
              </h2>
              
              <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
                {summary}
              </p>
            </div>

            {/* In-depth Field Sections: Observation & Practice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Section 1: Field Observation */}
              <div className="bg-stone-50 rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  </div>
                  <span>{t.fieldExperienceObservationTitle}</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {observation}
                </p>
              </div>

              {/* Section 2: Practical Approach */}
              <div className="bg-emerald-50/50 rounded-2xl p-5 sm:p-6 border border-emerald-200/70 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-emerald-200/70 flex items-center justify-center">
                    <CheckSquare2 className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                  </div>
                  <span>{t.fieldExperiencePracticeTitle}</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {practice}
                </p>
              </div>

            </div>

            {/* Key Practical Insights Bullet Points */}
            {keyInsights && keyInsights.length > 0 && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>{t.fieldExperienceKeyInsightsTitle}</span>
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-600 list-disc list-inside">
                  {keyInsights.map((insight, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Agricultural Inputs (Cleanly referencing productData without duplicating fields) */}
            {relatedProducts.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>{t.fieldExperienceRelatedProductsTitle}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedProducts.map((prod) => {
                    const prodName = lang === 'mr' ? prod.nameMarathi : prod.nameEnglish;
                    return (
                      <div 
                        key={prod.id}
                        className="bg-stone-50 hover:bg-stone-100/80 rounded-2xl p-4 border border-stone-200 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-white p-1 border border-stone-200 shrink-0 flex items-center justify-center overflow-hidden">
                            {prod.image ? (
                              <img src={prod.image} alt={prodName} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <Package className="w-6 h-6 text-stone-400" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-stone-900 truncate">
                              {prodName}
                            </h5>
                            <span className="text-3xs text-emerald-700 font-semibold uppercase tracking-wider">
                              {prod.categoryId}
                            </span>
                          </div>
                        </div>

                        {onSelectProductCategory && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectProductCategory(prod.categoryId);
                            }}
                            className="shrink-0 text-2xs font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-stone-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            {t.fieldExperienceViewRelatedProduct}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Responsible Agricultural Disclaimer Note */}
            <div className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-4 sm:p-5 text-amber-950 space-y-1.5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {t.fieldExperienceDisclaimerTitle}
                </h5>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  {t.fieldExperienceDisclaimerText}
                </p>
              </div>
            </div>

            {/* Direct Consultation Action Bar (Flow Button System) */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onContactClick();
                  }}
                  className="flow-btn flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-xl shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  <span>{t.fieldExperienceCtaContactBtn}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    lang === 'mr'
                      ? `नमस्ते बळीराजा कृषी सेवा केंद्र, मला या पिकाच्या अनुभवाबाबत चर्चा करायची आहे: ${cropName} (${title})`
                      : `Hello Baliraja Krishi Seva Kendra, I would like to consult about field observation: ${cropName} (${title})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flow-btn inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-semibold text-xs sm:text-sm py-3 px-5 rounded-xl border border-stone-700 cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-hidden"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>{t.whatsappChat}</span>
                </a>
              </div>

              <p className="text-3xs text-stone-400 text-center">
                {lang === 'mr' 
                  ? `केंद्राशी थेट संपर्क: ${businessPlaceholderInfo.phonePlaceholder} | वेळ: ${businessPlaceholderInfo.timingPlaceholderMr}`
                  : `Direct Store Contact: ${businessPlaceholderInfo.phonePlaceholder} | Hours: ${businessPlaceholderInfo.timingPlaceholder}`}
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
