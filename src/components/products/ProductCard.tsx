import { useState } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Package } from 'lucide-react';
import type { Language, Product } from '../../types';

interface ProductCardProps {
  product: Product;
  lang: Language;
  onViewDetails: (product: Product) => void;
  index: number;
}

export const ProductCard: FC<ProductCardProps> = ({
  product,
  lang,
  onViewDetails,
  index
}) => {
  const [imgError, setImgError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const primaryName = lang === 'mr' ? product.nameMarathi : product.nameEnglish;
  const secondaryName = lang === 'mr' ? product.nameEnglish : product.nameMarathi;

  const isAvailable = product.availability === 'available';

  // Independent Price Formatter
  const formatCardPrice = (priceVal: number | string | undefined): { text: string; isReal: boolean } => {
    if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
      if (typeof priceVal === 'number') {
        return { text: `₹${priceVal.toLocaleString('en-IN')}`, isReal: true };
      }
      const str = String(priceVal).trim();
      if (str.startsWith('₹')) return { text: str, isReal: true };
      const num = Number(str.replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 0) return { text: `₹${num.toLocaleString('en-IN')}`, isReal: true };
      return { text: str, isReal: true };
    }
    return { text: lang === 'mr' ? 'दर चौकशीवर' : 'Price on Request', isReal: false };
  };

  const priceInfo = formatCardPrice(product.price);

  const animProps = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: '-20px' },
        transition: { duration: 0.18, delay: (index % 4) * 0.03, ease: 'easeOut' as const }
      };

  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.article
      {...animProps}
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails(product);
        }
      }}
      aria-label={`${primaryName} - ${priceInfo.text} - ${isAvailable ? (lang === 'mr' ? 'उपलब्ध' : 'Available') : (lang === 'mr' ? 'स्टॉक संपला' : 'Out of Stock')}`}
      className="group relative bg-white/90 sm:bg-white/85 hover:bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 hover:border-emerald-400/90 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-[transform,border-color,opacity] duration-150 ease-out will-change-transform flex flex-col overflow-hidden text-left cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
    >
      {/* Featured Badge if Active */}
      {product.featured && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-amber-500/95 text-white backdrop-blur-md text-3xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs border border-amber-300/60">
            ★ {lang === 'mr' ? 'वैशिष्ट्यीकृत' : 'Featured'}
          </span>
        </div>
      )}

      {/* Product Image Area */}
      <div className="relative w-full aspect-square bg-gradient-to-b from-stone-50/70 to-stone-100/40 p-4 sm:p-5 flex items-center justify-center overflow-hidden border-b border-stone-100/70">
        {/* Subtle placeholder shimmer while loading */}
        {product.image && !imgLoaded && !imgError && (
          <div className="absolute inset-0 skeleton-shimmer z-0" aria-hidden="true" />
        )}

        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={primaryName}
            className={`max-h-full max-w-full object-contain transition-transform duration-150 ease-out group-hover:scale-103 select-none ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-stone-200/80 text-stone-400 flex items-center justify-center">
            <Package className="w-7 h-7" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Product Body: ONLY Name, Price, and Status */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        {/* Product Name */}
        <div className="space-y-1 min-h-[3rem]">
          <h3 className="text-sm sm:text-base font-bold font-serif text-stone-900 leading-snug line-clamp-2 group-hover:text-emerald-950 transition-colors">
            {primaryName}
          </h3>
          {secondaryName && secondaryName !== primaryName && (
            <p className="text-2xs text-stone-500 font-medium line-clamp-1" title={secondaryName}>
              {secondaryName}
            </p>
          )}
        </div>

        {/* Price & Status Row */}
        <div className="pt-2 border-t border-stone-100/80 flex items-center justify-between gap-2 mt-auto">
          {/* Price */}
          <div className="min-w-0">
            <span className="sr-only">{lang === 'mr' ? 'किंमत:' : 'Price:'}</span>
            <span
              className={
                priceInfo.isReal
                  ? 'text-base sm:text-lg font-extrabold text-emerald-950 font-serif tracking-tight'
                  : 'text-xs sm:text-sm font-semibold text-stone-600 italic'
              }
            >
              {priceInfo.text}
            </span>
          </div>

          {/* Status Indicator */}
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold ${
                isAvailable
                  ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 backdrop-blur-xs'
                  : 'bg-stone-100 text-stone-600 border border-stone-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isAvailable ? 'bg-emerald-600' : 'bg-stone-400'
                }`}
                aria-hidden="true"
              />
              <span>{isAvailable ? (lang === 'mr' ? 'उपलब्ध' : 'Available') : (lang === 'mr' ? 'स्टॉक संपला' : 'Out of Stock')}</span>
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
