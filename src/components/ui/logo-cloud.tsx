import type { FC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { cn } from '../../lib/utils';

export interface LogoItem {
  src: string;
  alt: string;
  name?: string;
  width?: number;
  height?: number;
}

export interface LogoCloudProps {
  logos: LogoItem[];
  className?: string;
  id?: string;
}

/**
 * LogoCloud Component:
 * Adapted from the Progressive Logo Cloud reference (logo-cloud-5.tsx)
 * for Baliraja Krishi Seva Kendra.
 *
 * Features:
 * - Clean translucent/glass card surfaces with soft shadows and subtle borders
 * - Preserves original brand colors without any artificial recoloring (no invert/grayscale)
 * - Viewport reveal with stagger animation that resets on exit and replays on re-entry (once: false)
 * - Subtly responsive hover animation (lift + scale + highlight in 150-200ms)
 * - Strict object-contain sizing preventing logo distortion
 * - Accessible with keyboard focus and tooltips
 * - Reduced motion support
 */
export const LogoCloud: FC<LogoCloudProps> = ({ logos, className, id }) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.02,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.32,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      id={id}
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: false, margin: '-20px' }}
      variants={containerVariants}
      className={cn(
        'mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4.5 w-full max-w-5xl',
        className
      )}
    >
      {logos.map((logo, index) => (
        <motion.div
          key={`${logo.alt}-${index}`}
          variants={shouldReduceMotion ? undefined : cardVariants}
          whileHover={
            shouldReduceMotion
              ? undefined
              : {
                  y: -3,
                  scale: 1.02,
                  transition: { duration: 0.18, ease: 'easeOut' },
                }
          }
          className="group relative flex items-center justify-center p-5 sm:p-7 rounded-2xl bg-white/80 hover:bg-white border border-stone-200/80 hover:border-emerald-400/80 shadow-xs hover:shadow-md transition-[border-color,background-color,box-shadow] duration-200 min-h-[96px] sm:min-h-[104px] select-none"
        >
          {/* Logo container strictly constraining dimensions & preserving aspect ratio */}
          <div className="w-full h-11 sm:h-13 flex items-center justify-center pointer-events-none">
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.name || logo.alt}
              loading="lazy"
              height={logo.height ?? 'auto'}
              width={logo.width ?? 'auto'}
              className="max-h-full max-w-[130px] sm:max-w-[150px] w-auto h-auto object-contain transition-transform duration-200 ease-out group-hover:scale-105"
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LogoCloud;
