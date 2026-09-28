import React, { forwardRef } from 'react';

export type FlowButtonVariant = 'default' | 'light' | 'amber';

export interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'button';
  variant?: FlowButtonVariant;
}

export interface FlowLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  as: 'a';
  variant?: FlowButtonVariant;
}

export type FlowComponentProps = FlowButtonProps | FlowLinkProps;

/**
 * 21st.dev Premium Flow Button Component
 *
 * Provides a subtle, GPU-accelerated flowing light sweep and refined micro-interaction
 * (scale 1.02 on hover, 0.98 on click) without causing layout shift or continuous idle animation.
 * Adapts to any color palette and respects prefers-reduced-motion.
 */
export const FlowButton = forwardRef<HTMLButtonElement, FlowButtonProps>(
  ({ className = '', variant = 'default', type = 'button', children, ...props }, ref) => {
    const variantClass =
      variant === 'light'
        ? 'flow-btn flow-btn-light'
        : variant === 'amber'
        ? 'flow-btn flow-btn-amber'
        : 'flow-btn';

    return (
      <button
        ref={ref}
        type={type}
        className={`${variantClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
FlowButton.displayName = 'FlowButton';

/**
 * 21st.dev Premium Flow Link Component (for <a> anchor CTAs)
 */
export const FlowLink = forwardRef<HTMLAnchorElement, FlowLinkProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variantClass =
      variant === 'light'
        ? 'flow-btn flow-btn-light'
        : variant === 'amber'
        ? 'flow-btn flow-btn-amber'
        : 'flow-btn';

    return (
      <a
        ref={ref}
        className={`${variantClass} ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }
);
FlowLink.displayName = 'FlowLink';

export default FlowButton;
