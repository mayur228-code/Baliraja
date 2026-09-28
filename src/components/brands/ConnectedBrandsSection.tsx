import { useMemo } from 'react';
import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Language, Brand } from '../../types';
import { translations } from '../../data/translations';
import { AnimatedUnderline } from '../common/AnimatedSectionHeading';
import { LogoCloud } from '../ui/logo-cloud';
import type { LogoItem } from '../ui/logo-cloud';
import { EmptyStateView } from '../common/StateViews';

interface ConnectedBrandsSectionProps {
  lang: Language;
  brands: Brand[];
}

export const ConnectedBrandsSection: FC<ConnectedBrandsSectionProps> = ({ lang, brands }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];

  // Map admin brand items to LogoItem format preserving original logos & names
  const logoItems: LogoItem[] = useMemo(() => {
    return brands.map((b) => ({
      src: b.logo,
      alt: `${b.name} Logo`,
      name: b.name,
    }));
  }, [brands]);

  return (
    <section
      id="connected-brands"
      aria-labelledby="connected-brands-heading"
      className="relative py-10 sm:py-14 lg:py-16 my-6 rounded-3xl bg-gradient-to-b from-stone-50/80 via-white to-stone-50/80 border border-stone-200/80 shadow-xs overflow-hidden scroll-mt-24"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Centered Section Header & Animated Underline ── */}
        <div className="group/heading text-center max-w-2xl mx-auto mb-8 sm:mb-10 cursor-default select-none">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: '-20px' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h2
              id="connected-brands-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-emerald-950 tracking-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900"
            >
              {t.connectedBrandsHeading}
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
              {t.connectedBrandsSubheading}
            </p>
          </motion.div>

          {/* Animated Agricultural Underline matching website standard */}
          <AnimatedUnderline />
        </div>

        {/* ── Brand Logos Grid or Minimal Empty State ── */}
        {logoItems.length > 0 ? (
          <div className="max-w-5xl mx-auto">
            <LogoCloud logos={logoItems} />
          </div>
        ) : (
          <div className="max-w-md mx-auto px-4 text-center">
            <EmptyStateView
              type="brands"
              lang={lang}
              description={t.brandsEmptyState}
              isCompact={true}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default ConnectedBrandsSection;
