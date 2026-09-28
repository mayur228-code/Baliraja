import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/products/ProductCatalog';
import { AnnouncementStrip } from './components/common/AnnouncementStrip';
import { FounderSection } from './components/about/FounderSection';
import { ConnectedBrandsSection } from './components/brands/ConnectedBrandsSection';
import { FieldVisitsSection } from './components/field-visits/FieldVisitsSection';
import { OurResultsSection } from './components/results/OurResultsSection';
import { VisitBalirajaSection } from './components/contact/VisitBalirajaSection';
import { Footer } from './components/Footer';
import { BrandPageLoader, BrandRouteLoader } from './components/common/LoadingSystem';
import { NotFoundView } from './components/common/StateViews';
import type { Language, NavSection } from './types';
import { translations } from './data/translations';
import { useContentStore } from './data/contentStore';

// Code-split heavy pages and secondary features
const CategoryPage = lazy(() => import('./components/products/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductsWeSellPage = lazy(() => import('./components/products/ProductsWeSellPage').then(m => ({ default: m.ProductsWeSellPage })));
const AboutSection = lazy(() => import('./components/about/AboutSection').then(m => ({ default: m.AboutSection })));
const AgriCalculators = lazy(() => import('./components/AgriCalculators').then(m => ({ default: m.AgriCalculators })));
const AdminApp = lazy(() => import('./admin/AdminApp'));

export function App() {
  const [lang, setLang] = useState<Language>('mr');
  
  // Dedicated private /admin route detection (isolated from public UI)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path === '/admin' || path === '/admin/' || path.startsWith('/admin/');
    }
    return false;
  });

  // Dedicated category page route detection (e.g. /category/seeds, /category/fertilizers or ?section=category&category=seeds)
  const getCategoryFromUrl = (): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const path = window.location.pathname;
    const match = path.match(/^\/category\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    const p = new URLSearchParams(window.location.search);
    if (p.get('section') === 'category' && p.get('category')) {
      return p.get('category') || undefined;
    }
    if (p.get('view') === 'category' && p.get('category')) {
      return p.get('category') || undefined;
    }
    return undefined;
  };

  const [activeCategoryPage, setActiveCategoryPage] = useState<string | undefined>(() => {
    return getCategoryFromUrl();
  });

  // Dedicated "Products We Sell" page route detection
  const getIsProductsWeSellFromUrl = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    if (
      path === '/products-we-sell' || 
      path === '/products-we-sell/' ||
      path === '/products' || 
      path === '/products/' ||
      path === '/catalogue' ||
      path === '/catalog'
    ) {
      return true;
    }
    const p = new URLSearchParams(window.location.search);
    return (
      p.get('view') === 'products-we-sell' || 
      p.get('page') === 'products-we-sell' ||
      p.get('section') === 'products-we-sell'
    );
  };

  const [isProductsWeSellPage, setIsProductsWeSellPage] = useState<boolean>(() => {
    return getIsProductsWeSellFromUrl();
  });

  // Dedicated About page route detection (e.g. /about or ?section=about)
  const getIsAboutFromUrl = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    if (path === '/about' || path === '/about/') return true;
    const p = new URLSearchParams(window.location.search);
    return p.get('section') === 'about' || p.get('view') === 'about' || p.get('page') === 'about';
  };

  // Dedicated Agri Calculator page route detection (e.g. /calculators or ?section=calculators)
  const getIsCalculatorsFromUrl = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    if (path === '/calculators' || path === '/calculators/' || path === '/calculator' || path === '/calculator/') return true;
    const p = new URLSearchParams(window.location.search);
    return p.get('section') === 'calculators' || p.get('view') === 'calculators' || p.get('page') === 'calculators';
  };

  // 404 Unmatched URL Route Detection
  const getIsNotFoundFromUrl = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    if (path === '/' || path === '') return false;
    if (path === '/admin' || path === '/admin/' || path.startsWith('/admin/')) return false;
    if (path.startsWith('/category/')) return false;
    if (
      path === '/products-we-sell' || 
      path === '/products-we-sell/' ||
      path === '/products' || 
      path === '/products/' ||
      path === '/catalogue' ||
      path === '/catalog' ||
      path === '/catalog/'
    ) return false;
    if (path === '/about' || path === '/about/') return false;
    if (path === '/calculators' || path === '/calculators/' || path === '/calculator' || path === '/calculator/') return false;
    return true;
  };

  const [isNotFoundRoute, setIsNotFoundRoute] = useState<boolean>(() => {
    return getIsNotFoundFromUrl();
  });

  // Central content store for safe reflection of admin edits with static fallbacks
  const { products, brands, categories } = useContentStore();

  // Initialize state directly from URL query parameters without cascading effect renders
  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    if (typeof window !== 'undefined') {
      if (getIsAboutFromUrl()) {
        return 'about';
      }
      if (getIsCalculatorsFromUrl()) {
        return 'calculators';
      }
      const sec = new URLSearchParams(window.location.search).get('section') as NavSection;
      if (sec && ['products', 'about', 'contact', 'calculators'].includes(sec)) {
        if (sec === 'contact') {
          setTimeout(() => {
            const el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
          return 'products';
        }
        return sec;
      }
    }
    return 'products';
  });

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('category') || undefined;
    }
    return undefined;
  });

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('subcategory') || undefined;
    }
    return undefined;
  });

  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('product') || undefined;
    }
    return undefined;
  });

  const t = translations[lang];

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const isAdmin = path === '/admin' || path === '/admin/' || path.startsWith('/admin/');
      setIsAdminRoute(isAdmin);

      const catPage = getCategoryFromUrl();
      setActiveCategoryPage(catPage);

      const isProductsWeSell = getIsProductsWeSellFromUrl();
      setIsProductsWeSellPage(isProductsWeSell);

      const notFound = getIsNotFoundFromUrl();
      setIsNotFoundRoute(notFound);

      if (!isAdmin && !catPage && !isProductsWeSell && !notFound) {
        if (getIsAboutFromUrl()) {
          setActiveSection('about');
          setSelectedCategory(undefined);
          setSelectedSubcategory(undefined);
          setSelectedProductId(undefined);
        } else if (getIsCalculatorsFromUrl()) {
          setActiveSection('calculators');
          setSelectedCategory(undefined);
          setSelectedSubcategory(undefined);
          setSelectedProductId(undefined);
        } else {
          const p = new URLSearchParams(window.location.search);
          setSelectedCategory(p.get('category') || undefined);
          setSelectedSubcategory(p.get('subcategory') || undefined);
          setSelectedProductId(p.get('product') || undefined);
          const s = (p.get('section') as NavSection) || 'products';
          if (s === 'contact') {
            setActiveSection('products');
            setTimeout(() => {
              const el = document.getElementById('contact');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          } else {
            setActiveSection(s);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleExitAdmin = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
    setIsNotFoundRoute(false);
    setActiveCategoryPage(undefined);
    setIsProductsWeSellPage(false);
    setActiveSection('products');
  };

  const handleBackToHomeFromNotFound = () => {
    window.history.pushState({}, '', '/');
    setIsNotFoundRoute(false);
    setActiveCategoryPage(undefined);
    setIsProductsWeSellPage(false);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCategoryPage = (categoryId: string) => {
    const newUrl = `/category/${categoryId}`;
    window.history.pushState({}, '', newUrl);
    setIsNotFoundRoute(false);
    setActiveCategoryPage(categoryId);
    setIsProductsWeSellPage(false);
    setSelectedCategory(categoryId);
    setSelectedSubcategory(undefined);
    setSelectedProductId(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHomeFromCategory = () => {
    window.history.pushState({}, '', '/');
    setIsNotFoundRoute(false);
    setActiveCategoryPage(undefined);
    setIsProductsWeSellPage(false);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToProductsWeSell = () => {
    window.history.pushState({}, '', '/products-we-sell');
    setIsNotFoundRoute(false);
    setIsProductsWeSellPage(true);
    setActiveCategoryPage(undefined);
    setSelectedProductId(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHomeFromProductsWeSell = () => {
    window.history.pushState({}, '', '/');
    setIsNotFoundRoute(false);
    setIsProductsWeSellPage(false);
    setActiveCategoryPage(undefined);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAbout = () => {
    window.history.pushState({}, '', '/about');
    setIsNotFoundRoute(false);
    setActiveCategoryPage(undefined);
    setIsProductsWeSellPage(false);
    setActiveSection('about');
    setSelectedProductId(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHomeFromAbout = () => {
    window.history.pushState({}, '', '/');
    setIsNotFoundRoute(false);
    setActiveCategoryPage(undefined);
    setIsProductsWeSellPage(false);
    setActiveSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateUrl = (section: NavSection, cat?: string, sub?: string, prod?: string) => {
    const p = new URLSearchParams();
    if (section !== 'products') {
      p.set('section', section);
    } else {
      if (cat) p.set('category', cat);
      if (sub) p.set('subcategory', sub);
      if (prod) p.set('product', prod);
    }
    const query = p.toString();
    const newUrl = query ? `/?${query}` : '/';
    window.history.pushState({}, '', newUrl);
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'mr' ? 'en' : 'mr'));
  };

  const handleSelectSection = (section: NavSection, categoryId?: string, subcategoryId?: string) => {
    setIsNotFoundRoute(false);
    if (section === 'contact') {
      setActiveCategoryPage(undefined);
      setIsProductsWeSellPage(false);
      setActiveSection('products');
      setSelectedProductId(undefined);
      setTimeout(() => {
        const el = document.getElementById('contact');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }
    setActiveCategoryPage(undefined);
    setIsProductsWeSellPage(false);
    setActiveSection(section);
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    setSelectedProductId(undefined);
    updateUrl(section, categoryId, subcategoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (productId: string, categoryId?: string, subcategoryId?: string) => {
    setActiveCategoryPage(undefined);
    setIsProductsWeSellPage(false);
    setActiveSection('products');
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    setSelectedProductId(productId);
    updateUrl('products', categoryId, subcategoryId, productId);

    setTimeout(() => {
      const el = document.getElementById('catalog-browser') || document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleClearSelectedProduct = () => {
    setSelectedProductId(undefined);
    const p = new URLSearchParams(window.location.search);
    p.delete('product');
    const query = p.toString();
    window.history.replaceState({}, '', query ? `?${query}` : window.location.pathname);
  };

  const handleHeroSelectSection = (section: NavSection, categoryId?: string, subcategoryId?: string) => {
    if (section === 'about') {
      const el = document.getElementById('about');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (section === 'contact') {
      const el = document.getElementById('contact');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    handleSelectSection(section, categoryId, subcategoryId);
    if (section === 'products') {
      const el = document.getElementById('products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <BrandPageLoader
            lang={lang}
            message={lang === 'mr' ? 'प्रशासक पॅनेल लोड होत आहे...' : 'Loading Admin Boundary...'}
          />
        }
      >
        <AdminApp onExitAdmin={handleExitAdmin} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-clip">
      {/* Premium Business Header */}
      <Header
        lang={lang}
        onToggleLang={handleToggleLang}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onSelectProduct={handleSelectProduct}
        onNavigateToProductsWeSell={handleNavigateToProductsWeSell}
        onNavigateToCategory={handleNavigateToCategoryPage}
        onNavigateToAbout={handleNavigateToAbout}
        products={products}
        categories={categories}
      />

      {/* Cinematic Hero Section (Full-Width, Immediately Below Header - Only on Home page when not 404) */}
      {!isNotFoundRoute && !activeCategoryPage && !isProductsWeSellPage && activeSection === 'products' && (
        <Hero
          lang={lang}
          onSelectSection={handleHeroSelectSection}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* 404 Route Not Found View */}
        {isNotFoundRoute && (
          <NotFoundView
            lang={lang}
            onGoHome={handleBackToHomeFromNotFound}
            onBrowseProducts={handleNavigateToProductsWeSell}
            requestedPath={typeof window !== 'undefined' ? window.location.pathname : undefined}
          />
        )}

        {/* Dedicated Category Page View (View All [Category] destination) */}
        {!isNotFoundRoute && activeCategoryPage && (
          <Suspense fallback={<BrandRouteLoader lang={lang} minHeight="min-h-[500px]" />}>
            <CategoryPage
              categoryId={activeCategoryPage}
              lang={lang}
              products={products}
              categories={categories}
              onBackToHome={handleBackToHomeFromCategory}
              onSelectCategory={(catId) => handleNavigateToCategoryPage(catId)}
              onContactClick={() => {
                handleBackToHomeFromCategory();
                setTimeout(() => {
                  const el = document.getElementById('contact');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            />
          </Suspense>
        )}

        {/* Dedicated "Products We Sell" Page View (View All Products destination) */}
        {!isNotFoundRoute && !activeCategoryPage && isProductsWeSellPage && (
          <Suspense fallback={<BrandRouteLoader lang={lang} minHeight="min-h-[600px]" />}>
            <ProductsWeSellPage
              lang={lang}
              products={products}
              categories={categories}
              onBackToHome={handleBackToHomeFromProductsWeSell}
              onViewDetails={(prod) => {
                setSelectedProductId(prod.id);
              }}
              onContactClick={() => {
                handleBackToHomeFromProductsWeSell();
                setTimeout(() => {
                  const el = document.getElementById('contact');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            />
          </Suspense>
        )}

        {/* Secondary Feature: Agri Calculators */}
        {!isNotFoundRoute && !activeCategoryPage && !isProductsWeSellPage && activeSection === 'calculators' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <button
                type="button"
                onClick={() => handleSelectSection('products')}
                className="text-xs font-bold text-stone-500 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                ← {t.backToHome}
              </button>
              <span className="text-2xs font-semibold uppercase tracking-wider text-stone-400">
                {t.secondaryToolLabel}
              </span>
            </div>
            <Suspense fallback={<BrandRouteLoader lang={lang} minHeight="min-h-[400px]" />}>
              <AgriCalculators lang={lang} />
            </Suspense>
          </div>
        )}

        {/* Product System & Field Experience Foundation (Home Page) */}
        {!isNotFoundRoute && !activeCategoryPage && !isProductsWeSellPage && activeSection === 'products' && (
          <div id="products-section" className="scroll-mt-24 space-y-16 sm:space-y-20">
            <ProductCatalog
              lang={lang}
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              selectedProductId={selectedProductId}
              onClearSelectedProduct={handleClearSelectedProduct}
              onSelectCategory={(catId, subcatId) => {
                setSelectedCategory(catId);
                setSelectedSubcategory(subcatId);
                setSelectedProductId(undefined);
                updateUrl('products', catId, subcatId);
              }}
              onNavigateToCategory={handleNavigateToCategoryPage}
              onNavigateToProductsWeSell={handleNavigateToProductsWeSell}
              onContactClick={() => handleSelectSection('contact')}
            />

            {/* Running Red Announcement Strip (Right to Left Continuous Marquee) */}
            <AnnouncementStrip lang={lang} />

            {/* Field Visits Section */}
            <FieldVisitsSection lang={lang} />

            {/* Our Results Section */}
            <OurResultsSection lang={lang} />

            {/* Founder of Baliraja Section */}
            <FounderSection
              lang={lang}
              onKnowMore={handleNavigateToAbout}
              onGoHome={() => {
                handleSelectSection('products');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Visit Baliraja / Shop Location & Map Navigation Section */}
            <VisitBalirajaSection lang={lang} />

            {/* Connected With Brands Section */}
            <ConnectedBrandsSection
              lang={lang}
              brands={brands}
            />
          </div>
        )}

        {/* Standalone Dedicated About Page (Direct URL Access: /about or ?section=about) */}
        {!isNotFoundRoute && !activeCategoryPage && !isProductsWeSellPage && activeSection === 'about' && (
          <Suspense fallback={<BrandRouteLoader lang={lang} minHeight="min-h-[500px]" />}>
            <AboutSection
              lang={lang}
              isStandalone={true}
              onBackToHome={handleBackToHomeFromAbout}
              onContactClick={() => {
                handleBackToHomeFromAbout();
                setTimeout(() => {
                  const el = document.getElementById('contact');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            />
          </Suspense>
        )}
      </main>

      {/* Premium Business Footer */}
      <Footer lang={lang} onSelectSection={handleSelectSection} />
    </div>
  );
}

export default App;
