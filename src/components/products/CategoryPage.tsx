import { useState, useMemo, useEffect, createElement } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  X, 
  Filter, 
  ArrowUpDown, 
  PhoneCall
} from 'lucide-react';
import type { Language, Product, ProductSortOption, NavCategory } from '../../types';
import { navigationCategories } from '../../data/navigationData';
import { getCategoryIconComponent } from '../../lib/categoryIcons';
import { translations } from '../../data/translations';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';
import { CategoryNotFoundView, EmptyStateView } from '../common/StateViews';

interface CategoryPageProps {
  categoryId: string;
  lang: Language;
  products: Product[];
  categories?: NavCategory[];
  onBackToHome: () => void;
  onContactClick: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

// Category icon component
const CategoryHeaderIcon: FC<{ category?: NavCategory; id: string; className?: string }> = ({ category, id, className }) => {
  return createElement(getCategoryIconComponent(category?.icon || category?.id || id), {
    className,
    'aria-hidden': true
  });
};

/**
 * Normalizes category IDs to match categories dynamically
 */
function isCatMatch(catA?: string, catB?: string): boolean {
  if (!catA || !catB) return false;
  return catA.trim().toLowerCase() === catB.trim().toLowerCase();
}

export const CategoryPage: FC<CategoryPageProps> = ({
  categoryId,
  lang,
  products,
  categories,
  onBackToHome,
  onContactClick,
  onSelectCategory
}) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  const categoryList = categories && categories.length > 0 ? categories : navigationCategories;

  // Resolve category data dynamically from centralized store
  const category = useMemo(() => {
    return categoryList.find((c) => isCatMatch(c.id, categoryId) || c.id === categoryId || c.slug === categoryId);
  }, [categoryList, categoryId]);

  const [prevCategoryId, setPrevCategoryId] = useState(categoryId);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductSortOption | 'newest'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Scroll to top on category change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryId]);

  // Filter products belonging ONLY to this category dynamically
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    return products.filter((p) => 
      isCatMatch(p.categoryId, category.id) || (category.slug && isCatMatch(p.categoryId, category.slug))
    );
  }, [products, category]);

  // Filter & sort products for display
  const displayedProducts = useMemo(() => {
    if (!category) return [];
    const filtered = categoryProducts.filter((p) => {
      // Subcategory filter
      if (selectedSubcategory && p.subcategoryId !== selectedSubcategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesEn = p.nameEnglish.toLowerCase().includes(q);
        const matchesMr = p.nameMarathi.includes(q);
        const descEn = p.descriptionEnglish.toLowerCase().includes(q);
        const descMr = p.descriptionMarathi.includes(q);
        const subcat = p.subcategoryId?.toLowerCase().includes(q);
        const cropEn = p.suitableCropsEnglish?.some((c) => c.toLowerCase().includes(q));
        const cropMr = p.suitableCropsMarathi?.some((c) => c.toLowerCase().includes(q));
        return matchesEn || matchesMr || descEn || descMr || subcat || cropEn || cropMr;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name-asc') {
        const nameA = lang === 'mr' ? a.nameMarathi : a.nameEnglish;
        const nameB = lang === 'mr' ? b.nameMarathi : b.nameEnglish;
        return nameA.localeCompare(nameB, lang === 'mr' ? 'mr' : 'en');
      }
      if (sortBy === 'name-desc') {
        const nameA = lang === 'mr' ? a.nameMarathi : a.nameEnglish;
        const nameB = lang === 'mr' ? b.nameMarathi : b.nameEnglish;
        return nameB.localeCompare(nameA, lang === 'mr' ? 'mr' : 'en');
      }
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.displayOrder - b.displayOrder;
      }
      // 'newest' default: newest first
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const aMatch = a.id.match(/\d{8,}/);
      const bMatch = b.id.match(/\d{8,}/);
      if (aMatch && bMatch) {
        return Number(bMatch[0]) - Number(aMatch[0]);
      }
      const aIdx = categoryProducts.indexOf(a);
      const bIdx = categoryProducts.indexOf(b);
      return bIdx - aIdx;
    });
  }, [category, categoryProducts, selectedSubcategory, searchQuery, sortBy, lang]);

  // Reset filters if categoryId changes during render
  if (categoryId !== prevCategoryId) {
    setPrevCategoryId(categoryId);
    setSelectedSubcategory(undefined);
    setSearchQuery('');
  }

  // If category does not exist, render CategoryNotFoundView
  if (!category) {
    return (
      <CategoryNotFoundView
        lang={lang}
        requestedCategoryId={categoryId}
        categories={categoryList}
        onBackToHome={onBackToHome}
        onSelectCategory={onSelectCategory || ((catId) => {
          window.history.pushState({}, '', `/category/${catId}`);
          window.location.reload();
        })}
      />
    );
  }

  const categoryTitle = lang === 'mr' ? category.nameMr : category.name;
  const categoryDesc = lang === 'mr' ? category.shortDescMr : category.shortDesc;

  return (
    <div className="space-y-8 sm:space-y-10 py-4 text-left">
      {/* ── Top Breadcrumbs & Back Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer group"
          aria-label={t.backToHome}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          <span>{t.backToHome}</span>
        </button>

        {/* Breadcrumb Path */}
        <nav aria-label="Breadcrumb" className="text-2xs sm:text-xs font-semibold text-stone-400 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBackToHome}
            className="hover:text-stone-700 transition-colors cursor-pointer"
          >
            {lang === 'mr' ? 'मुख्यपृष्ठ' : 'Home'}
          </button>
          <span>/</span>
          <span className="text-stone-500">{lang === 'mr' ? 'वर्गवारी' : 'Categories'}</span>
          <span>/</span>
          <span className="text-emerald-800 font-bold">{categoryTitle}</span>
        </nav>
      </div>

      {/* ── Category Header (Clean, Static, Minimal & Premium - No Background Animation) ── */}
      <div className="group/heading text-center max-w-3xl mx-auto px-4 space-y-3 cursor-default select-none">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-20px' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full flex flex-col items-center"
        >
          {/* Category Icon Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-3.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider shadow-2xs mb-2.5">
            <CategoryHeaderIcon category={category} id={category.id} className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'mr' ? 'कृषी वर्गवारी' : 'Product Category'}</span>
          </div>

          {/* Clean Static Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight leading-tight text-emerald-950 transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900">
            {categoryTitle}
          </h1>

          {/* Standardized Animated Underline Centered */}
          <AnimatedUnderline
            align="center"
            widthClass="h-0.5 sm:h-[3px] w-20 sm:w-28"
          />

          {/* Centered Short Description */}
          {categoryDesc && (
            <p className="mt-3 text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed max-w-xl font-normal">
              {categoryDesc}
            </p>
          )}

          {/* Live Product Count Pill */}
          <div className="pt-2">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-3xs font-bold bg-stone-100 border border-stone-200 text-stone-600 shadow-2xs">
              {lang === 'mr'
                ? `एकूण ${categoryProducts.length} उत्पादने`
                : `${categoryProducts.length} ${categoryProducts.length === 1 ? 'Product' : 'Products'}`}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Category Search & Subcategory Controls Bar ── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_rgba(0,0,0,0.04)] space-y-5">
        {/* Search and Sort Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Scoped Search Input */}
          <div className="relative w-full sm:w-80 lg:w-96">
            <label htmlFor="category-search-input" className="sr-only">
              {t.searchLabel}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="category-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'mr'
                    ? `${categoryTitle} मध्ये शोधा...`
                    : `Search within ${category.name}...`
                }
                className="w-full pl-9.5 pr-8 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                  aria-label={t.clearSearch}
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <select
                id="category-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ProductSortOption | 'newest')}
                className="bg-transparent border-none text-xs font-semibold text-stone-800 focus:outline-hidden cursor-pointer pr-1"
              >
                <option value="newest">{lang === 'mr' ? 'नवीनतम (Newest First)' : 'Newest First'}</option>
                <option value="featured">{t.sortFeatured}</option>
                <option value="name-asc">{t.sortNameAsc}</option>
                <option value="name-desc">{t.sortNameDesc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subcategory Pills (if available) */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <span>{t.subcategoryLabel}</span>
            </span>

            {/* All Subcategories Tab */}
            <button
              type="button"
              onClick={() => setSelectedSubcategory(undefined)}
              className={`px-3.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                !selectedSubcategory
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {t.allSubcategoriesTab}
            </button>

            {/* Individual Subcategory Pills */}
            {category.subcategories.map((sub) => {
              const isSubActive = selectedSubcategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {lang === 'mr' ? sub.nameMr : sub.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Active Results Summary */}
        <div className="flex items-center justify-between pt-2 text-2xs text-stone-500 font-medium">
          <span>
            {lang === 'mr'
              ? `${categoryProducts.length} पैकी ${displayedProducts.length} उत्पादने दाखवत आहे`
              : `Showing ${displayedProducts.length} of ${categoryProducts.length} products`}
          </span>

          {(selectedSubcategory || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubcategory(undefined);
                setSearchQuery('');
              }}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              {t.clearAllFilters}
            </button>
          )}
        </div>
      </div>

      {/* ── Product Listing using EXACT Home-Page Product Card System ── */}
      {displayedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              lang={lang}
              index={idx}
              onViewDetails={(prod) => setSelectedProduct(prod)}
            />
          ))}
        </div>
      ) : (
        /* Unified Empty State */
        <EmptyStateView
          type="products"
          lang={lang}
          title={
            searchQuery
              ? (lang === 'mr' ? `"${searchQuery}" साठी उत्पादन आढळले नाही` : `No products match "${searchQuery}"`)
              : (lang === 'mr' ? `${categoryTitle} वर्गवारीत उत्पादने लवकरच जोडली जातील` : `Products in ${categoryTitle} arriving soon`)
          }
          description={
            searchQuery
              ? (lang === 'mr' ? 'कृपया वेगळा शोध शब्द वापरा किंवा फिल्टर्स रीसेट करा.' : 'Try adjusting your search terms or clearing subcategory filters.')
              : (lang === 'mr' ? 'या वर्गवारीतील अधिकृत कृषी निविष्ठा आणि मार्गदर्शनासाठी केंद्राशी संपर्क साधा.' : 'Official stock for this category will appear here soon. Consult our team for recommendations.')
          }
          actionLabel={selectedSubcategory || searchQuery ? t.clearAllFilters : undefined}
          onAction={selectedSubcategory || searchQuery ? () => {
            setSelectedSubcategory(undefined);
            setSearchQuery('');
          } : undefined}
          secondaryActionLabel={t.backToHome}
          onSecondaryAction={onBackToHome}
        />
      )}

      {/* ── Bottom Agronomic Advisory Assistance Card ── */}
      <div className="rounded-3xl bg-stone-100/90 border border-stone-200/90 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-bold font-serif text-stone-900">
            {lang === 'mr' ? 'आपल्या पिकासाठी योग्य खत व औषधांचा सल्ला हवा आहे?' : 'Need personalized input recommendations for your crop?'}
          </h4>
          <p className="text-xs text-stone-600 leading-relaxed">
            {lang === 'mr'
              ? 'बळीराजा कृषी सेवा केंद्रास प्रत्यक्ष भेट द्या किंवा फोन व WhatsApp वर संपर्क साधा.'
              : 'Visit Baliraja Krishi Seva Kendra in Kaij or consult our agronomists via phone & WhatsApp.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onContactClick}
            className="flow-btn inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-xs cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{lang === 'mr' ? 'केंद्राशी संपर्क साधा' : 'Contact Center'}</span>
          </button>
          <button
            type="button"
            onClick={onBackToHome}
            className="flow-btn flow-btn-light inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-xs font-bold px-5 py-3 rounded-xl cursor-pointer"
          >
            <span>{t.backToHome}</span>
          </button>
        </div>
      </div>

      {/* ── Normal Product Detail Modal (Shows ONLY Name, Price, Status) ── */}
      <ProductDetailModal
        product={selectedProduct}
        category={category}
        lang={lang}
        onClose={() => setSelectedProduct(null)}
        onContactClick={onContactClick}
      />
    </div>
  );
};

export default CategoryPage;
