import { useMemo } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2, XCircle, Package, ArrowUpRight, Award } from 'lucide-react';
import type { Language, Product } from '../../types';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';

interface BestsellerProductsSectionProps {
  lang: Language;
  products?: Product[];
  onViewDetails: (product: Product) => void;
  onViewAllProducts: () => void;
}

/**
 * Formats price safely: displays authentic numerical prices or genuine inquiry prompt.
 */
function formatProductPrice(
  price: number | string | undefined,
  lang: Language
): { text: string; isReal: boolean } {
  if (price !== undefined && price !== null && price !== '') {
    if (typeof price === 'number') {
      return { text: `₹${price.toLocaleString('en-IN')}`, isReal: true };
    }
    const str = String(price).trim();
    if (str.startsWith('₹')) {
      return { text: str, isReal: true };
    }
    const num = Number(str);
    if (!isNaN(num) && num > 0) {
      return { text: `₹${num.toLocaleString('en-IN')}`, isReal: true };
    }
    return { text: str, isReal: true };
  }

  return {
    text: lang === 'mr' ? 'दर चौकशी करा' : 'Price on Request',
    isReal: false
  };
}

export const BestsellerProductsSection: FC<BestsellerProductsSectionProps> = ({
  lang,
  products = [],
  onViewDetails,
  onViewAllProducts
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Data-driven extraction of admin-designated featured products
  const bestsellerList = useMemo(() => {
    return (products || []).filter((p) => Boolean(p.featured));
  }, [products]);

  const sectionTitle = lang === 'mr' ? 'बेस्टसेलर उत्पादने' : 'Bestseller Products';
  const sectionSubtitle = lang === 'mr' 
    ? 'शेतकऱ्यांनी सर्वाधिक पसंत केलेली आणि शेतात सिद्ध झालेली उत्पादने' 
    : 'Our most trusted and highly demanded farming solutions';
  const viewAllButtonText = lang === 'mr' ? 'सर्व उत्पादने पहा' : 'View All Products';

  if (bestsellerList.length === 0) return null;

  return (
    <section 
      id="bestsellers-section"
      aria-labelledby="bestseller-heading"
      className="w-full space-y-8 sm:space-y-10 pt-6 pb-8 text-left scroll-mt-24"
    >
      {/* ── 1. Centered Section Heading & Animated Underline (No bullet/dot) ── */}
      <div className="group/heading text-center max-w-2xl mx-auto px-4 cursor-default select-none">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-2xs font-bold uppercase tracking-wider mb-2.5 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>{lang === 'mr' ? 'शेतकऱ्यांची पहिली पसंती' : "Farmers' Choice"}</span>
          </div>

          <h2 
            id="bestseller-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-emerald-950 tracking-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900"
          >
            {sectionTitle}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        {/* Animated Underline: Centered, Agricultural Gradient, Reveals smoothly on viewport enter, Expands on hover */}
        <AnimatedUnderline />
      </div>

      {/* ── 2. Bestseller Product Cards Grid ── */}
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {bestsellerList.map((product, idx) => {
            const primaryName = lang === 'mr' ? product.nameMarathi : product.nameEnglish;
            const secondaryName = lang === 'mr' ? product.nameEnglish : product.nameMarathi;
            const isAvailable = product.availability === 'available';
            const priceInfo = formatProductPrice(product.price, lang);

            return (
              <motion.article
                key={product.id}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 12, scale: 0.98 }
                }
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: '-20px' }}
                transition={{
                  duration: 0.18,
                  delay: shouldReduceMotion ? 0 : (idx % 4) * 0.03,
                  ease: 'easeOut'
                }}
                onClick={() => onViewDetails(product)}
                className="group relative bg-white/90 sm:bg-white/85 hover:bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 hover:border-emerald-400/90 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-[transform,border-color,opacity] duration-150 ease-out will-change-transform flex flex-col overflow-hidden cursor-pointer select-none"
                role="button"
                tabIndex={0}
                aria-label={`${primaryName} - ${isAvailable ? (lang === 'mr' ? 'उपलब्ध' : 'Available') : (lang === 'mr' ? 'स्टॉक संपला' : 'Out of Stock')}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetails(product);
                  }
                }}
              >
                {/* Product Image Area: Preserves original aspect ratio & quality */}
                <div className="relative w-full aspect-square bg-gradient-to-b from-stone-50/70 to-stone-100/40 p-4 sm:p-5 flex items-center justify-center overflow-hidden border-b border-stone-100/70">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={primaryName}
                      className="max-h-full max-w-full object-contain transition-transform duration-150 ease-out group-hover:scale-103 select-none"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.img-fallback');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}

                  {/* Fallback Icon */}
                  <div
                    className="img-fallback hidden w-14 h-14 rounded-2xl bg-stone-200/80 text-stone-400 items-center justify-center"
                    style={{ display: product.image ? 'none' : 'flex' }}
                  >
                    <Package className="w-7 h-7 text-stone-400" aria-hidden="true" />
                  </div>

                  {/* Featured Badge */}
                  {product.featured && (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <span className="inline-flex items-center gap-1 bg-amber-500/95 text-white backdrop-blur-md text-3xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs border border-amber-300/60">
                        ★ {lang === 'mr' ? 'वैशिष्ट्यीकृत' : 'Featured'}
                      </span>
                    </div>
                  )}

                  {/* Quick Inspection Cue */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <span className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-xs text-stone-700 flex items-center justify-center border border-stone-200/80">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
                    </span>
                  </div>
                </div>

                {/* Product Information Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Primary & Secondary Product Name */}
                    <h3 className="text-sm sm:text-base font-bold font-serif text-stone-900 leading-snug line-clamp-2 group-hover:text-emerald-950 transition-colors">
                      {primaryName}
                    </h3>
                    <p className="text-2xs text-stone-400 font-medium truncate">
                      {secondaryName}
                    </p>
                  </div>

                  {/* Price & Availability Row */}
                  <div className="pt-2 border-t border-stone-100/80 flex items-center justify-between gap-2">
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

                    {/* Availability Status Badge */}
                    <div className="shrink-0">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 shadow-2xs backdrop-blur-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                          <span>{lang === 'mr' ? 'उपलब्ध' : 'Available'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-50/90 text-amber-800 border border-amber-200/80 shadow-2xs backdrop-blur-xs">
                          <XCircle className="w-3 h-3 text-amber-600" aria-hidden="true" />
                          <span>{lang === 'mr' ? 'स्टॉक संपला' : 'Out of Stock'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* ── 3. Centered "View All Products" Button (Navigates to Products We Sell Page) ── */}
      <div className="pt-4 sm:pt-6 flex justify-center">
        <button
          type="button"
          onClick={onViewAllProducts}
          className="flow-btn group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-serif font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:shadow-emerald-900/15 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label={viewAllButtonText}
        >
          <span>{viewAllButtonText}</span>
          <ArrowRight
            className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
};

export default BestsellerProductsSection;
