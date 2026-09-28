import { useState, createElement } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { Language, NavCategory } from '../../types';
import { getCategoryIconComponent } from '../../lib/categoryIcons';

export { CategoryImagesBadge } from '../ui/images-badge';

const FAST_EASE = { duration: 0.18, ease: 'easeOut' as const };

export interface CategoryCardProps {
  category: NavCategory;
  lang: Language;
  isSelected?: boolean;
  onSelect?: (categoryId: string) => void;
  index?: number;
  className?: string;
}

const REST_ROTATIONS = [-1.5, 1, -1, 1.5] as const;

export const CategoryCard: FC<CategoryCardProps> = ({
  category,
  lang,
  isSelected = false,
  onSelect,
  index = 0,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Strictly single-language: only currently active language name
  const title = lang === 'mr' ? category.nameMr : category.name;
  const restRotate = REST_ROTATIONS[index % REST_ROTATIONS.length] ?? 0;

  const handleClick = () => {
    if (onSelect) {
      onSelect(category.id);
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-20px' }}
      transition={{ duration: 0.18, delay: (index % 5) * 0.03, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.02, transition: { duration: 0.12, ease: 'easeOut' } }}
      onClick={handleClick}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={isSelected}
      aria-label={title}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(category.id);
        }
      }}
      className={`group relative flex flex-col items-center cursor-pointer select-none rounded-2xl sm:rounded-3xl p-3 sm:p-4 will-change-transform transition-[border-color,background-color] duration-150 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isSelected
          ? 'bg-white/65 border-emerald-500/90 ring-2 ring-emerald-500/50 shadow-[0_12px_32px_rgba(5,150,105,0.22)]'
          : 'bg-white/45 sm:bg-white/40 hover:bg-white/55 border border-white/60 hover:border-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
      } backdrop-blur-md ${className}`}
    >
      {/* Featured / Highlight Badge */}
      {Boolean(category.featured || category.highlight) && (
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 pointer-events-none flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full bg-amber-500/90 text-white backdrop-blur-md shadow-[0_2px_8px_rgba(245,158,11,0.35)] border border-amber-300/60">
          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-100" />
          <span className="text-3xs sm:text-2xs font-extrabold uppercase tracking-wider leading-none">
            {lang === 'mr' ? 'विशेष' : 'Featured'}
          </span>
        </div>
      )}

      {/* 1. Translucent Frosted Glass Category Artwork Container */}
      <motion.div 
        animate={shouldReduceMotion ? undefined : { rotate: isSelected ? 0 : restRotate }}
        whileHover={shouldReduceMotion ? undefined : { rotate: 0 }}
        transition={FAST_EASE}
        className="relative w-full aspect-square sm:aspect-[4/3] rounded-xl sm:rounded-2xl bg-white/25 border border-white/35 p-2.5 sm:p-4 flex items-center justify-center overflow-hidden"
      >
        {category.image && !imgError ? (
          <img
            src={category.image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-contain group-hover:scale-104 transition-transform duration-150 ease-out select-none"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center p-4">
            {createElement(getCategoryIconComponent(category.icon || category.id), {
              className: "w-10 h-10 text-emerald-600",
              'aria-hidden': true
            })}
          </div>
        )}
      </motion.div>

      {/* 2. Category Name (Strictly Single Language, Dark Typography with text-shadow) */}
      <h3 className={`mt-3 sm:mt-3.5 text-center text-xs sm:text-sm md:text-base font-bold font-serif tracking-tight leading-snug transition-colors duration-200 px-1 text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] ${
        isSelected ? 'text-emerald-950 font-extrabold' : 'text-stone-950 group-hover:text-emerald-950'
      }`}>
        {title}
      </h3>
    </motion.div>
  );
};
