import type { NavCategory } from '../types';

/**
 * Category Background Video Resolver
 * Provides subtle agricultural background animation video paths
 * dynamically based on category data, attributes, or category type.
 */
export function getCategoryBgVideo(
  category?: Partial<NavCategory> | { id?: string; slug?: string; video?: string; bgVideo?: string }
): string {
  if (category?.bgVideo) return category.bgVideo;
  if (category?.video) return category.video;

  const id = (category?.id || category?.slug || '').toLowerCase();

  // Combos & ginger specialty care
  if (id.includes('combo') || id.includes('ginger') || id.includes('special')) {
    return '/assets/videos/product_display.mp4';
  }

  // Crop protection, spraying & pest management
  if (id.includes('protect') || id.includes('pest') || id.includes('insect') || id.includes('fung') || id.includes('herb')) {
    return '/assets/videos/bg_animated_video.mp4';
  }

  // Fertilizers & crop nutrition
  if (id.includes('fertiliz') || id.includes('nutri') || id.includes('soluble')) {
    return '/assets/videos/bg_animated_video.mp4';
  }

  // Seeds & sowing
  if (id.includes('seed') || id.includes('crop') || id.includes('grain') || id.includes('veg')) {
    return '/assets/videos/bg_animated_video.mp4';
  }

  // Default agricultural background loop
  return '/assets/videos/bg_animated_video.mp4';
}
