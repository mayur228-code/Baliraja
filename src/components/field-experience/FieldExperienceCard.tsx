import { useState } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Sprout, 
  ArrowRight, 
  Eye, 
  CheckSquare2, 
  Info, 
  Calendar,
  Layers
} from 'lucide-react';
import type { Language, FieldExperience } from '../../types';
import { translations } from '../../data/translations';

interface FieldExperienceCardProps {
  experience: FieldExperience;
  lang: Language;
  onViewDetails: (exp: FieldExperience) => void;
  index: number;
}

export const FieldExperienceCard: FC<FieldExperienceCardProps> = ({
  experience,
  lang,
  onViewDetails,
  index
}) => {
  const [imgError, setImgError] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const title = lang === 'mr' ? experience.titleMarathi : experience.titleEnglish;
  const cropName = lang === 'mr' ? experience.cropNameMarathi : experience.cropNameEnglish;
  const summary = lang === 'mr' ? experience.summaryMarathi : experience.summaryEnglish;
  const season = lang === 'mr' ? experience.seasonMarathi : experience.seasonEnglish;
  const stage = lang === 'mr' ? experience.stageMarathi : experience.stageEnglish;

  const animProps = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: '-20px' },
        transition: { duration: 0.35, delay: (index % 3) * 0.06, ease: 'easeOut' as const }
      };

  return (
    <motion.article
      {...animProps}
      className="group relative bg-white rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden text-left"
    >
      {/* Sample Badge */}
      <div className="absolute top-3.5 left-3.5 z-10">
        <span className="inline-flex items-center gap-1 bg-stone-900/80 text-stone-200 border border-stone-700/60 backdrop-blur-xs text-3xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-2xs">
          <Info className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
          <span>{t.fieldExperienceSampleBadge}</span>
        </span>
      </div>

      {/* Optional Top Image with Fallback */}
      <div className="relative w-full h-48 sm:h-52 bg-gradient-to-b from-stone-100 to-stone-200/70 overflow-hidden border-b border-stone-100 select-none">
        {experience.image && !imgError ? (
          <img
            src={experience.image}
            alt={`${cropName} - ${title}`}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/10 via-stone-100 to-stone-200/60 text-emerald-800 p-6 text-center">
            <Sprout className="w-12 h-12 text-emerald-700/70 mb-2" aria-hidden="true" />
            <span className="text-xs font-bold text-stone-600 font-serif">{cropName}</span>
          </div>
        )}

        {/* Season & Stage Pill Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
          {season && (
            <span className="inline-flex items-center gap-1 bg-white/95 text-stone-800 border border-stone-200/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-3xs font-bold shadow-2xs">
              <Calendar className="w-2.5 h-2.5 text-emerald-700" aria-hidden="true" />
              <span>{season}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Crop & Stage Indicator */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-2.5 py-0.5 rounded-md text-2xs font-bold">
              <Sprout className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>{cropName}</span>
            </span>

            {stage && (
              <span className="text-3xs text-stone-400 font-semibold truncate max-w-[180px] flex items-center gap-1">
                <Layers className="w-2.5 h-2.5" aria-hidden="true" />
                <span>{stage}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-base sm:text-lg font-bold font-serif text-stone-900 leading-snug group-hover:text-emerald-900 transition-colors">
            {title}
          </h4>

          {/* Summary */}
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {summary}
          </p>

          {/* Highlights Preview */}
          <div className="pt-2 border-t border-stone-100 space-y-2 text-2xs text-stone-600">
            <div className="flex items-start gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="line-clamp-1 font-medium text-stone-700">
                <strong className="text-stone-900">{t.fieldExperienceObservationTitle}:</strong> {lang === 'mr' ? experience.observationMarathi : experience.observationEnglish}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckSquare2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="line-clamp-1 font-medium text-stone-700">
                <strong className="text-stone-900">{t.fieldExperiencePracticeTitle}:</strong> {lang === 'mr' ? experience.practiceMarathi : experience.practiceEnglish}
              </span>
            </div>
          </div>
        </div>

        {/* View Details Action Button (Flow Button) */}
        <div className="pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => onViewDetails(experience)}
            className="flow-btn w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-xs hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            aria-label={`${t.fieldExperienceViewDetails}: ${title}`}
          >
            <span>{t.fieldExperienceViewDetails}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.article>
  );
};
