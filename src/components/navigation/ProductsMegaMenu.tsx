import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import type { Language, Product, NavCategory } from '../../types';
import { navigationCategories } from '../../data/navigationData';
import { getCategoryIconComponent } from '../../lib/categoryIcons';
import logoWatermark from '../../assets/logo.png';

interface ProductsMegaMenuProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId?: string, subcategoryId?: string) => void;
  onNavigateToCategory?: (categoryId: string) => void;
  onNavigateToProductsWeSell?: () => void;
  onSelectProduct?: (productId: string, categoryId?: string, subcategoryId?: string) => void;
  products?: Product[];
  categories?: NavCategory[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const ProductsMegaMenu: FC<ProductsMegaMenuProps> = ({
  lang,
  isOpen,
  onClose,
  onSelectCategory,
  onNavigateToCategory,
  onNavigateToProductsWeSell,
  categories = navigationCategories,
  onMouseEnter,
  onMouseLeave
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          id="product-dropdown"
          role="region"
          aria-label={lang === 'mr' ? 'उत्पादने मेनू' : 'Product menu'}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-full left-0 md:-left-12 lg:left-0 pt-3 z-50 w-[580px] lg:w-[820px] max-w-[calc(100vw-2rem)]"
        >
          {/* Outer Glass Shell with concentric double-bezel */}
          <div className="relative bg-white/92 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.14),0_8px_20px_-4px_rgba(6,78,59,0.06),inset_0_1px_1px_0_rgba(255,255,255,1)] p-5 lg:p-6.5 text-left overflow-hidden">
            
            {/* Centered Subtle Logo Watermark (Original natural colors, low opacity in backdrop) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={shouldReduceMotion ? false : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 select-none overflow-hidden p-6"
              aria-hidden="true"
            >
              <img
                src={logoWatermark}
                alt=""
                className="w-56 sm:w-64 md:w-72 max-h-[70%] object-contain opacity-[0.06] pointer-events-none select-none"
              />
            </motion.div>

            {/* Dropdown Categories Grid (z-10) */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
              {activeCategories.map((category, idx) => {
                const CategoryIcon = getCategoryIconComponent(category.icon || category.id);
                const subcategories = category.subcategories || [];

                return (
                  <motion.div
                    key={category.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: idx * 0.03, ease: 'easeOut' }}
                    className="space-y-2.5"
                  >
                    {/* Category Header Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onNavigateToCategory) {
                          onNavigateToCategory(category.id);
                        } else {
                          onSelectCategory(category.id);
                        }
                      }}
                      className="group/cat w-full text-left pb-2 border-b border-stone-200/70 hover:border-emerald-500/50 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 rounded-xs flex items-center gap-2 overflow-visible"
                      aria-label={lang === 'mr' ? `${category.nameMr} वर्गवारी पहा` : `View ${category.name} category`}
                    >
                      {/* Glass Category Icon Container */}
                      <div className="w-6.5 h-6.5 rounded-lg bg-emerald-50/90 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 transition-all duration-250 ease-out group-hover/cat:scale-110 group-hover/cat:bg-emerald-600 group-hover/cat:text-white shadow-2xs">
                        <CategoryIcon className="w-3.5 h-3.5 transition-transform duration-250" />
                      </div>

                      <span className="text-xs font-bold tracking-normal text-stone-900 group-hover/cat:text-emerald-800 transition-colors font-serif leading-normal py-0.5 overflow-visible">
                        {lang === 'mr' ? category.nameMr : category.name}
                      </span>
                    </button>

                    {/* Category Types List */}
                    {subcategories.length > 0 && (
                      <ul className="space-y-1.5 pt-0.5 overflow-visible" role="list">
                        {subcategories.map((type) => (
                          <li key={type.id} className="overflow-visible">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCategory(category.id, type.id);
                                onClose();
                              }}
                              className="group/type w-full text-left text-xs font-normal text-stone-600 hover:text-emerald-950 transition-colors flex items-start gap-1.5 py-0.5 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 rounded-xs overflow-visible"
                            >
                              <span
                                className="text-emerald-600/70 group-hover/type:text-emerald-700 group-hover/type:translate-x-0.5 transition-transform duration-150 shrink-0 font-sans select-none text-xs leading-tight mt-0.5"
                                aria-hidden="true"
                              >
                                →
                              </span>
                              <span className="leading-normal group-hover/type:font-medium py-0.5 overflow-visible">
                                {lang === 'mr' ? type.nameMr : type.name}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* View All Products Button (Glass Flow Bar) */}
            <div className="relative z-10 mt-5 pt-3.5 border-t border-stone-200/70 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateToProductsWeSell) {
                    onNavigateToProductsWeSell();
                  } else {
                    onSelectCategory();
                  }
                }}
                className="flow-btn group/btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-emerald-950 bg-stone-50/80 hover:bg-emerald-50/80 border border-stone-200/80 hover:border-emerald-300 transition-all duration-200 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-700 shadow-2xs leading-normal"
                aria-label={lang === 'mr' ? 'सर्व उत्पादने कॅटलॉग उघडा' : 'Open all products catalogue'}
              >
                <LayoutGrid 
                  className="w-3.5 h-3.5 text-emerald-700 group-hover/btn:scale-110 transition-transform duration-200" 
                  aria-hidden="true" 
                />
                <span className="py-0.5 leading-normal">
                  {lang === 'mr' ? 'सर्व उत्पादने पहा' : 'View All Products'}
                </span>
                <ArrowRight 
                  className="w-3.5 h-3.5 text-stone-400 group-hover/btn:text-emerald-800 transition-transform duration-200 group-hover/btn:translate-x-0.5" 
                  aria-hidden="true" 
                />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ProductDropdown = ProductsMegaMenu;
export default ProductsMegaMenu;
