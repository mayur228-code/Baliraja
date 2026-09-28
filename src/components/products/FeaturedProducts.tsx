import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { Language, Product } from '../../types';
import { translations } from '../../data/translations';
import { ProductCard } from './ProductCard';

interface FeaturedProductsProps {
  lang: Language;
  onViewDetails: (product: Product) => void;
  onExploreAll: () => void;
  products?: Product[];
}

export const FeaturedProducts: FC<FeaturedProductsProps> = ({
  lang,
  onViewDetails,
  onExploreAll,
  products = []
}) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  // Single source of truth: filter directly from admin/content store products
  const featuredList = (products || []).filter((p) => p.featured);

  if (featuredList.length === 0) return null;

  return (
    <section 
      aria-labelledby="featured-products-heading"
      className="relative rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 p-6 sm:p-8 md:p-10 text-white shadow-xl overflow-hidden border border-emerald-800/40 text-left"
    >
      {/* Subtle Background Glow Elements */}
      <div 
        className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative z-10 space-y-8">
        {/* Header Row: Title & Explore All CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-emerald-800/40 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-emerald-900/70 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-400" aria-hidden="true" />
              <span>{t.featuredBadge}</span>
            </div>

            <h3 
              id="featured-products-heading"
              className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight leading-tight"
            >
              {t.featuredProductsHeading}
            </h3>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {t.featuredProductsSubheading}
            </p>
          </div>

          <button
            type="button"
            onClick={onExploreAll}
            className="flow-btn inline-flex items-center gap-2 self-start md:self-end bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-600 shadow-xs hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>{t.exploreAllProducts}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Featured Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredList.map((product, idx) => (
            <div key={product.id} className="relative">
              {/* Featured Badge Accent on Card Container */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
                whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '-20px' }}
                transition={{ duration: 0.35, delay: (idx % 3) * 0.06 }}
                className="h-full"
              >
                <ProductCard
                  product={product}
                  lang={lang}
                  onViewDetails={onViewDetails}
                  index={idx}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
