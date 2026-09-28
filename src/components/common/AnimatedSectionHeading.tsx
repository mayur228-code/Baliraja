import type { FC, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

export interface AnimatedUnderlineProps {
  align?: 'center' | 'left' | 'responsive';
  widthClass?: string;
  heightClass?: string;
  gradientClass?: string;
  className?: string;
  layoutKey?: string;
}

/**
 * AnimatedUnderline:
 * - Scroll entrance: reveals smoothly via scaleX(0) -> scaleX(1) on entering viewport, resets on exit.
 * - Interactive hover: expands horizontally (~30%) and emphasizes presence with subtle glow on hover.
 * - Uses Fertilizers heading as the exact animation reference (duration: 0.38s, ease: [0.22, 1, 0.36, 1], delay: 0.05s).
 */
export const AnimatedUnderline: FC<AnimatedUnderlineProps> = ({
  align = 'center',
  widthClass = 'h-0.5 sm:h-[3px] w-16 sm:w-20 md:w-24',
  gradientClass = 'bg-gradient-to-r from-emerald-800 via-emerald-600 to-amber-500',
  className,
  layoutKey,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const alignmentClasses =
    align === 'left'
      ? 'origin-left'
      : align === 'responsive'
      ? 'origin-center lg:origin-left mx-auto lg:mx-0'
      : 'origin-center mx-auto';

  const hoverOriginClasses =
    align === 'left'
      ? 'origin-left'
      : align === 'responsive'
      ? 'origin-center lg:origin-left'
      : 'origin-center';

  return (
    <motion.div
      key={layoutKey}
      initial={shouldReduceMotion ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: false, margin: '-20px' }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className={cn(
        'mt-2.5 sm:mt-3 pointer-events-none select-none',
        widthClass,
        alignmentClasses,
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          'w-full h-full rounded-full transition-all duration-300 ease-out will-change-transform',
          gradientClass,
          hoverOriginClasses,
          'group-hover/heading:scale-x-130 group-hover/heading:scale-y-125 group-hover/heading:brightness-110 group-hover/heading:shadow-[0_2px_10px_rgba(16,185,129,0.35)]'
        )}
      />
    </motion.div>
  );
};

export interface AnimatedSectionHeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  id?: string;
  title: ReactNode;
  align?: 'center' | 'left' | 'responsive';
  badge?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  containerClassName?: string;
  underlineWidthClass?: string;
  underlineGradientClass?: string;
  layoutKey?: string;
}

/**
 * AnimatedSectionHeading:
 * Standardized reusable heading component matching the Fertilizers heading motion:
 * - Enter viewport: heading animates (opacity: 0 -> 1, y: 8 -> 0) in 0.25s easeOut, underline reveals in 0.38s.
 * - Leave viewport: resets smoothly, plays again on re-entry.
 * - Hover anywhere over heading unit: subtle lift on heading, smooth expansion and emphasis on underline.
 */
export const AnimatedSectionHeading: FC<AnimatedSectionHeadingProps> = ({
  as: Component = 'h2',
  id,
  title,
  align = 'center',
  badge,
  subtitle,
  className,
  containerClassName,
  underlineWidthClass,
  underlineGradientClass,
  layoutKey,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const alignmentContainerClass =
    align === 'left'
      ? 'text-left items-start'
      : align === 'responsive'
      ? 'text-center lg:text-left items-center lg:items-start'
      : 'text-center items-center';

  return (
    <div
      className={cn(
        'group/heading flex flex-col cursor-default select-none',
        alignmentContainerClass,
        containerClassName
      )}
    >
      {badge && <div className="mb-2.5">{badge}</div>}

      <motion.div
        key={layoutKey}
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-20px' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full"
      >
        <Component
          id={id}
          className={cn(
            'font-serif text-emerald-950 tracking-tight transition-all duration-300 ease-out group-hover/heading:-translate-y-0.5 group-hover/heading:text-emerald-900',
            className || 'text-2xl sm:text-3xl lg:text-4xl font-bold'
          )}
        >
          {title}
        </Component>
      </motion.div>

      <AnimatedUnderline
        align={align}
        widthClass={underlineWidthClass}
        gradientClass={underlineGradientClass}
        layoutKey={layoutKey}
      />

      {subtitle && (
        <div className="mt-2 text-xs sm:text-sm text-stone-600 max-w-lg leading-relaxed">
          {subtitle}
        </div>
      )}
    </div>
  );
};
