import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Language, NavCategory } from "../../types";
import { getCategoryIconComponent } from "../../lib/categoryIcons";

export type BadgeImage = { src: string; alt: string };

export interface ImagesBadgeProps {
  images: BadgeImage[];
  /** Images shown in collapsed state. @default 3 */
  maxVisible?: number;
  /** Additional images revealed on hover. @default 2 */
  revealCount?: number;
  /** Optional text label after the stack. */
  label?: string;
  size?: "sm" | "md" | "lg";
  /** Image shape. @default "rounded" */
  shape?: "circle" | "rounded" | "square";
  className?: string;
  imageClassName?: string;
  onClick?: () => void;
}

// ── Size tokens for Badge avatar variant ──────────────────────────────────────
const CFG = {
  sm: {
    px: 32,
    gap: 8,
    pill: "h-9 pl-2 pr-3.5 gap-2 text-[11px]",
    cnt: "text-[9px]",
  },
  md: {
    px: 42,
    gap: 10,
    pill: "h-11 pl-2.5 pr-4 gap-2.5 text-xs",
    cnt: "text-[10px]",
  },
  lg: {
    px: 56,
    gap: 12,
    pill: "h-14 pl-3 pr-5 gap-3 text-sm",
    cnt: "text-[12px]",
  },
} as const;

const SHAPE: Record<string, string> = {
  circle: "rounded-full",
  rounded: "rounded-[10px]",
  square: "rounded-[4px]",
};

const SPRING = { type: "spring" as const, stiffness: 350, damping: 25, mass: 0.8 };

// ── Rotation table — gives each card a unique hand-placed feel ────────────────
const REST_ROT = [-14, -7, -2, 5, 11, -9, 3, -5] as const;
const HOVER_ROT = [-8, -4, -1, 2, 6, -6, 2, -3] as const;

// ── Category Stack Specific Motion Tokens ─────────────────────────────────────
// Deterministic 4-slot layout: Slot 0 (Seeds), Slot 1 (Fertilizers - FRONT), Slot 2 (Crop Protection), Slot 3 (Combos)
const CATEGORY_REST_ROT = [-6, 0, 5, 9] as const;
const CATEGORY_HOVER_ROT = [-3, 0, 2, 4] as const;

// ── Arc Y-offset in the spread state ────────────────
function arcY(i: number, total: number): number {
  if (total <= 1) return 0;
  const mid = (total - 1) / 2;
  const t = (i - mid) / mid; // -1 … 0 … +1
  return t * t * (CFG.md.px * 0.22); // parabola: 0 at centre, ~9px at edges
}

function categoryArcY(slotIndex: number, arcHeight: number, total: number): number {
  if (total <= 1) return 0;
  const mid = (total - 1) / 2;
  const t = (slotIndex - mid) / mid;
  return Math.round(t * t * arcHeight);
}

// ── Classic Avatar ImagesBadge Component ──────────────────────────────────────
export function ImagesBadge({
  images,
  maxVisible = 3,
  revealCount = 2,
  label,
  size = "md",
  shape = "rounded",
  className,
  imageClassName,
  onClick,
}: ImagesBadgeProps) {
  const [hovered, setHovered] = React.useState(false);
  const reduced = useReducedMotion();

  const { px, gap, pill, cnt } = CFG[size];

  const rendered = images.slice(0, maxVisible + revealCount);
  const overflow = Math.max(0, images.length - maxVisible - revealCount);
  const slots: Array<BadgeImage | null> =
    overflow > 0 ? [...rendered, null] : rendered;
  const total = slots.length;

  // ── Collapsed geometry ───────────────────────────────────────────────────
  const peekPx = Math.round(px * 0.32);
  const collapsedW = px + (Math.min(maxVisible, total) - 1) * peekPx;

  // ── Spread geometry ──────────────────────────────────────────────────────
  const spreadW = total * px + (total - 1) * gap;

  const spreadX = (i: number) => i * (px + gap);

  const collapsedX = (i: number) => {
    if (i >= maxVisible) return (maxVisible - 1) * peekPx;
    return i * peekPx;
  };

  return (
    <motion.div
      className={cn(
        "inline-flex cursor-default select-none items-center rounded-full",
        "border border-emerald-500/20 bg-stone-900/80 backdrop-blur-sm",
        "shadow-[0_2px_12px_rgba(0,0,0,.10)]",
        "transition-shadow duration-300",
        "hover:shadow-[0_6px_24px_rgba(0,0,0,.16)]",
        pill,
        onClick && "cursor-pointer",
        className,
      )}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      whileHover={reduced ? undefined : { y: -2, scale: 1.015 }}
      transition={SPRING}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      {/* ── Image strip ──────────────────────────────────────── */}
      <motion.div
        className="relative shrink-0"
        style={{ height: px + 12 }}
        animate={{
          width: reduced ? collapsedW : hovered ? spreadW : collapsedW,
        }}
        transition={SPRING}
      >
        {slots.map((slot, i) => {
          const isHidden = i >= maxVisible && slot !== null;
          const isOverflow = slot === null;

          const tx = hovered ? spreadX(i) : collapsedX(i);
          const ty = hovered ? arcY(i, total) : 0;
          const rotate = reduced
            ? 0
            : hovered
              ? (HOVER_ROT[i] ?? 0)
              : (REST_ROT[i] ?? 0);
          const opacity = isHidden ? (hovered ? 1 : 0) : 1;
          const scale = isHidden ? (hovered ? 1 : 0.6) : 1;
          const zIdx = hovered ? i + 1 : total - i;

          return (
            <motion.div
              key={i}
              className={cn(
                "absolute top-0 left-0 flex shrink-0 items-center justify-center",
                !isOverflow && "overflow-hidden",
                SHAPE[isOverflow ? "circle" : shape],
                "border-2 border-stone-950",
                "shadow-[0_2px_8px_rgba(0,0,0,.28)]",
                isOverflow && "bg-stone-800",
                imageClassName,
              )}
              style={{ width: px, height: px, zIndex: zIdx }}
              animate={{
                x: reduced ? spreadX(i) : tx,
                y: reduced ? 0 : ty,
                rotate: rotate,
                opacity,
                scale,
              }}
              transition={{
                ...SPRING,
                delay: !reduced && isHidden ? (i - maxVisible) * 0.06 : 0,
              }}
            >
              {isOverflow ? (
                <span
                  className={cn("font-semibold text-stone-300", cnt)}
                >
                  +{overflow}
                </span>
              ) : (
                <img
                  src={slot!.src}
                  alt={slot!.alt}
                  width={px}
                  height={px}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Label ─────────────────────────────────────────────── */}
      {label && (
        <span className="whitespace-nowrap font-medium text-stone-200 leading-none">
          {label}
        </span>
      )}
    </motion.div>
  );
}

// ── Category Stack Expanding Interaction (ImagesBadge Motion Model) ───────────

export interface CategoryImagesBadgeProps {
  categories: NavCategory[];
  lang: Language;
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

// Responsive layout parameters for the expanding card stack
function getResponsiveCategoryLayout(windowWidth: number, isExpanded: boolean) {
  if (windowWidth < 380) {
    // 320px - 375px
    const cardWidth = isExpanded ? 64 : 140;
    const cardHeight = isExpanded ? 100 : 180;
    const gap = 6;
    const arcHeight = 4;
    return { cardWidth, cardHeight, gap, arcHeight, isMobile: true };
  }
  if (windowWidth < 480) {
    // 380px - 480px (e.g. 430px)
    const cardWidth = isExpanded ? 80 : 160;
    const cardHeight = isExpanded ? 120 : 200;
    const gap = 8;
    const arcHeight = 6;
    return { cardWidth, cardHeight, gap, arcHeight, isMobile: true };
  }
  if (windowWidth < 640) {
    // 480px - 640px
    const cardWidth = isExpanded ? 100 : 170;
    const cardHeight = isExpanded ? 145 : 210;
    const gap = 10;
    const arcHeight = 8;
    return { cardWidth, cardHeight, gap, arcHeight, isMobile: true };
  }
  if (windowWidth < 768) {
    // 640px - 768px
    const cardWidth = 125;
    const cardHeight = 175;
    const gap = 12;
    const arcHeight = 10;
    return { cardWidth, cardHeight, gap, arcHeight, isMobile: false };
  }
  if (windowWidth < 1024) {
    // 768px - 1024px
    const cardWidth = 155;
    const cardHeight = 215;
    const gap = 16;
    const arcHeight = 14;
    return { cardWidth, cardHeight, gap, arcHeight, isMobile: false };
  }
  // >= 1024px
  const cardWidth = 195;
  const cardHeight = 265;
  const gap = 20;
  const arcHeight = 16;
  return { cardWidth, cardHeight, gap, arcHeight, isMobile: false };
}

const CATEGORY_FAST_TRANSITION = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };

export function CategoryImagesBadge({
  categories,
  lang,
  selectedCategory,
  onSelectCategory,
  className,
}: CategoryImagesBadgeProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = React.useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState<number>(() => {
    if (typeof window !== "undefined") return window.innerWidth;
    return 1200;
  });

  const stackContainerRef = React.useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Listen to window resize for responsive card dimensions
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Collapse on mobile tap outside
  React.useEffect(() => {
    if (!isMobileExpanded) return;
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (
        stackContainerRef.current &&
        !stackContainerRef.current.contains(e.target as Node)
      ) {
        setIsMobileExpanded(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [isMobileExpanded]);

  const isExpanded = isHovered || isMobileExpanded || isKeyboardFocused;

  const { cardWidth, cardHeight, gap, arcHeight, isMobile } =
    getResponsiveCategoryLayout(windowWidth, isExpanded);

  const slots = React.useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      image: cat.image || `/assets/categories/${cat.id}.png`,
    }));
  }, [categories]);

  // Spread and Collapsed bounds
  const total = slots.length;
  const step = cardWidth + gap;
  const spreadW = total * cardWidth + Math.max(0, total - 1) * gap;
  const collapsedW = isMobile ? cardWidth : cardWidth + 24;
  const containerW = isExpanded ? spreadW + 32 : collapsedW + 32;
  const containerH = cardHeight + 48;

  const isSmallMobile = isMobile && isExpanded && cardWidth < 90;
  const isMediumMobile = isMobile && isExpanded && cardWidth >= 90;

  return (
    <div className={cn("relative flex items-center justify-center w-full select-none py-2", className)}>
      {/* ── Hover / Touch Boundary Container ─────────────────────────────────── */}
      <motion.div
        ref={stackContainerRef}
        className="relative flex items-center justify-center touch-manipulation"
        style={{
          height: containerH,
        }}
        animate={{
          width: containerW,
        }}
        transition={CATEGORY_FAST_TRANSITION}
        onPointerEnter={() => {
          if (!isMobile) setIsHovered(true);
        }}
        onPointerLeave={() => {
          if (!isMobile) setIsHovered(false);
        }}
        onFocusCapture={() => setIsKeyboardFocused(true)}
        onBlurCapture={(e) => {
          if (!stackContainerRef.current?.contains(e.relatedTarget as Node)) {
            setIsKeyboardFocused(false);
          }
        }}
      >
        {slots.map((item, slotIndex) => {
          const isSelected = selectedCategory === item.category.id;
          const frontIndex = Math.min(1, Math.max(0, Math.floor((total - 1) / 2)));
          const isFront = slotIndex === frontIndex;
          const isFeatured = Boolean(item.category.featured || item.category.highlight);
          const title = lang === "mr" ? item.category.nameMr : item.category.name;

          // Position geometry
          const mid = (total - 1) / 2;
          const t = total <= 1 ? 0 : (slotIndex - mid) / (mid || 1);
          const targetX = isExpanded ? (slotIndex - mid) * step : 0;
          const targetY = isExpanded ? categoryArcY(slotIndex, arcHeight, total) : 0;

          const defaultHoverRot = Math.round(t * 4);
          const defaultRestRot = Math.round(t * 8);
          const targetRot = shouldReduceMotion
            ? 0
            : isExpanded
              ? (total === 4 && CATEGORY_HOVER_ROT[slotIndex] !== undefined ? CATEGORY_HOVER_ROT[slotIndex] : defaultHoverRot)
              : (total === 4 && CATEGORY_REST_ROT[slotIndex] !== undefined ? CATEGORY_REST_ROT[slotIndex] : defaultRestRot);

          // Z-index depth: front card has highest priority in collapsed state
          const zIdx = isExpanded
            ? 10
            : isFront
              ? 16
              : 10 - slotIndex;

          const FallbackIcon = getCategoryIconComponent(item.category.icon || item.category.id);

          return (
            <motion.div
              key={item.category.id}
              className={cn(
                "group absolute flex flex-col items-center justify-between cursor-pointer select-none will-change-transform",
                // Translucent Frosted Glass Spec
                "bg-white/45 sm:bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-3xl",
                "border border-white/60",
                "shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
                "transition-[border-color,background-color] duration-150 ease-out",
                "hover:border-white/80 hover:bg-white/55",
                isSelected && "bg-white/65 border-emerald-500/90 ring-2 ring-emerald-500/50 shadow-[0_12px_32px_rgba(5,150,105,0.22)]",
                isSmallMobile ? "p-1.5" : isMediumMobile ? "p-2.5" : "p-3.5 sm:p-4"
              )}
              style={{
                width: cardWidth,
                height: cardHeight,
                left: "50%",
                top: "50%",
                marginLeft: -(cardWidth / 2),
                marginTop: -(cardHeight / 2),
                transform: 'translate3d(0, 0, 0)',
              }}
              animate={{
                x: targetX,
                y: targetY,
                rotate: targetRot,
                zIndex: zIdx,
              }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 1.03,
                      y: targetY - 4,
                      zIndex: 30,
                      transition: { duration: 0.12, ease: "easeOut" }
                    }
              }
              whileTap={{ scale: 0.98, transition: { duration: 0.08 } }}
              transition={CATEGORY_FAST_TRANSITION}
              role="button"
              tabIndex={0}
              aria-label={title}
              aria-pressed={isSelected}
              onClick={(e) => {
                e.stopPropagation();
                if (isMobile && !isExpanded) {
                  // On mobile, first tap expands the stack
                  setIsMobileExpanded(true);
                  return;
                }
                // When already expanded (or desktop click), select the category
                onSelectCategory(item.category.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCategory(item.category.id);
                }
              }}
            >
              {/* Featured Badge */}
              {isFeatured && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 pointer-events-none flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white backdrop-blur-md shadow-[0_2px_8px_rgba(245,158,11,0.35)] border border-amber-200/60">
                  <Sparkles className="w-2.5 h-2.5 text-amber-100" />
                  <span className="text-[9px] sm:text-3xs font-extrabold uppercase tracking-wider leading-none">
                    {lang === "mr" ? "विशेष" : "Featured"}
                  </span>
                </div>
              )}

              {/* ── Category Product Artwork Container (Translucent Soft Glass Well) ── */}
              <div className="relative w-full flex-1 flex items-center justify-center bg-white/25 backdrop-blur-xs rounded-xl sm:rounded-2xl p-1.5 sm:p-3 overflow-hidden border border-white/35">
                <img
                  src={item.image}
                  alt={title}
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-contain group-hover:scale-104 transition-transform duration-150 ease-out select-none"
                  onError={(e) => {
                    const imgEl = e.currentTarget;
                    imgEl.style.display = "none";
                    const fallbackEl = imgEl.parentElement?.querySelector(".cat-fallback");
                    if (fallbackEl) (fallbackEl as HTMLElement).style.display = "flex";
                  }}
                />
                <div className="cat-fallback hidden items-center justify-center p-2">
                  <FallbackIcon className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-600" aria-hidden="true" />
                </div>
              </div>

              {/* ── Strictly Single-Language Category Name (Image + Name ONLY) ── */}
              <div className="w-full text-center mt-2 sm:mt-2.5 px-0.5 shrink-0">
                <h3
                  className={cn(
                    "font-bold font-serif tracking-tight leading-tight transition-colors duration-200 text-center text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]",
                    isSelected
                      ? "text-emerald-950 font-extrabold"
                      : "text-stone-950 group-hover:text-emerald-950",
                    isSmallMobile
                      ? "text-[9px] line-clamp-2"
                      : isMediumMobile
                        ? "text-xs line-clamp-2"
                        : "text-xs sm:text-sm md:text-base line-clamp-2"
                  )}
                >
                  {title}
                </h3>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default ImagesBadge;
