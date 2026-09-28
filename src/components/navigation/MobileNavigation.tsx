import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronDown, 
  Languages, 
  MapPin,
  LayoutGrid
} from 'lucide-react';
import type { Language, NavSection, Product, NavCategory } from '../../types';
import { navigationCategories } from '../../data/navigationData';
import { getCategoryIconComponent } from '../../lib/categoryIcons';
import { translations } from '../../data/translations';
import { useContentStore } from '../../data/contentStore';

interface MobileNavigationProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection, categoryId?: string, subcategoryId?: string) => void;
  onSelectProduct?: (productId: string, categoryId?: string, subcategoryId?: string) => void;
  onNavigateToProductsWeSell?: () => void;
  onNavigateToCategory?: (categoryId: string) => void;
  onNavigateToAbout?: () => void;
  products?: Product[];
  categories?: NavCategory[];
  onToggleLang: () => void;
}

export const MobileNavigation: FC<MobileNavigationProps> = ({
  lang,
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  onNavigateToProductsWeSell,
  onNavigateToCategory,
  onNavigateToAbout,
  categories = navigationCategories,
  onToggleLang
}) => {
  const [productsExpanded, setProductsExpanded] = useState(true);
  const t = translations[lang];
  const { businessInfo } = useContentStore();
  const activeCategories = categories.filter((c) => c.active !== false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleProductSelect = (categoryId?: string, subcategoryId?: string) => {
    onSelectSection('products', categoryId, subcategoryId);
    onClose();
  };

  const handleAboutClick = () => {
    onClose();
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
    onClose();
    setTimeout(() => {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCalculatorsClick = () => {
    onSelectSection('calculators');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end text-left">
          {/* Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/65 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Glass Drawer Menu */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.openMenuAria}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-sm bg-white/96 backdrop-blur-2xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 border-l border-white/60"
          >
            {/* Drawer Content */}
            <div>
              {/* Header */}
              <div className="flex items-center justify-between p-4.5 border-b border-stone-200/70 bg-stone-50/60 backdrop-blur-md">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectSection('products');
                    onClose();
                    window.history.pushState({}, '', '/');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2.5 group cursor-pointer text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-lg p-1 -m-1"
                  aria-label={t.brandHomeAria || 'Home'}
                >
                  <img
                    src="/assets/logo.png"
                    alt="Baliraja"
                    className="w-7.5 h-7.5 object-contain rounded-full shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                  />
                  <span className="text-base font-black text-stone-900 font-serif group-hover:text-emerald-900 transition-colors">
                    {t.businessName}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.closeMenuAria}
                  className="p-1.5 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items: Exactly 4 clean, text-based items */}
              <nav className="p-4 space-y-1 divide-y divide-stone-100">
                {/* 1. Product Item with Accordion for Categories & Types */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => setProductsExpanded(!productsExpanded)}
                    className="w-full py-2 flex items-center justify-between text-left text-sm font-semibold text-stone-800 hover:text-emerald-950 transition-colors cursor-pointer"
                    aria-expanded={productsExpanded}
                  >
                    <span>{t.navProducts}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                        productsExpanded ? 'rotate-180 text-emerald-800' : ''
                      }`}
                    />
                  </button>

                  {/* Categories and Types */}
                  {productsExpanded && (
                    <div className="pt-2 pb-1 pl-2 space-y-4">
                      {activeCategories.map((category) => {
                        const CategoryIcon = getCategoryIconComponent(category.icon || category.id);
                        const subcategories = category.subcategories || [];
                        return (
                          <div key={category.id} className="space-y-1.5">
                            {/* Category Name */}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onNavigateToCategory) {
                                  onNavigateToCategory(category.id);
                                } else {
                                  handleProductSelect(category.id);
                                }
                              }}
                              className="text-left font-bold text-xs tracking-normal text-emerald-950 hover:text-emerald-700 transition-colors font-serif py-1 flex items-center gap-2 cursor-pointer leading-normal overflow-visible"
                              aria-label={lang === 'mr' ? `${category.nameMr} वर्गवारी पहा` : `View ${category.name} category`}
                            >
                              <div className="w-5.5 h-5.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0">
                                <CategoryIcon className="w-3 h-3" />
                              </div>
                              <span className="py-0.5 leading-normal">{lang === 'mr' ? category.nameMr : category.name}</span>
                            </button>

                            {/* Types List */}
                            {subcategories.length > 0 && (
                              <ul className="space-y-1 pl-1 overflow-visible" role="list">
                                {subcategories.map((type) => (
                                  <li key={type.id} className="overflow-visible">
                                    <button
                                      type="button"
                                      onClick={() => handleProductSelect(category.id, type.id)}
                                      className="text-left text-xs font-normal text-stone-600 hover:text-emerald-900 transition-colors flex items-start gap-1.5 py-0.5 cursor-pointer overflow-visible"
                                    >
                                      <span 
                                        className="text-emerald-600/70 shrink-0 font-sans select-none text-xs leading-tight mt-0.5"
                                        aria-hidden="true"
                                      >
                                        →
                                      </span>
                                      <span className="leading-normal py-0.5 overflow-visible">
                                        {lang === 'mr' ? type.nameMr : type.name}
                                      </span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}

                      {/* View All Products button (Glass Flow Button) */}
                      <div className="pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onNavigateToProductsWeSell) {
                              onNavigateToProductsWeSell();
                            } else {
                              handleProductSelect();
                            }
                          }}
                          className="flow-btn group/moball inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold text-emerald-900 hover:text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 cursor-pointer shadow-2xs"
                          aria-label={lang === 'mr' ? 'सर्व उत्पादने कॅटलॉग उघडा' : 'Open all products catalogue'}
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-emerald-700 transition-transform group-hover/moball:scale-110" />
                          <span>{lang === 'mr' ? 'सर्व उत्पादने पहा' : 'View All Products'}</span>
                          <span className="text-xs">→</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. About */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={handleAboutClick}
                    className="w-full py-2 text-left text-sm font-semibold text-stone-800 hover:text-emerald-950 transition-colors cursor-pointer"
                  >
                    <span>{t.navAbout}</span>
                  </button>
                </div>

                {/* 3. Contact */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={handleContactClick}
                    className="w-full py-2 text-left text-sm font-semibold text-stone-800 hover:text-emerald-950 transition-colors cursor-pointer"
                  >
                    <span>{t.navContact}</span>
                  </button>
                </div>

                {/* 4. Agri Calculators */}
                <div className="py-2">
                  <button
                    type="button"
                    onClick={handleCalculatorsClick}
                    className="w-full py-2 text-left text-sm font-semibold text-stone-800 hover:text-emerald-950 transition-colors cursor-pointer"
                  >
                    <span>{t.navCalculators}</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* Drawer Footer: Language Switcher & Location */}
            <div className="p-4 border-t border-stone-200/80 bg-stone-50/80 backdrop-blur-md space-y-3">
              <button
                type="button"
                onClick={onToggleLang}
                aria-label={t.switchLanguageAria}
                className="w-full min-h-[42px] py-2 px-3.5 bg-white border border-stone-200/90 rounded-xl font-bold text-xs text-stone-800 hover:bg-stone-100 flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 shadow-2xs"
              >
                <Languages className="w-4 h-4 text-emerald-700" />
                <span>{t.languageToggle}</span>
                <span className="text-2xs text-stone-400 font-normal">
                  ({lang === 'mr' ? 'Switch to English' : 'मराठीत बदला'})
                </span>
              </button>

              <div className="text-2xs text-stone-500 flex items-start gap-2 pt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  {lang === 'mr' ? (businessInfo.shopAddressMr || businessInfo.location.addressMr) : (businessInfo.shopAddressEn || businessInfo.location.addressEn)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileNavigation;
