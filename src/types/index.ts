export type Language = 'mr' | 'en';

export type NavSection = 'products' | 'about' | 'contact' | 'calculators';

export type ProductAvailability = 'available' | 'out_of_stock';

export type ProductSortOption = 'featured' | 'name-asc' | 'name-desc';

export interface NavSubcategory {
  id: string;
  name: string;
  nameMr: string;
  description?: string;
  descriptionMr?: string;
}

export interface NavCategory {
  id: string;
  slug?: string;
  name: string;
  nameMr: string;
  image?: string;
  icon?: string;
  video?: string;
  bgVideo?: string;
  shortDesc?: string;
  shortDescMr?: string;
  subcategories: NavSubcategory[];
  highlight?: boolean;
  featured?: boolean;
  order: number;
  active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  order: number;
}

export interface Product {
  id: string;
  slug: string;
  nameEnglish: string;
  nameMarathi: string;
  categoryId: string;
  category?: string;
  subcategoryId?: string;
  descriptionEnglish: string;
  descriptionMarathi: string;
  image: string;
  imageUrl?: string;
  price?: number | string;
  createdAt?: string;
  availability: ProductAvailability;
  featured?: boolean;
  isBestseller?: boolean;
  popularity?: number;
  displayOrder: number;
  isSample?: boolean;
  keyPointsEnglish?: string[];
  keyPointsMarathi?: string[];
  suitableCropsEnglish?: string[];
  suitableCropsMarathi?: string[];
  translationSource?: Language;
  customTranslation?: boolean;
}

export interface FieldExperience {
  id: string;
  cropKey: string;
  cropNameEnglish: string;
  cropNameMarathi: string;
  titleEnglish: string;
  titleMarathi: string;
  summaryEnglish: string;
  summaryMarathi: string;
  observationEnglish: string;
  observationMarathi: string;
  practiceEnglish: string;
  practiceMarathi: string;
  seasonEnglish?: string;
  seasonMarathi?: string;
  stageEnglish?: string;
  stageMarathi?: string;
  categoryKey?: string;
  isSample: boolean;
  image?: string;
  relatedProductIds?: string[];
  keyInsightsEnglish?: string[];
  keyInsightsMarathi?: string[];
  translationSource?: Language;
  customTranslation?: boolean;
}

export interface CropCalculatorProfile {
  crop: string;
  cropMr?: string;
  recommendedNPKPerAcre: { n: number; p: number; k: number };
  ureaBags: number;
  dapBags: number;
  mopBags: number;
  avgYieldPerAcre: number;
  avgPrice: number;
  costPerAcre: number;
}

export interface CalculatorState {
  crop: string;
  acres: number;
  soilType: string;
  targetYield?: number;
}

export interface BusinessContactInfo {
  name: string;
  nameMr: string;
  phonePlaceholder: string;
  whatsappPlaceholder: string;
  addressPlaceholder: string;
  addressPlaceholderMr: string;
  timingPlaceholder: string;
  timingPlaceholderMr: string;
}

export interface OwnerProfile {
  name: string;
  nameMr: string;
  village: {
    en: string;
    mr: string;
  };
  role: {
    en: string;
    mr: string;
  };
  bio: {
    en: string;
    mr: string;
  };
  experience?: {
    en: string;
    mr: string;
  };
  image?: string;
  isDemoContent?: boolean;
}

export interface BusinessStoryPrinciple {
  id: string;
  titleEn: string;
  titleMr: string;
  descriptionEn: string;
  descriptionMr: string;
  iconName: 'ShieldCheck' | 'BookOpen' | 'Users' | 'MapPin' | 'Repeat';
}

export interface LocationInfo {
  addressEn: string;
  addressMr: string;
  cityEn: string;
  cityMr: string;
  districtEn: string;
  districtMr: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  googleMapsEmbedUrl: string;
  googleMapsExternalUrl: string;
}

export interface SocialMediaLinks {
  whatsapp: string;
  instagramUrl?: string;
  instagramHandle?: string;
}

export interface VerifiedBusinessInfo {
  businessNameEn: string;
  businessNameMr: string;
  taglineEn: string;
  taglineMr: string;
  ownerNameEn: string;
  ownerNameMr: string;
  nativePlaceEn: string;
  nativePlaceMr: string;
  shopAddressEn: string;
  shopAddressMr: string;
  phone: string;
  whatsapp: string;
  email: string;
  otherBusinessNameEn: string;
  otherBusinessNameMr: string;
  otherBusinessNoteEn?: string;
  otherBusinessNoteMr?: string;
  location: LocationInfo;
  social: SocialMediaLinks;
}

export interface FieldVisitItem {
  id: string;
  titleEn: string;
  titleMr: string;
  imageSrc: string;
  altEn?: string;
  altMr?: string;
  tagEn?: string;
  tagMr?: string;
  descriptionEn?: string;
  descriptionMr?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FarmerResult {
  id: string;
  image: string;
  name: {
    en: string;
    mr: string;
  };
  location: {
    en: string;
    mr: string;
  };
  nameEn?: string;
  nameMr?: string;
  locationEn?: string;
  locationMr?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

