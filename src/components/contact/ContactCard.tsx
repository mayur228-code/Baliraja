import type { FC, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface ContactCardProps {
  icon: ReactNode;
  title: string;
  detail: string;
  actionText?: string;
  href?: string;
  isExternal?: boolean;
  isDisabled?: boolean;
  disabledBadge?: string;
  onClick?: () => void;
  ariaLabel: string;
  badge?: string;
}

export const ContactCard: FC<ContactCardProps> = ({
  icon,
  title,
  detail,
  actionText,
  href,
  isExternal = false,
  isDisabled = false,
  disabledBadge,
  onClick,
  ariaLabel,
  badge
}) => {
  const shouldReduceMotion = useReducedMotion();

  const motionProps = shouldReduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: false, margin: '-20px' },
        transition: { duration: 0.35, ease: 'easeOut' as const }
      };

  const cardContent = (
    <div className="p-5 sm:p-6 rounded-2xl bg-white/85 backdrop-blur-md border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_rgba(5,150,105,0.08)] hover:border-emerald-300/80 transition-all flex flex-col justify-between h-full space-y-4 group">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 group-hover:bg-emerald-100/80 transition-transform">
            {icon}
          </div>

          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              {badge}
            </span>
          )}

          {isDisabled && disabledBadge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
              {disabledBadge}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-stone-400 block">
            {title}
          </span>
          <p className="text-sm sm:text-base font-black font-serif text-stone-900 group-hover:text-emerald-900 transition-colors break-words">
            {detail}
          </p>
        </div>
      </div>

      {/* Action Prompt */}
      {actionText && (
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-700">
          <span>{actionText}</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  if (isDisabled) {
    return (
      <motion.div {...motionProps} className="h-full cursor-not-allowed opacity-85 select-none" aria-label={ariaLabel}>
        {cardContent}
      </motion.div>
    );
  }

  if (href) {
    return (
      <motion.a
        {...motionProps}
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="block h-full cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden rounded-2xl"
        aria-label={ariaLabel}
      >
        {cardContent}
      </motion.a>
    );
  }

  return (
    <motion.button
      {...motionProps}
      type="button"
      onClick={onClick}
      className="block w-full text-left h-full cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:outline-hidden rounded-2xl"
      aria-label={ariaLabel}
    >
      {cardContent}
    </motion.button>
  );
};
