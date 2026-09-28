import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight hook to automatically pause HTML5 videos when they are scrolled out of the viewport
 * and resume playback when they become visible.
 * Conserves CPU/GPU decode resources and prevents scroll lag.
 */
export function useVideoVisibility(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  threshold = 0.15
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;

    let isManuallyPaused = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!isManuallyPaused && video.paused) {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {});
              }
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        }
      },
      {
        threshold,
        rootMargin: '100px 0px 100px 0px',
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [videoRef, threshold]);
}

/**
 * Lightweight hook to check if an element is in viewport once,
 * perfect for lazy mounting heavy subtrees (like Maps).
 */
export function useLazyMount(rootMargin = '250px') {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined' || isMounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsMounted(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, isMounted]);

  return { containerRef, isMounted };
}
