import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
  type FC,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';
import {
  ProgressSliderContext,
  useProgressSliderContext,
} from './progressive-carousel-context';

// Component props interfaces
export interface ProgressSliderProps {
  children: ReactNode;
  duration?: number;
  vertical?: boolean;
  activeSlider: string;
  sliderValues?: string[];
  className?: string;
  onSlideChange?: (value: string) => void;
}

export interface SliderContentProps {
  children: ReactNode;
  className?: string;
}

export interface SliderWrapperProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export interface ProgressBarProps {
  children: ReactNode;
  className?: string;
}

export interface SliderBtnProps {
  children: ReactNode;
  value: string;
  className?: string;
  progressBarClass?: string;
}

/**
 * Highly Optimized Hardware-Accelerated ProgressSlider Component.
 * - ZERO per-frame React setState calls (avoids CPU/render-pipeline bottleneck).
 * - Progress bar is 100% GPU-compositor animated via CSS transform: scaleX(0) -> scaleX(1).
 * - Single-shot clean timer for automatic progression.
 * - Instantaneous (0ms) response on slide clicks with immediate progress reset.
 * - Smooth GPU-accelerated opacity crossfade (350ms, ease-out).
 * - Fully respects prefers-reduced-motion.
 */
export const ProgressSlider: FC<ProgressSliderProps> = ({
  children,
  duration = 5000,
  vertical = false,
  activeSlider,
  sliderValues: explicitSliderValues,
  className,
  onSlideChange,
}) => {
  const [active, setActive] = useState<string>(activeSlider);
  const [prevActiveSliderProp, setPrevActiveSliderProp] = useState(activeSlider);

  // Sync state if activeSlider prop changes from parent
  if (activeSlider !== prevActiveSliderProp) {
    setPrevActiveSliderProp(activeSlider);
    setActive(activeSlider);
  }

  // Derive slider values during render without setState in effects
  const sliderValues = useMemo(() => {
    if (explicitSliderValues && explicitSliderValues.length > 0) {
      return explicitSliderValues;
    }

    const childrenArray = React.Children.toArray(children);
    const contentChild = childrenArray.find(
      (child) =>
        React.isValidElement(child) &&
        (child.type === SliderContent ||
          (child.props as Record<string, unknown>)?.['data-slot'] === 'slider-content')
    ) as React.ReactElement<{ children: ReactNode }> | undefined;

    if (contentChild && contentChild.props.children) {
      return React.Children.toArray(contentChild.props.children)
        .filter(React.isValidElement)
        .map((child) => (child.props as { value?: string }).value)
        .filter((val): val is string => Boolean(val));
    }
    return [];
  }, [children, explicitSliderValues]);

  // Auto-recover active value if removed or out of bounds
  useEffect(() => {
    if (sliderValues.length > 0 && !sliderValues.includes(active)) {
      const fallback = sliderValues[0];
      if (fallback) {
        setActive(fallback);
        onSlideChange?.(fallback);
      }
    }
  }, [sliderValues, active, onSlideChange]);

  // Clean, lightweight single-shot timer for auto-progression
  useEffect(() => {
    if (sliderValues.length <= 1) return;

    const timer = setTimeout(() => {
      const currentIndex = sliderValues.indexOf(active);
      const nextIndex = (currentIndex + 1) % sliderValues.length;
      const nextVal = sliderValues[nextIndex];
      if (nextVal) {
        setActive(nextVal);
        onSlideChange?.(nextVal);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration, sliderValues, onSlideChange]);

  // Immediate 0ms click response: cancels old timer & triggers new slide
  const handleButtonClick = useCallback((value: string) => {
    if (value !== active) {
      setActive(value);
      onSlideChange?.(value);
    }
  }, [active, onSlideChange]);

  const contextValue = useMemo(() => ({
    active,
    duration,
    handleButtonClick,
    vertical,
  }), [active, duration, handleButtonClick, vertical]);

  return (
    <ProgressSliderContext.Provider value={contextValue}>
      <div className={cn('relative', className)}>{children}</div>
    </ProgressSliderContext.Provider>
  );
};

export const SliderContent: FC<SliderContentProps> = ({
  children,
  className,
}) => {
  return (
    <div 
      data-slot="slider-content" 
      className={cn('relative overflow-hidden', className)}
    >
      {children}
    </div>
  );
};

export const SliderWrapper: FC<SliderWrapperProps> = ({
  children,
  value,
  className,
}) => {
  const { active } = useProgressSliderContext();
  const shouldReduceMotion = useReducedMotion();
  const isCurrent = active === value;

  return (
    <AnimatePresence mode="popLayout">
      {isCurrent && (
        <motion.div
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0.05 : 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ willChange: 'opacity' }}
          className={cn('w-full h-full', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SliderBtnGroup: FC<ProgressBarProps> = ({
  children,
  className,
}) => {
  return <div className={cn('', className)}>{children}</div>;
};

export const SliderBtn: FC<SliderBtnProps> = ({
  children,
  value,
  className,
  progressBarClass,
}) => {
  const { active, duration, handleButtonClick, vertical } =
    useProgressSliderContext();
  const shouldReduceMotion = useReducedMotion();

  const isCurrent = active === value;

  return (
    <button
      type="button"
      className={cn(
        'relative transition-opacity duration-200 text-left outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 select-none cursor-pointer',
        isCurrent ? 'opacity-100' : 'opacity-65 hover:opacity-90',
        className
      )}
      onClick={() => handleButtonClick(value)}
      aria-selected={isCurrent}
    >
      {children}
      <div
        className="absolute inset-0 overflow-hidden -z-10 max-h-full max-w-full rounded-[inherit] pointer-events-none"
        role="progressbar"
        aria-valuenow={isCurrent ? 100 : 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {isCurrent && (
          <span
            key={active}
            className={cn(
              vertical ? 'progress-fill-vertical' : 'progress-fill-horizontal',
              'absolute inset-0',
              progressBarClass
            )}
            style={{
              animation: shouldReduceMotion
                ? 'none'
                : `${vertical ? 'progressFillVertical' : 'progressFillHorizontal'} ${duration}ms linear forwards`,
            }}
          />
        )}
      </div>
    </button>
  );
};
