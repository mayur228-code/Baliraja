import { useMemo } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2, XCircle, Package, ArrowUpRight } from 'lucide-react';
import type { Language, Product, NavCategory } from '../../types';
import { navigationCategories } from '../../data/navigationData';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';

interface CategoryProductPreviewProps {
  selectedCategoryId: string;
  lang: Language;
  products: Product[];
  categories?: NavCategory[];
  onNavigateToCategory: (categoryId: string) => void;
  onViewDetails: (product: Product) => void;
}

/**
 * Dynamic category headline displayed above the 4 products:
 * Fully data-driven from the active category's localized name.
 */
function getCategoryHeadline(cat: NavCategory | undefined, lang: Language): string {
  if (!cat) return lang === 'mr' ? 'उत्पादने' : 'Products';
  return lang === 'mr' ? (cat.nameMr || cat.name) : (cat.name || cat.nameMr);
}

/**
 * Returns dynamic category-specific "View All" button text:
 * English: "View All {CategoryName}"
 * Marathi: "सर्व {CategoryNameMr} पहा"
 */
function getViewAllButtonText(cat: NavCategory | undefined, lang: Language): string {
  if (!cat) return lang === 'mr' ? 'सर्व उत्पादने पहा' : 'View All Products';
  const categoryName = lang === 'mr' ? (cat.nameMr || cat.name) : (cat.name || cat.nameMr);
  return lang === 'mr' ? `सर्व ${categoryName} पहा` : `View All ${categoryName}`;
}

/**
 * Category matching helper supporting standard IDs and slugs
 */
function isCategoryMatch(productCatId: string, targetCatId: string): boolean {
  if (!productCatId || !targetCatId) return false;
  return productCatId.trim().toLowerCase() === targetCatId.trim().toLowerCase();
}

/**
 * Data-driven product filter:
 * 1. Filters products strictly belonging to the selected category
 * 2. Sorts by most recently added (createdAt date, numeric ID timestamp, or array index)
 * 3. Shows up to the 4 most recent products for the Home page preview
 */
function getCategoryRecentProducts(
  allProducts: Product[],
  categoryId: string,
  limit = 4,
  categoryObj?: NavCategory
): Product[] {
  const filtered = (allProducts || []).filter((p) => {
    if (isCategoryMatch(p.categoryId, categoryId)) return true;
    if (categoryObj?.id && isCategoryMatch(p.categoryId, categoryObj.id)) return true;
    if (categoryObj?.slug && isCategoryMatch(p.categoryId, categoryObj.slug)) return true;
    return false;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (a.createdAt && !b.createdAt) return -1;
    if (!a.createdAt && b.createdAt) return 1;

    const aMatch = a.id.match(/\d{8,}/);
    const bMatch = b.id.match(/\d{8,}/);
    if (aMatch && bMatch) {
      const aNum = Number(aMatch[0]);
      const bNum = Number(bMatch[0]);
      if (aNum !== bNum) {
        return bNum - aNum;
      }
    }

    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      return a.displayOrder - b.displayOrder;
    }

    const aIdx = (allProducts || []).indexOf(a);
    const bIdx = (allProducts || []).indexOf(b);
    return aIdx - bIdx;
  });

  return sorted.slice(0, limit);
}

/**
 * Safe price formatter: genuine price display or authentic inquiry notice
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

export const CategoryProductPreview: FC<CategoryProductPreviewProps> = ({
  selectedCategoryId,
  lang,
  products,
  categories = navigationCategories,
  onNavigateToCategory,
  onViewDetails
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Active category configuration
  const activeCategory = useMemo(() => {
    return (
      categories.find((c) => isCategoryMatch(c.id, selectedCategoryId) || (c.slug && isCategoryMatch(c.slug, selectedCategoryId))) ||
      categories[0]
    );
  }, [categories, selectedCategoryId]);

  const effectiveCategoryId = activeCategory?.id || selectedCategoryId;

  // 4 most recent products strictly for this category
  const recentProducts = useMemo(() => {
    return getCategoryRecentProducts(products, effectiveCategoryId, 4, activeCategory);
  }, [products, effectiveCategoryId, activeCategory]);

  const categoryHeadline = getCategoryHeadline(activeCategory, lang);
  const viewAllText = getViewAllButtonText(activeCategory, lang);

  return (
    <div className="w-full space-y-8 sm:space-y-10 pt-4 pb-8">
      {/* ── 1. Category Headline & 2. Animated Underline (Centered, Clean Text, No Bullet) ── */}
      <div className="group/heading text-center max-w-xl mx-auto px-4 cursor-default select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`headline-${effectiveCategoryId}`}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            exit={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-emerald-950 tracking-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900">
              {categoryHeadline}
            </h3>
          </motion.div>
        </AnimatePresence>

        {/* Animated Underline: Centered, Agricultural Palette, Replays on Category Change & Scroll, Expands on Hover */}
        <AnimatedUnderline layoutKey={`underline-${effectiveCategoryId}`} />
      </div>

      {/* ── 3. 4 Product Cards Grid (Framer Motion Stagger, Transition & Hover) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`grid-${effectiveCategoryId}`}
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full"
        >
          {recentProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {recentProducts.map((product, idx) => {
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
                      delay: shouldReduceMotion ? 0 : idx * 0.03,
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
                    {/* Product Image Area: Preserves original aspect ratio and appearance */}
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

                      {/* Featured Badge if Active */}
                      {product.featured && (
                        <div className="absolute top-3 left-3 z-10 pointer-events-none">
                          <span className="inline-flex items-center gap-1 bg-amber-500/95 text-white backdrop-blur-md text-3xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs border border-amber-300/60">
                            ★ {lang === 'mr' ? 'वैशिष्ट्यीकृत' : 'Featured'}
                          </span>
                        </div>
                      )}

                      {/* Quick inspection cue on hover */}
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
                        <h4 className="text-sm sm:text-base font-bold font-serif text-stone-900 leading-snug line-clamp-2 group-hover:text-emerald-950 transition-colors">
                          {primaryName}
                        </h4>
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
          ) : (
            /* Clean Empty State */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 text-center space-y-3 max-w-lg mx-auto shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                <Package className="w-7 h-7" aria-hidden="true" />
              </div>
              <h4 className="text-base font-bold text-stone-900 font-serif">
                {lang === 'mr'
                  ? `${categoryHeadline} वर्गवारीत उत्पादने लवकरच जोडली जातील`
                  : `Products in ${categoryHeadline} arriving soon`}
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
                {lang === 'mr'
                  ? 'या वर्गवारीतील अधिकृत साठा आणि शिफारशींसाठी बळीराजा केंद्राशी थेट संपर्क साधा.'
                  : 'Official inventory entries for this category will be available soon. Inquire directly at our center.'}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── 4. View All [Category] Button with Flow Button Animation ── */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={() => onNavigateToCategory(effectiveCategoryId)}
          className="flow-btn group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-serif font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:shadow-emerald-900/15 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label={viewAllText}
        >
          <span>{viewAllText}</span>
          <ArrowRight
            className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
};

export default CategoryProductPreview;
