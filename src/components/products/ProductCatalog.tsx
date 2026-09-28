import { useState, useMemo, useRef } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Language, Product, NavCategory } from '../../types';
import { navigationCategories } from '../../data/navigationData';
import { translations } from '../../data/translations';
import { CategoryImagesBadge } from '../ui/images-badge';
import { ProductDetailModal } from './ProductDetailModal';
import { CategoryProductPreview } from './CategoryProductPreview';
import { BestsellerProductsSection } from './BestsellerProductsSection';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';
import { useVideoVisibility } from '../../lib/useVisibilityObserver';

interface ProductCatalogProps {
  lang: Language;
  selectedCategory?: string;
  selectedSubcategory?: string;
  selectedProductId?: string;
  onClearSelectedProduct?: () => void;
  onSelectCategory: (categoryId?: string, subcategoryId?: string) => void;
  onNavigateToCategory?: (categoryId: string) => void;
  onNavigateToProductsWeSell?: () => void;
  onContactClick: () => void;
  products?: Product[];
  categories?: NavCategory[];
}

export const ProductCatalog: FC<ProductCatalogProps> = ({
  lang,
  selectedCategory,
  selectedProductId,
  onClearSelectedProduct,
  onSelectCategory,
  onNavigateToCategory,
  onNavigateToProductsWeSell,
  onContactClick,
  products = [],
  categories = navigationCategories
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const categoryVideoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  // Auto-pause video when scrolled out of viewport
  useVideoVisibility(categoryVideoRef);

  // Default to the first category if none is selected
  const defaultCategoryId = categories[0]?.id || 'fertilizers';
  const effectiveCategory = (selectedCategory && categories.some((c) => c.id === selectedCategory || (c.slug && c.slug === selectedCategory)))
    ? selectedCategory
    : defaultCategoryId;

  // Helper to synchronize category URL parameters cleanly
  const syncUrlParams = (cat?: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    
    if (cat) params.set('category', cat);
    else params.delete('category');

    params.delete('subcategory');
    params.delete('q');
    params.delete('sort');

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  // Derive selected product from selectedProductId prop OR internal selectedProduct
  const productFromProp = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId || p.slug === selectedProductId) || null;
  }, [selectedProductId, products]);

  const activeModalProduct = productFromProp || selectedProduct;

  // Handle Category Card Click: update active category dynamically without scrolling away
  const handleCategoryCardClick = (categoryId: string) => {
    onSelectCategory(categoryId, undefined);
    syncUrlParams(categoryId);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelectCategory(defaultCategoryId, undefined);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 py-4">
      {/* 1. Explore Our Category Discovery Section (PRESERVED: Exact layout, video, and design) */}
      <section 
        aria-label={t.productsHeading}
        aria-labelledby="categories-heading"
        className="space-y-6 sm:space-y-8"
      >
        {/* A. Clean Page-Surface Heading (OUTSIDE and ABOVE the video) */}
        <div className="group/heading text-center max-w-3xl mx-auto px-4 cursor-default select-none">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h2 
              id="categories-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif tracking-tight leading-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5"
            >
              {lang === 'mr' ? (
                <>
                  <span className="text-emerald-950 transition-colors group-hover/heading:text-emerald-900">आमच्या श्रेणींचा</span>{' '}
                  <span className="text-emerald-700 transition-colors group-hover/heading:text-emerald-800">शोध घ्या</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-950 transition-colors group-hover/heading:text-emerald-900">Explore Our</span>{' '}
                  <span className="text-emerald-700 transition-colors group-hover/heading:text-emerald-800">Category</span>
                </>
              )}
            </h2>
          </motion.div>

          {/* Animated Elegant Underline matching Fertilizers reference */}
          <AnimatedUnderline />

          {/* Supporting Premium Tagline */}
          <p className="mt-3 sm:mt-3.5 text-xs sm:text-sm md:text-base text-stone-600 font-normal max-w-xl mx-auto leading-relaxed">
            {lang === 'mr'
              ? 'प्रत्येक शेती टप्प्यासाठी योग्य आणि खात्रीशीर उपाय.'
              : 'Discover the right solutions for every stage of farming.'}
          </p>
        </div>

        {/* B. Product-Display Video Area (Full Viewport Width from Screen Left Edge to Right Edge) */}
        <div 
          style={{
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
          }}
          className="overflow-hidden border-y border-stone-200/90 shadow-2xl bg-stone-100 min-h-[380px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] flex items-center justify-center py-6 sm:py-8 lg:py-10"
        >
          {/* Lighter, Natural Background Video Layer */}
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none" aria-hidden="true">
            <video
              ref={categoryVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center"
            >
              <source src="/assets/videos/product_display.mp4" type="video/mp4" />
            </video>
            
            {/* Lighter, natural agricultural tint matching website palette (soft emerald/neutral) */}
            <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-emerald-950/15 pointer-events-none" />
          </div>

          {/* Interactive Category Stack Foreground (ImagesBadge Expanding Stack Interaction Model) */}
          <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-2">
            <CategoryImagesBadge
              categories={categories}
              lang={lang}
              selectedCategory={effectiveCategory}
              onSelectCategory={handleCategoryCardClick}
            />
          </div>

          {/* Brand Logo Overlay on Animated Video (Circular Glass Logo, Clickable to Home, Top-Right) */}
          <a
            href="/"
            onClick={handleHomeClick}
            role="link"
            aria-label={t.backToHome}
            title={t.brandHomeAria}
            className="group/videologo absolute top-3.5 right-3.5 sm:top-4 sm:right-6 md:right-8 z-20 cursor-pointer select-none rounded-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {/* Circular Glass / Frosted Halo */}
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-200 ease-out group-hover/videologo:scale-105 group-hover/videologo:bg-white/90 group-hover/videologo:border-white group-hover/videologo:shadow-[0_6px_22px_rgba(0,0,0,0.18),0_0_14px_rgba(16,185,129,0.3)] overflow-hidden">
              <img
                src="/assets/logo.png"
                alt="Baliraja Krishi Seva Kendra"
                className="w-full h-full object-contain rounded-full transition-transform duration-200 group-hover/videologo:scale-102 select-none"
              />
            </div>
          </a>
        </div>
      </section>

      {/* 2. Dynamic Product Preview Area DIRECTLY BELOW the category section */}
      <section 
        id="catalog-browser"
        aria-label="Category product preview display"
        className="scroll-mt-24"
      >
        <CategoryProductPreview
          selectedCategoryId={effectiveCategory}
          lang={lang}
          products={products}
          categories={categories}
          onNavigateToCategory={(catId) => {
            if (onNavigateToCategory) {
              onNavigateToCategory(catId);
            } else {
              onSelectCategory(catId, undefined);
            }
          }}
          onViewDetails={setSelectedProduct}
        />
      </section>

      {/* 3. Bestseller Products Section (Assets from assets/products/best_seller/) */}
      <BestsellerProductsSection
        lang={lang}
        products={products}
        onViewDetails={setSelectedProduct}
        onViewAllProducts={onNavigateToProductsWeSell || (() => {})}
      />

      {/* 4. Product Detail Modal */}
      <ProductDetailModal
        product={activeModalProduct}
        category={categories.find((c) => c.id === activeModalProduct?.categoryId || (c.slug && c.slug === activeModalProduct?.categoryId))}
        lang={lang}
        onClose={() => {
          setSelectedProduct(null);
          if (onClearSelectedProduct) {
            onClearSelectedProduct();
          }
        }}
        onContactClick={onContactClick}
      />
    </div>
  );
};

export default ProductCatalog;
