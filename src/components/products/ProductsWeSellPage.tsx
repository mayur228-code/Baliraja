import { useState, useMemo, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Search, 
  X, 
  ArrowUpDown, 
  Check,
  CheckCircle2, 
  XCircle, 
  Package, 
  ArrowUpRight,
  Filter,
  Sparkles
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import type { Language, Product, NavCategory } from '../../types';
import { navigationCategories } from '../../data/navigationData';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';
import { ProductDetailModal } from './ProductDetailModal';
import { EmptyStateView } from '../common/StateViews';

interface ProductsWeSellPageProps {
  lang: Language;
  products?: Product[];
  categories?: NavCategory[];
  onBackToHome: () => void;
  onViewDetails?: (product: Product) => void;
  onContactClick: () => void;
}

type SortOption = 'featured' | 'price-desc' | 'price-asc' | 'popular';

interface SortItem {
  value: SortOption;
  labelMr: string;
  labelEn: string;
}

const SORT_OPTIONS: SortItem[] = [
  { value: 'featured', labelMr: 'वैशिष्ट्यपूर्ण (Featured)', labelEn: 'Featured' },
  { value: 'popular', labelMr: 'सर्वाधिक लोकप्रिय (Popular)', labelEn: 'Popular' },
  { value: 'price-desc', labelMr: 'किंमत: जास्त ते कमी', labelEn: 'Price: High to Low' },
  { value: 'price-asc', labelMr: 'किंमत: कमी ते जास्त', labelEn: 'Price: Low to High' }
];

/**
 * Category matching helper supporting standard IDs and slugs
 */
function isCategoryMatch(productCatId: string, targetCatId: string): boolean {
  if (!productCatId || !targetCatId) return false;
  return productCatId.trim().toLowerCase() === targetCatId.trim().toLowerCase();
}

/**
 * Category label helper for filter buttons
 */
function getCategoryLabel(cat: NavCategory, lang: Language): string {
  if (lang === 'mr') {
    return cat.nameMr || cat.name;
  }
  return cat.name || cat.nameMr;
}

/**
 * Safe numeric price extractor for sorting
 */
function extractNumericPrice(price: number | string | undefined): number {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const cleaned = String(price).replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Formats price safely: displays genuine price or honest inquiry notice
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

export const ProductsWeSellPage: FC<ProductsWeSellPageProps> = ({
  lang,
  products = [],
  categories,
  onBackToHome,
  onViewDetails,
  onContactClick
}) => {
  const shouldReduceMotion = useReducedMotion();

  const categoryList = useMemo(() => {
    return categories && categories.length > 0
      ? categories.filter((c) => c.active !== false)
      : navigationCategories;
  }, [categories]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('featured');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort menu on click outside or Escape
  useEffect(() => {
    if (!isSortOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortOpen]);

  const allAvailableProducts = useMemo(() => {
    // Always use the centralized store products passed as props.
    // Do NOT fall back to static sampleProducts — the store is the single source of truth.
    return products || [];
  }, [products]);

  // Combined Filtering & Sorting Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...allAvailableProducts];

    // 1. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => isCategoryMatch(p.categoryId, selectedCategory));
    }

    // 2. Search Filter across product names, description, suitable crops, and key points
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameEn = (p.nameEnglish || '').toLowerCase();
        const nameMr = (p.nameMarathi || '').toLowerCase();
        const descEn = (p.descriptionEnglish || '').toLowerCase();
        const descMr = (p.descriptionMarathi || '').toLowerCase();
        const cropsEn = (p.suitableCropsEnglish || []).join(' ').toLowerCase();
        const cropsMr = (p.suitableCropsMarathi || []).join(' ').toLowerCase();
        const keysEn = (p.keyPointsEnglish || []).join(' ').toLowerCase();
        const keysMr = (p.keyPointsMarathi || []).join(' ').toLowerCase();

        return (
          nameEn.includes(q) ||
          nameMr.includes(q) ||
          descEn.includes(q) ||
          descMr.includes(q) ||
          cropsEn.includes(q) ||
          cropsMr.includes(q) ||
          keysEn.includes(q) ||
          keysMr.includes(q)
        );
      });
    }

    // 3. Sorting Options
    switch (selectedSort) {
      case 'price-asc':
        result.sort((a, b) => extractNumericPrice(a.price) - extractNumericPrice(b.price));
        break;

      case 'price-desc':
        result.sort((a, b) => extractNumericPrice(b.price) - extractNumericPrice(a.price));
        break;

      case 'popular':
        result.sort((a, b) => {
          const popA = a.popularity ?? (a.isBestseller ? 90 : 50);
          const popB = b.popularity ?? (b.isBestseller ? 90 : 50);
          if (popA !== popB) return popB - popA;
          return a.displayOrder - b.displayOrder;
        });
        break;

      case 'featured':
      default:
        result.sort((a, b) => {
          const rankA = (a.featured ? 2 : 0) + (a.isBestseller ? 2 : 0);
          const rankB = (b.featured ? 2 : 0) + (b.isBestseller ? 2 : 0);
          if (rankA !== rankB) return rankB - rankA;
          return a.displayOrder - b.displayOrder;
        });
        break;
    }

    return result;
  }, [allAvailableProducts, selectedCategory, searchQuery, selectedSort]);

  // Counts per category for the filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allAvailableProducts.length };
    categoryList.forEach((cat) => {
      counts[cat.id] = allAvailableProducts.filter((p) => isCategoryMatch(p.categoryId, cat.id)).length;
    });
    return counts;
  }, [allAvailableProducts, categoryList]);

  const handleProductCardClick = (product: Product) => {
    setSelectedModalProduct(product);
    onViewDetails?.(product);
  };

  return (
    <div className="w-full space-y-8 sm:space-y-10 py-4">
      {/* ── 1. Top Navigation: Clickable Baliraja Logo to Home (No "Back to Home" or "Official Product Catalogue" text) ── */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <button
          type="button"
          onClick={onBackToHome}
          className="group inline-flex items-center p-1 -ml-1 rounded-xl hover:opacity-90 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600"
          aria-label={lang === 'mr' ? 'मुख्य पृष्ठावर परत जा' : 'Back to Home'}
          title={lang === 'mr' ? 'मुख्य पृष्ठावर परत जा' : 'Back to Home'}
        >
          <img
            src={logoImg}
            alt="Baliraja Krishi Seva Kendra"
            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 select-none"
          />
        </button>
      </div>

      {/* ── Page Heading & Animated Underline (Matching Fertilizers reference) ── */}
      <div className="group/heading text-center max-w-3xl mx-auto px-4 space-y-3 cursor-default select-none">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-2xs font-bold uppercase tracking-wider shadow-2xs mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>{lang === 'mr' ? 'बळीराजा कृषी भांडार' : 'Complete Agricultural Store'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-emerald-950 tracking-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900">
            {lang === 'mr' ? 'आमची सर्व उत्पादने' : 'Products We Sell'}
          </h1>

          {/* Animated Underline matching Fertilizers reference */}
          <AnimatedUnderline widthClass="h-0.5 sm:h-[3px] w-20 sm:w-28" />

          <p className="mt-3 text-xs sm:text-sm md:text-base text-stone-600 font-normal max-w-2xl mx-auto leading-relaxed">
            {lang === 'mr'
              ? 'प्रमाणित बियाणे, उच्च कार्यक्षम खते, पीक संरक्षण औषधे आणि विशेष शेती कॉम्बो किट्सचा संपूर्ण साठा.'
              : 'Explore our complete inventory of certified seeds, specialized crop nutrition, crop protection, and expert packages.'}
          </p>
        </motion.div>
      </div>

      {/* ── Full-Width Search Bar with End Functional Sort Icon (No "Sort:" text) ── */}
      <div className="w-full relative" ref={sortRef}>
        <div className="relative flex items-center w-full bg-white/85 backdrop-blur-md border border-white/80 hover:border-emerald-300/80 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-200">
          {/* Search Icon */}
          <div className="pl-4 sm:pl-4.5 pr-2 flex items-center pointer-events-none text-emerald-700 shrink-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </div>

          {/* Search Input spanning the full width */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'mr'
                ? 'उत्पादनाचे नाव, घटक किंवा पीक शोधा...'
                : 'Search by product name, ingredient or crop...'
            }
            className="w-full py-3 sm:py-3.5 pr-20 sm:pr-24 bg-transparent text-xs sm:text-sm md:text-base text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />

          {/* End Actions: Clear Button (if text) + Divider + Sort Icon Button */}
          <div className="absolute right-2 sm:right-3 inset-y-0 flex items-center gap-1 sm:gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
                aria-label={lang === 'mr' ? 'शोध पुसा' : 'Clear search'}
                title={lang === 'mr' ? 'शोध पुसा' : 'Clear search'}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="h-5 w-px bg-stone-200 my-auto" aria-hidden="true" />

            {/* Sort Icon Button - No visible "Sort:" text */}
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isSortOpen || selectedSort !== 'featured'
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
                  : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-100'
              }`}
              aria-label={lang === 'mr' ? 'क्रमवारी पर्याय' : 'Sort options'}
              title={lang === 'mr' ? 'क्रमवारी पर्याय' : 'Sort options'}
              aria-haspopup="listbox"
              aria-expanded={isSortOpen}
            >
              <ArrowUpDown className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
              {selectedSort !== 'featured' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Dropdown Menu for Sort Options */}
        <AnimatePresence>
          {isSortOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-stone-200 p-1.5 sm:p-2 z-30 space-y-0.5"
              role="listbox"
              aria-label="Sort options"
            >
              {SORT_OPTIONS.map((opt) => {
                const isSelected = selectedSort === opt.value;
                const label = lang === 'mr' ? opt.labelMr : opt.labelEn;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedSort(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Category Filters on the LEFT + Product Grid on the RIGHT ── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ── Left Sidebar Filter (Desktop) ── */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0 sticky top-24">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_rgba(0,0,0,0.05)] p-4 sm:p-5 space-y-4">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm font-serif">
                <Filter className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>{lang === 'mr' ? 'वर्गवारी फिल्टर्स' : 'Filter by Category'}</span>
              </div>
              {(selectedCategory !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-3xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  {lang === 'mr' ? 'पुसा' : 'Reset'}
                </button>
              )}
            </div>

            {/* Vertical Categories Navigation */}
            <nav className="space-y-1.5" aria-label="Product categories">
              {/* "All Products" Pill */}
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-800 text-white shadow-sm font-bold'
                    : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span>{lang === 'mr' ? 'सर्व उत्पादने' : 'All Products'}</span>
                <span
                  className={`text-2xs px-2 py-0.5 rounded-full font-bold ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {categoryCounts.all || 0}
                </span>
              </button>

              {/* Individual Categories from dynamic categoryList */}
              {categoryList.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const label = getCategoryLabel(cat, lang);
                const count = categoryCounts[cat.id] || 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-sm font-bold'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-2xs px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-stone-100 text-2xs text-stone-400">
              {lang === 'mr' ? 'वर्गवारी निवडून कॅटलॉग फिल्टर करा.' : 'Select a category to filter products.'}
            </div>
          </div>
        </aside>

        {/* ── Mobile/Tablet Responsive Filter Bar (Horizontally scrollable, compact) ── */}
        <div className="lg:hidden w-full space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 shrink-0 pr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>{lang === 'mr' ? 'फिल्टर:' : 'Filter:'}</span>
            </div>

            {/* Mobile "All" Pill */}
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <span>{lang === 'mr' ? 'सर्व' : 'All'}</span>
              <span
                className={`text-2xs px-1.5 py-0.2 rounded-full ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-700 text-emerald-100'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {categoryCounts.all || 0}
              </span>
            </button>

            {/* Mobile Categories Pills */}
            {categoryList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const label = getCategoryLabel(cat, lang);
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-2xs px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Product Catalogue Grid (Right Area) ── */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          {/* Results Counter & Active Filter Badge */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>
              {lang === 'mr'
                ? `${filteredAndSortedProducts.length} उत्पादने उपलब्ध`
                : `Showing ${filteredAndSortedProducts.length} ${filteredAndSortedProducts.length === 1 ? 'product' : 'products'}`}
            </span>

            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>{lang === 'mr' ? 'सर्व फिल्टर्स पुसा' : 'Clear all filters'}</span>
              </button>
            )}
          </div>

          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {filteredAndSortedProducts.map((product, idx) => {
                const primaryName = (lang === 'mr' ? product.nameMarathi : product.nameEnglish) || product.nameEnglish || product.nameMarathi;
                const secondaryName = (lang === 'mr' ? product.nameEnglish : product.nameMarathi) || '';
                const isAvailable = product.availability === 'available';
                const priceInfo = formatProductPrice(product.price, lang);

                return (
                  <motion.article
                    key={product.id}
                    initial={
                      shouldReduceMotion
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: 14, scale: 0.97 }
                    }
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, margin: '-20px' }}
                    transition={{
                      duration: 0.25,
                      delay: shouldReduceMotion ? 0 : Math.min((idx % 3) * 0.04, 0.15),
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            y: -4,
                            scale: 1.015,
                            transition: { duration: 0.18, ease: 'easeOut' }
                          }
                    }
                    onClick={() => handleProductCardClick(product)}
                      className="group relative bg-white/80 sm:bg-white/75 hover:bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/80 hover:border-emerald-300/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_16px_36px_rgba(5,150,105,0.12)] transition-all duration-200 flex flex-col overflow-hidden cursor-pointer select-none"
                      role="button"
                      tabIndex={0}
                      aria-label={`${primaryName} - ${isAvailable ? (lang === 'mr' ? 'उपलब्ध' : 'Available') : (lang === 'mr' ? 'स्टॉक संपला' : 'Out of Stock')}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleProductCardClick(product);
                        }
                      }}
                    >
                      {/* Product Image Area */}
                      <div className="relative w-full aspect-square bg-gradient-to-b from-stone-50/70 to-stone-100/40 p-4 sm:p-5 flex items-center justify-center overflow-hidden border-b border-stone-100/70">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={primaryName}
                            className="max-h-full max-w-full object-contain transition-transform duration-250 ease-out group-hover:scale-105 select-none"
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
          ) : (
            /* Unified Empty Search / Filter State */
            <EmptyStateView
              type="search"
              lang={lang}
              searchQuery={searchQuery}
              description={
                lang === 'mr'
                  ? 'कृपया शोध शब्द तपासा किंवा वर्गवारी फिल्टर बदलून पुन्हा प्रयत्न करा.'
                  : 'Try adjusting your search terms or clearing the active category filters.'
              }
              actionLabel={lang === 'mr' ? 'फिल्टर्स पूर्ववत करा' : 'Reset Filters'}
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            />
          )}
        </div>
      </div>

      {/* ── Need Guidance Bottom Banner ── */}
      <div className="mt-12 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-800/40">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-bold font-serif text-white">
            {lang === 'mr'
              ? 'योग्य उत्पादन निवडण्यासाठी कृषी तज्ज्ञांचा सल्ला हवा आहे?'
              : 'Need agronomist guidance to choose the right products?'}
          </h3>
          <p className="text-xs text-stone-300">
            {lang === 'mr'
              ? 'आमच्या केंद्राशी थेट संपर्क साधा किंवा प्रत्यक्ष भेट द्या.'
              : 'Contact Baliraja Krishi Seva Kendra directly for custom crop recommendations.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onContactClick}
          className="flow-btn px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md hover:shadow-lg cursor-pointer shrink-0"
        >
          <span>{lang === 'mr' ? 'संपर्क साधा' : 'Contact Agronomist'}</span>
        </button>
      </div>

      {/* ── Product Detail Modal: Shows full description, key points, suitable crops & inquiry actions ── */}
      <ProductDetailModal
        product={selectedModalProduct}
        category={categoryList.find((c) => isCategoryMatch(selectedModalProduct?.categoryId || '', c.id) || (c.slug && isCategoryMatch(selectedModalProduct?.categoryId || '', c.slug)))}
        lang={lang}
        onClose={() => setSelectedModalProduct(null)}
        onContactClick={onContactClick}
      />
    </div>
  );
};

export default ProductsWeSellPage;
