import { useState } from 'react';
import type { FC, ImgHTMLAttributes } from 'react';
import { Package, MapPin } from 'lucide-react';
import type { Language } from '../../types';

/**
 * ─────────────────────────────────────────────────────────────
 * 1. Global Brand Page Loader (First Load / Critical Suspense)
 * ─────────────────────────────────────────────────────────────
 */
interface BrandPageLoaderProps {
  lang?: Language;
  message?: string;
}

export const BrandPageLoader: FC<BrandPageLoaderProps> = ({
  lang = 'mr',
  message
}) => {
  const defaultText = lang === 'mr' ? 'बळीराजा लोड होत आहे...' : 'Loading Baliraja...';
  const displayMessage = message || defaultText;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-50/95 backdrop-blur-md select-none"
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      <div className="relative flex flex-col items-center gap-4">
        {/* Glowing Halo */}
        <div className="relative flex items-center justify-center">
          <div 
            className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-500/15 animate-ping"
            style={{ animationDuration: '2.5s' }}
            aria-hidden="true"
          />
          <div 
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-2 border-2 border-emerald-600/30 shadow-[0_8px_30px_rgba(4,120,87,0.18)] flex items-center justify-center overflow-hidden"
          >
            <img
              src="/assets/logo.png"
              alt="Baliraja"
              className="w-full h-full object-contain rounded-full transition-transform"
            />
          </div>
        </div>

        {/* Loading Message & Subtle Dots */}
        <div className="flex flex-col items-center space-y-1.5 text-center">
          <p className="font-serif text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
            {displayMessage}
          </p>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 2. Brand Route Loader (Fast Sub-page Transition State)
 * ─────────────────────────────────────────────────────────────
 */
export const BrandRouteLoader: FC<{ lang?: Language; minHeight?: string }> = ({
  lang = 'mr',
  minHeight = 'min-h-[400px]'
}) => {
  return (
    <div 
      className={`w-full ${minHeight} flex flex-col items-center justify-center p-8 select-none`}
      role="status"
      aria-live="polite"
      aria-label={lang === 'mr' ? 'लोड होत आहे...' : 'Loading...'}
    >
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-12 h-12 rounded-full bg-white p-1 border border-emerald-500/30 shadow-md flex items-center justify-center animate-pulse">
          <img
            src="/assets/logo.png"
            alt="Baliraja Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>
      <p className="text-xs font-semibold text-stone-500 font-serif tracking-tight">
        {lang === 'mr' ? 'कृपया प्रतीक्षा करा...' : 'Please wait...'}
      </p>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 3. Product Skeleton Card & Grid (Matching ProductCard.tsx)
 * ─────────────────────────────────────────────────────────────
 */
export const ProductSkeletonCard: FC = () => {
  return (
    <div 
      className="bg-white/80 rounded-2xl sm:rounded-3xl border border-stone-200/80 p-0 flex flex-col overflow-hidden shadow-xs pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Product Image Area Skeleton */}
      <div className="relative w-full aspect-square bg-stone-100/80 p-5 flex items-center justify-center border-b border-stone-100 skeleton-shimmer" />

      {/* Body Area Skeleton */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Title line 1 */}
          <div className="h-4 sm:h-4.5 w-4/5 rounded-md skeleton-shimmer" />
          {/* Title line 2 */}
          <div className="h-3.5 w-3/5 rounded-md skeleton-shimmer" />
        </div>

        {/* Price & Status Row Skeleton */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 mt-auto">
          {/* Price badge */}
          <div className="h-5 w-20 rounded-md skeleton-shimmer" />
          {/* Status pill */}
          <div className="h-5 w-16 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const ProductSkeletonGrid: FC<{ count?: number; columnsClass?: string }> = ({
  count = 4,
  columnsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
}) => {
  return (
    <div 
      className={`grid ${columnsClass} gap-5 sm:gap-6 w-full`}
      aria-label="Loading products..."
    >
      {Array.from({ length: count }).map((_, idx) => (
        <ProductSkeletonCard key={`product-skeleton-${idx}`} />
      ))}
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 4. Category Skeleton Grid & Card
 * ─────────────────────────────────────────────────────────────
 */
export const CategorySkeletonCard: FC = () => {
  return (
    <div 
      className="h-[200px] sm:h-[240px] rounded-3xl bg-white/60 border border-stone-200/80 p-5 flex flex-col items-center justify-center space-y-3 skeleton-shimmer"
      aria-hidden="true"
    >
      <div className="w-14 h-14 rounded-2xl bg-stone-200/70 skeleton-shimmer" />
      <div className="h-5 w-28 rounded-md skeleton-shimmer" />
      <div className="h-3.5 w-20 rounded-md skeleton-shimmer" />
    </div>
  );
};

export const CategorySkeletonGrid: FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mx-auto" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <CategorySkeletonCard key={`cat-skeleton-${idx}`} />
      ))}
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 5. Field Visit Skeleton
 * ─────────────────────────────────────────────────────────────
 */
export const FieldVisitSkeleton: FC = () => {
  return (
    <div 
      className="w-full max-w-5xl mx-auto h-[360px] sm:h-[460px] rounded-3xl bg-stone-100 border border-stone-200/80 p-4 flex flex-col justify-between skeleton-shimmer"
      aria-hidden="true"
    >
      <div className="h-6 w-32 rounded-full skeleton-shimmer-emerald" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2 rounded-2xl bg-white/40">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 6. Map Skeleton Loader (For Leaflet Map Lazy Fallback)
 * ─────────────────────────────────────────────────────────────
 */
export const MapSkeleton: FC<{ className?: string }> = ({
  className = 'w-full h-full min-h-[340px] sm:min-h-[380px] lg:min-h-[420px]'
}) => {
  return (
    <div 
      className={`${className} rounded-3xl bg-stone-100/90 border border-stone-200 flex flex-col items-center justify-center p-6 text-stone-400 skeleton-shimmer`}
      aria-hidden="true"
    >
      <div className="w-12 h-12 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-2 animate-bounce">
        <MapPin className="w-6 h-6" />
      </div>
      <div className="h-4 w-36 rounded-md bg-stone-200 skeleton-shimmer mb-1" />
      <div className="h-3 w-48 rounded-md bg-stone-200 skeleton-shimmer" />
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 7. Admin Table Skeleton Loader
 * ─────────────────────────────────────────────────────────────
 */
export const AdminTableSkeleton: FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full rounded-2xl bg-white border border-stone-200 overflow-hidden" aria-hidden="true">
      <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
        <div className="h-5 w-32 rounded-md skeleton-shimmer" />
        <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
      </div>
      <div className="divide-y divide-stone-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`admin-row-${i}`} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 sm:w-48 rounded-md skeleton-shimmer" />
                <div className="h-3 w-24 rounded-md skeleton-shimmer" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-16 rounded-lg skeleton-shimmer" />
              <div className="h-7 w-7 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 8. ImageWithFallback Component (Zero-layout-shift image loader)
 * ─────────────────────────────────────────────────────────────
 */
interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: FC<{ className?: string }>;
  containerClassName?: string;
}

export const ImageWithFallback: FC<ImageWithFallbackProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackIcon: FallbackIcon = Package,
  loading = 'lazy',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div 
        className={`w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 ${containerClassName}`}
        aria-label={alt}
      >
        <FallbackIcon className="w-8 h-8 opacity-60" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${containerClassName}`}>
      {/* Subtle Shimmer Placeholder until Loaded */}
      {!loaded && (
        <div 
          className="absolute inset-0 skeleton-shimmer z-0" 
          aria-hidden="true" 
        />
      )}

      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`${className} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
