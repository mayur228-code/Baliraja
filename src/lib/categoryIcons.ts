import type { ComponentType } from 'react';
import { 
  Wheat, 
  Sprout, 
  ShieldCheck, 
  Sparkles, 
  Droplets, 
  Leaf, 
  Layers, 
  Tractor, 
  Wrench, 
  Flower2, 
  Package, 
  Sun,
  Boxes
} from 'lucide-react';

export interface CategoryIconOption {
  id: string;
  nameEn: string;
  nameMr: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export const AVAILABLE_CATEGORY_ICONS: CategoryIconOption[] = [
  { id: 'Wheat', nameEn: 'Wheat / Fertilizers (खते)', nameMr: 'खते / अन्नद्रव्ये', icon: Wheat },
  { id: 'Sprout', nameEn: 'Sprout / Seeds (बियाणे)', nameMr: 'बियाणे / रोपे', icon: Sprout },
  { id: 'ShieldCheck', nameEn: 'Shield / Crop Protection (कीटकनाशके)', nameMr: 'पीक संरक्षण', icon: ShieldCheck },
  { id: 'Sparkles', nameEn: 'Sparkles / Combos (विशेष किट्स)', nameMr: 'विशेष कॉम्बो किट्स', icon: Sparkles },
  { id: 'Droplets', nameEn: 'Droplets / Irrigation (ठिबक व पाणी)', nameMr: 'ठिबक सिंचन व पाणी', icon: Droplets },
  { id: 'Leaf', nameEn: 'Leaf / Bio & Organic (सेंद्रिय व जैविक)', nameMr: 'सेंद्रिय व जैविक', icon: Leaf },
  { id: 'Tractor', nameEn: 'Tractor / Machinery (शेती यंत्रे)', nameMr: 'यंत्रसामग्री', icon: Tractor },
  { id: 'Wrench', nameEn: 'Tools / Hardware (शेती अवजारे)', nameMr: 'कृषी अवजारे', icon: Wrench },
  { id: 'Flower2', nameEn: 'Flower / Horticulture (भाजीपाला व फुले)', nameMr: 'फुलशेती व फळबागा', icon: Flower2 },
  { id: 'Boxes', nameEn: 'Boxes / Kits (पॅकेजेस)', nameMr: 'पॅकेजेस व संच', icon: Boxes },
  { id: 'Sun', nameEn: 'Sun / Greenhouse (सूर्यप्रकाश व हरितगृह)', nameMr: 'हरितगृह व हवामान', icon: Sun },
  { id: 'Layers', nameEn: 'Layers / General Inputs (सर्वसाधारण)', nameMr: 'कृषी निविष्ठा', icon: Layers },
];

/**
 * Returns a robust Lucide icon component for any category based on its icon name or ID.
 * Guarantees a clean, agricultural fallback so missing or custom icons never break the UI.
 */
export function getCategoryIconComponent(iconNameOrId?: string): ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }> {
  if (!iconNameOrId) return Layers;
  
  const clean = iconNameOrId.toLowerCase().trim();
  
  // Exact name or ID matches
  if (clean === 'wheat' || clean === 'fertilizer' || clean === 'fertilizers') return Wheat;
  if (clean === 'sprout' || clean === 'seed' || clean === 'seeds') return Sprout;
  if (clean === 'shieldcheck' || clean === 'shield' || clean === 'shieldalert' || clean === 'crop-protection' || clean === 'pesticides' || clean === 'pesticide') return ShieldCheck;
  if (clean === 'sparkles' || clean === 'sparkle' || clean === 'combos' || clean === 'combo-kits' || clean === 'ginger') return Sparkles;
  if (clean === 'droplets' || clean === 'droplet' || clean === 'drip' || clean === 'water' || clean === 'irrigation') return Droplets;
  if (clean === 'leaf' || clean === 'organic' || clean === 'bio' || clean === 'foliar') return Leaf;
  if (clean === 'tractor' || clean === 'machinery' || clean === 'machine') return Tractor;
  if (clean === 'wrench' || clean === 'tools' || clean === 'tool' || clean === 'hardware') return Wrench;
  if (clean === 'flower2' || clean === 'flower' || clean === 'horticulture') return Flower2;
  if (clean === 'boxes' || clean === 'box' || clean === 'kit' || clean === 'kits') return Boxes;
  if (clean === 'sun' || clean === 'greenhouse' || clean === 'weather') return Sun;
  if (clean === 'package') return Package;
  if (clean === 'layers') return Layers;

  // Partial semantic matches
  if (clean.includes('seed')) return Sprout;
  if (clean.includes('fertiliz') || clean.includes('nutri') || clean.includes('khat')) return Wheat;
  if (clean.includes('protect') || clean.includes('pest') || clean.includes('fungi') || clean.includes('herbi')) return ShieldCheck;
  if (clean.includes('combo') || clean.includes('kit') || clean.includes('special')) return Sparkles;
  if (clean.includes('drip') || clean.includes('irrigat') || clean.includes('water') || clean.includes('spray')) return Droplets;
  if (clean.includes('bio') || clean.includes('organic') || clean.includes('plant')) return Leaf;
  if (clean.includes('tract') || clean.includes('machin')) return Tractor;
  if (clean.includes('tool')) return Wrench;

  return Layers;
}
