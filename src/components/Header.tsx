import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { 
  ChevronDown, 
  Languages, 
  Menu
} from 'lucide-react';
import type { Language, NavSection, Product, NavCategory } from '../types';
import { translations } from '../data/translations';
import { ProductsMegaMenu } from './navigation/ProductsMegaMenu';
import { MobileNavigation } from './navigation/MobileNavigation';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection, categoryId?: string, subcategoryId?: string) => void;
  onSelectProduct?: (productId: string, categoryId?: string, subcategoryId?: string) => void;
  onNavigateToProductsWeSell?: () => void;
  onNavigateToCategory?: (categoryId: string) => void;
  onNavigateToAbout?: () => void;
  products?: Product[];
  categories?: NavCategory[];
}

export const Header: FC<HeaderProps> = ({
  lang,
  onToggleLang,
  activeSection,
  onSelectSection,
  onSelectProduct,
  onNavigateToProductsWeSell,
  onNavigateToCategory,
  onNavigateToAbout,
  products,
  categories
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [brandNameArtworkAvailable, setBrandNameArtworkAvailable] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const closeTimeoutRef = useRef<number | null>(null);
  const t = translations[lang];

  // Track scroll position for subtle glass elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleBrandClick = () => {
    onSelectSection('products');
    setProductsDropdownOpen(false);
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductsClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setProductsDropdownOpen(false);
    if (onNavigateToProductsWeSell) {
      onNavigateToProductsWeSell();
    } else {
      onSelectSection('products');
    }
  };

  const handleProductsMouseEnter = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setProductsDropdownOpen(true);
  };

  const handleProductsMouseLeave = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setProductsDropdownOpen(false);
    }, 180);
  };

  const handleCategorySelect = (categoryId?: string, subcategoryId?: string) => {
    onSelectSection('products', categoryId, subcategoryId);
    setProductsDropdownOpen(false);
  };

  const handleAboutClick = () => {
    setProductsDropdownOpen(false);
    if (onNavigateToAbout) {
      onNavigateToAbout();
    } else {
      onSelectSection('about');
    }
  };

  const handleContactClick = () => {
    if (activeSection !== 'products') {
      onSelectSection('products');
    }
    setProductsDropdownOpen(false);
    setTimeout(() => {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const handleCalculatorsClick = () => {
    onSelectSection('calculators');
    setProductsDropdownOpen(false);
  };

  return (
    <header 
      role="banner" 
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/88 backdrop-blur-xl border-b border-stone-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)]' 
          : 'bg-white/78 backdrop-blur-lg border-b border-stone-200/60 shadow-[0_2px_15px_rgb(0,0,0,0.02)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-17 sm:h-19 gap-4">
          
          {/* Brand Presentation: Primary Brand Identity with Sheen Reflection (Clickable to Home /) */}
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleBrandClick();
            }}
            className="flex items-center cursor-pointer group select-none shrink-0"
            role="link"
            tabIndex={0}
            aria-label={t.brandHomeAria}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBrandClick();
              }
            }}
          >
            <div className="relative inline-flex items-center overflow-hidden rounded-xl py-1 px-1.5 transition-transform duration-200 group-hover:scale-[1.015]">
              {brandNameArtworkAvailable ? (
                <div className="relative flex items-center h-8 sm:h-9 md:h-10">
                  <img
                    src="/assets/brand/brand_name.png"
                    alt={t.businessName}
                    className="max-h-full w-auto max-w-[230px] sm:max-w-[280px] md:max-w-[320px] object-contain"
                    onError={() => setBrandNameArtworkAvailable(false)}
                  />
                  {/* Subtle Reflecting Sheen Sweep Animation */}
                  <div 
                    className="pointer-events-none absolute inset-0 brand-reflect-sheen" 
                    aria-hidden="true" 
                  />
                </div>
              ) : (
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-stone-900 font-serif leading-tight group-hover:text-emerald-900 transition-colors">
                  {t.businessName}
                </span>
              )}
            </div>
          </a>

          {/* Desktop Navigation: Exactly 4 clean items with animated hover underline */}
          <nav 
            role="navigation" 
            aria-label={lang === 'mr' ? 'मुख्य नेव्हिगेशन' : 'Main navigation'}
            className="hidden md:flex items-center h-full gap-7 lg:gap-9"
          >
            {/* 1. Product (with hover dropdown & animated underline) */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={handleProductsMouseEnter}
              onMouseLeave={handleProductsMouseLeave}
            >
              <button
                type="button"
                onClick={handleProductsClick}
                aria-expanded={productsDropdownOpen}
                aria-haspopup="true"
                aria-controls="product-dropdown"
                aria-label={productsDropdownOpen ? t.closeProductsMenuAria : t.openProductsMenuAria}
                className="group relative py-2 text-sm lg:text-[15px] font-semibold text-stone-700 hover:text-emerald-950 transition-colors duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700/60 rounded-xs inline-flex items-center gap-1.5"
              >
                <span>{t.navProducts}</span>
                <ChevronDown 
                  className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 group-hover:text-emerald-800 ${
                    productsDropdownOpen ? 'rotate-180 text-emerald-800' : ''
                  }`}
                  aria-hidden="true"
                />
                {/* Thin Elegant Animated Underline */}
                <span 
                  className={`absolute -bottom-0.5 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-full transition-all duration-250 ease-out origin-left pointer-events-none ${
                    productsDropdownOpen ? 'scale-x-100 opacity-100 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100'
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Compact Floating Product Dropdown */}
              <ProductsMegaMenu
                lang={lang}
                isOpen={productsDropdownOpen}
                onClose={() => setProductsDropdownOpen(false)}
                onSelectCategory={handleCategorySelect}
                onNavigateToCategory={onNavigateToCategory}
                onNavigateToProductsWeSell={onNavigateToProductsWeSell}
                categories={categories}
                onMouseEnter={handleProductsMouseEnter}
                onMouseLeave={handleProductsMouseLeave}
              />
            </div>

            {/* 2. About */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={handleAboutClick}
                className="group relative py-2 text-sm lg:text-[15px] font-semibold text-stone-700 hover:text-emerald-950 transition-colors duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700/60 rounded-xs inline-flex items-center"
              >
                <span>{t.navAbout}</span>
                <span 
                  className="absolute -bottom-0.5 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-full scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100 transition-all duration-250 ease-out origin-left pointer-events-none"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* 3. Contact */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={handleContactClick}
                className="group relative py-2 text-sm lg:text-[15px] font-semibold text-stone-700 hover:text-emerald-950 transition-colors duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700/60 rounded-xs inline-flex items-center"
              >
                <span>{t.navContact}</span>
                <span 
                  className="absolute -bottom-0.5 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-full scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100 transition-all duration-250 ease-out origin-left pointer-events-none"
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* 4. Agri Calculators */}
            <div className="relative h-full flex items-center">
              <button
                type="button"
                onClick={handleCalculatorsClick}
                className="group relative py-2 text-sm lg:text-[15px] font-semibold text-stone-700 hover:text-emerald-950 transition-colors duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700/60 rounded-xs inline-flex items-center"
              >
                <span>{t.navCalculators}</span>
                <span 
                  className="absolute -bottom-0.5 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-700 to-amber-500 rounded-full scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100 transition-all duration-250 ease-out origin-left pointer-events-none"
                  aria-hidden="true"
                />
              </button>
            </div>
          </nav>

          {/* Language Switcher & Mobile Menu Trigger */}
          <div className="flex items-center gap-2.5">
            {/* Bilingual Switcher (Desktop Glass Pill) */}
            <button
              type="button"
              onClick={onToggleLang}
              aria-label={t.switchLanguageAria}
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/70 hover:bg-white/95 text-stone-800 border border-stone-200/90 hover:border-emerald-500/40 backdrop-blur-md px-3.5 py-1.5 rounded-full font-bold text-xs transition-all duration-200 shadow-2xs hover:shadow-xs hover:text-emerald-950 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 outline-hidden"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.languageToggle}</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t.openMenuAria}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-xl bg-white/70 hover:bg-white border border-stone-200/80 text-stone-700 backdrop-blur-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 outline-hidden shadow-2xs"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation System */}
      <MobileNavigation
        lang={lang}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        onSelectProduct={onSelectProduct}
        onNavigateToProductsWeSell={onNavigateToProductsWeSell}
        onNavigateToCategory={onNavigateToCategory}
        onNavigateToAbout={onNavigateToAbout}
        products={products}
        categories={categories}
        onToggleLang={onToggleLang}
      />
    </header>
  );
};

export default Header;
