import fs from 'node:fs';
import path from 'node:path';
import type {
  Product,
  NavCategory,
  Brand,
  FieldVisitItem,
  FieldExperience,
  FarmerResult,
  VerifiedBusinessInfo,
  OwnerProfile
} from '../src/types/index';
import { sampleProducts } from '../src/data/productData';
import { defaultCategories } from '../src/data/navigationData';
import { fieldVisitItems as defaultFieldVisits } from '../src/data/fieldVisitsData';
import { fieldExperiences as defaultFieldExperiences } from '../src/data/fieldExperienceData';
import { defaultFarmerResults } from '../src/data/resultsData';
import { verifiedBusinessInfo as defaultBusinessInfo, ownerProfile as defaultOwnerProfile } from '../src/data/aboutData';
import { saveBase64ImageSync } from './storageService';
import { getSupabaseAdmin, isSupabaseServerConfigured } from './supabaseClient';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actionEn: string;
  actionMr: string;
  itemType: 'product' | 'category' | 'brand' | 'field-visit' | 'field-experience' | 'result' | 'about' | 'contact' | 'system';
  performedBy: string;
}

export interface ServerContentData {
  products: Product[];
  categories: NavCategory[];
  brands: Brand[];
  fieldVisits: FieldVisitItem[];
  fieldExperiences: FieldExperience[];
  results: FarmerResult[];
  businessInfo: VerifiedBusinessInfo;
  ownerProfile: OwnerProfile;
  auditLog: AdminAuditEntry[];
  version: number;
  lastModified: string;
}

const CONTENT_DIR = path.resolve(process.cwd(), 'server/data');
const CONTENT_FILE = path.join(CONTENT_DIR, 'content.json');

function initDefaultContent(): ServerContentData {
  return {
    products: sampleProducts,
    categories: defaultCategories,
    brands: [],
    fieldVisits: defaultFieldVisits.map((v, i) => ({ ...v, order: i + 1 })),
    fieldExperiences: defaultFieldExperiences,
    results: defaultFarmerResults.map((r, i) => ({ ...r, order: i + 1 })),
    businessInfo: defaultBusinessInfo,
    ownerProfile: defaultOwnerProfile,
    auditLog: [
      {
        id: `audit-${Date.now()}-init`,
        timestamp: new Date().toISOString(),
        actionEn: 'Initialized authoritative server content database with verified agricultural catalog',
        actionMr: 'प्रमाणित कृषी कॅटलॉगसह अधिकृत सर्व्हर सामग्री डेटाबेस सुरू केला',
        itemType: 'system',
        performedBy: 'System'
      }
    ],
    version: 4,
    lastModified: new Date().toISOString()
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE ROW MAPPERS (PostgreSQL Snake_case <-> TypeScript CamelCase)
// ─────────────────────────────────────────────────────────────────────────────

function mapCategoryFromDb(row: any): NavCategory {
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    nameMr: row.name_mr,
    image: row.image || '',
    icon: row.icon || 'Layers',
    shortDesc: row.short_desc || '',
    shortDescMr: row.short_desc_mr || '',
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
    highlight: Boolean(row.highlight),
    featured: Boolean(row.featured),
    order: typeof row.display_order === 'number' ? row.display_order : 1,
    active: row.active !== false
  };
}

function mapCategoryToDb(cat: Partial<NavCategory>): Record<string, any> {
  const isFeatured = Boolean(cat.featured || cat.highlight);
  return {
    id: cat.id,
    slug: cat.slug || cat.id,
    name: cat.name,
    name_mr: cat.nameMr || cat.name,
    image: cat.image || '',
    icon: cat.icon || 'Layers',
    short_desc: cat.shortDesc || '',
    short_desc_mr: cat.shortDescMr || '',
    subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : [],
    highlight: isFeatured,
    featured: isFeatured,
    display_order: typeof cat.order === 'number' ? cat.order : 1,
    active: cat.active !== false,
    updated_at: new Date().toISOString()
  };
}

function mapProductFromDb(row: any): Product {
  const priceVal = row.price !== null && row.price !== undefined ? Number(row.price) : undefined;
  return {
    id: row.id,
    slug: row.slug || row.id,
    nameEnglish: row.name_english,
    nameMarathi: row.name_marathi,
    categoryId: row.category_id,
    category: row.category_id,
    subcategoryId: row.subcategory_id || undefined,
    descriptionEnglish: row.description_english || '',
    descriptionMarathi: row.description_marathi || '',
    image: row.image,
    imageUrl: row.image_url || undefined,
    price: priceVal !== undefined && !isNaN(priceVal) ? priceVal : undefined,
    availability: row.availability || 'available',
    featured: Boolean(row.featured || row.is_bestseller),
    isBestseller: Boolean(row.is_bestseller || row.featured),
    popularity: typeof row.popularity === 'number' ? row.popularity : 0,
    displayOrder: typeof row.display_order === 'number' ? row.display_order : 1,
    isSample: Boolean(row.is_sample),
    keyPointsEnglish: Array.isArray(row.key_points_english) ? row.key_points_english : [],
    keyPointsMarathi: Array.isArray(row.key_points_marathi) ? row.key_points_marathi : [],
    suitableCropsEnglish: Array.isArray(row.suitable_crops_english) ? row.suitable_crops_english : [],
    suitableCropsMarathi: Array.isArray(row.suitable_crops_marathi) ? row.suitable_crops_marathi : [],
    translationSource: row.translation_source || undefined,
    customTranslation: Boolean(row.custom_translation),
    createdAt: row.created_at
  };
}

function mapProductToDb(prod: Partial<Product>): Record<string, any> {
  const isFeatured = Boolean(prod.featured || prod.isBestseller);
  let cleanPrice: number | null = null;
  if (prod.price !== undefined && prod.price !== null && prod.price !== '') {
    const num = Number(prod.price);
    if (!isNaN(num)) cleanPrice = num;
  }
  let availability: 'available' | 'out_of_stock' | 'pre_order' = 'available';
  if (prod.availability === 'out_of_stock') {
    availability = 'out_of_stock';
  } else if ((prod.availability as unknown) === 'pre_order') {
    availability = 'pre_order';
  }

  return {
    id: prod.id,
    slug: prod.slug || prod.id,
    name_english: prod.nameEnglish || 'Product',
    name_marathi: prod.nameMarathi || prod.nameEnglish || 'उत्पादन',
    category_id: prod.categoryId || (prod as any).category || 'seeds',
    subcategory_id: prod.subcategoryId || null,
    description_english: prod.descriptionEnglish || '',
    description_marathi: prod.descriptionMarathi || '',
    image: prod.image || '/assets/products/seeds/seed_1.png',
    image_url: prod.imageUrl || null,
    price: cleanPrice,
    availability,
    featured: isFeatured,
    is_bestseller: isFeatured,
    popularity: typeof prod.popularity === 'number' ? prod.popularity : 0,
    display_order: typeof prod.displayOrder === 'number' ? prod.displayOrder : 1,
    is_sample: Boolean(prod.isSample),
    key_points_english: Array.isArray(prod.keyPointsEnglish) ? prod.keyPointsEnglish : [],
    key_points_marathi: Array.isArray(prod.keyPointsMarathi) ? prod.keyPointsMarathi : [],
    suitable_crops_english: Array.isArray(prod.suitableCropsEnglish) ? prod.suitableCropsEnglish : [],
    suitable_crops_marathi: Array.isArray(prod.suitableCropsMarathi) ? prod.suitableCropsMarathi : [],
    translation_source: prod.translationSource || null,
    custom_translation: Boolean(prod.customTranslation),
    updated_at: new Date().toISOString()
  };
}

function mapBrandFromDb(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    order: typeof row.display_order === 'number' ? row.display_order : 1
  };
}

function mapBrandToDb(brand: Partial<Brand>): Record<string, any> {
  return {
    id: brand.id,
    name: brand.name || 'Brand',
    logo: brand.logo || '',
    display_order: typeof brand.order === 'number' ? brand.order : 1,
    updated_at: new Date().toISOString()
  };
}

function mapFieldVisitFromDb(row: any): FieldVisitItem {
  return {
    id: row.id,
    titleEn: row.title_en,
    titleMr: row.title_mr,
    imageSrc: row.image_src,
    altEn: row.alt_en || undefined,
    altMr: row.alt_mr || undefined,
    tagEn: row.tag_en || undefined,
    tagMr: row.tag_mr || undefined,
    descriptionEn: row.description_en || undefined,
    descriptionMr: row.description_mr || undefined,
    order: typeof row.display_order === 'number' ? row.display_order : 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapFieldVisitToDb(visit: Partial<FieldVisitItem>): Record<string, any> {
  return {
    id: visit.id,
    title_en: visit.titleEn || 'Field Guidance',
    title_mr: visit.titleMr || visit.titleEn || 'शेतातील मार्गदर्शन',
    image_src: visit.imageSrc || '/assets/visit/visit1.png',
    alt_en: visit.altEn || null,
    alt_mr: visit.altMr || null,
    tag_en: visit.tagEn || null,
    tag_mr: visit.tagMr || null,
    description_en: visit.descriptionEn || null,
    description_mr: visit.descriptionMr || null,
    display_order: typeof visit.order === 'number' ? visit.order : 1,
    updated_at: new Date().toISOString()
  };
}

function mapFieldExperienceFromDb(row: any): FieldExperience {
  return {
    id: row.id,
    cropKey: row.crop_key,
    cropNameEnglish: row.crop_name_english,
    cropNameMarathi: row.crop_name_marathi,
    titleEnglish: row.title_english,
    titleMarathi: row.title_marathi,
    summaryEnglish: row.summary_english || '',
    summaryMarathi: row.summary_marathi || '',
    observationEnglish: row.observation_english || '',
    observationMarathi: row.observation_marathi || '',
    practiceEnglish: row.practice_english || '',
    practiceMarathi: row.practice_marathi || '',
    seasonEnglish: row.season_english || undefined,
    seasonMarathi: row.season_marathi || undefined,
    stageEnglish: row.stage_english || undefined,
    stageMarathi: row.stage_marathi || undefined,
    categoryKey: row.category_key || undefined,
    isSample: Boolean(row.is_sample),
    image: row.image || undefined,
    relatedProductIds: Array.isArray(row.related_product_ids) ? row.related_product_ids : [],
    keyInsightsEnglish: Array.isArray(row.key_insights_english) ? row.key_insights_english : [],
    keyInsightsMarathi: Array.isArray(row.key_insights_marathi) ? row.key_insights_marathi : [],
    translationSource: row.translation_source || undefined,
    customTranslation: Boolean(row.custom_translation)
  };
}

function mapFieldExperienceToDb(fe: Partial<FieldExperience>): Record<string, any> {
  return {
    id: fe.id,
    crop_key: fe.cropKey || 'general',
    crop_name_english: fe.cropNameEnglish || 'General Crop',
    crop_name_marathi: fe.cropNameMarathi || 'सामान्य पीक',
    title_english: fe.titleEnglish || 'Field Advisory',
    title_marathi: fe.titleMarathi || fe.titleEnglish || 'कृषी सल्ला',
    summary_english: fe.summaryEnglish || '',
    summary_marathi: fe.summaryMarathi || '',
    observation_english: fe.observationEnglish || '',
    observation_marathi: fe.observationMarathi || '',
    practice_english: fe.practiceEnglish || '',
    practice_marathi: fe.practiceMarathi || '',
    season_english: fe.seasonEnglish || null,
    season_marathi: fe.seasonMarathi || null,
    stage_english: fe.stageEnglish || null,
    stage_marathi: fe.stageMarathi || null,
    category_key: fe.categoryKey || null,
    is_sample: Boolean(fe.isSample),
    image: fe.image || null,
    related_product_ids: Array.isArray(fe.relatedProductIds) ? fe.relatedProductIds : [],
    key_insights_english: Array.isArray(fe.keyInsightsEnglish) ? fe.keyInsightsEnglish : [],
    key_insights_marathi: Array.isArray(fe.keyInsightsMarathi) ? fe.keyInsightsMarathi : [],
    translation_source: fe.translationSource || null,
    custom_translation: Boolean(fe.customTranslation),
    updated_at: new Date().toISOString()
  };
}

function mapFarmerResultFromDb(row: any): FarmerResult {
  return {
    id: row.id,
    image: row.image,
    name: { en: row.name_en, mr: row.name_mr },
    location: { en: row.location_en, mr: row.location_mr },
    nameEn: row.name_en,
    nameMr: row.name_mr,
    locationEn: row.location_en,
    locationMr: row.location_mr,
    order: typeof row.display_order === 'number' ? row.display_order : 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapFarmerResultToDb(res: Partial<FarmerResult>): Record<string, any> {
  const nameEn = res.name?.en || res.nameEn || 'Farmer Partner';
  const nameMr = res.name?.mr || res.nameMr || 'शेतकरी बांधव';
  const locEn = res.location?.en || res.locationEn || 'Kaij Region';
  const locMr = res.location?.mr || res.locationMr || 'कैज परिसर';
  return {
    id: res.id,
    image: res.image || '/assets/result/1-himachal-variety-this-special-variety-from-himachal-pradesh-is-ideal-for-1723807624.jpg',
    name_en: nameEn,
    name_mr: nameMr,
    location_en: locEn,
    location_mr: locMr,
    display_order: typeof res.order === 'number' ? res.order : 1,
    updated_at: new Date().toISOString()
  };
}

function mapBusinessInfoFromDb(row: any, fallback: VerifiedBusinessInfo): VerifiedBusinessInfo {
  return {
    businessNameEn: row.name,
    businessNameMr: row.name_mr,
    taglineEn: fallback.taglineEn,
    taglineMr: fallback.taglineMr,
    ownerNameEn: row.proprietor,
    ownerNameMr: row.proprietor_mr || row.proprietor,
    nativePlaceEn: fallback.nativePlaceEn || 'Janegaon',
    nativePlaceMr: fallback.nativePlaceMr || 'जानेगाव',
    shopAddressEn: row.address,
    shopAddressMr: row.address_mr || row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    otherBusinessNameEn: fallback.otherBusinessNameEn,
    otherBusinessNameMr: fallback.otherBusinessNameMr,
    otherBusinessNoteEn: fallback.otherBusinessNoteEn,
    otherBusinessNoteMr: fallback.otherBusinessNoteMr,
    location: {
      addressEn: row.address,
      addressMr: row.address_mr || row.address,
      cityEn: row.city,
      cityMr: row.city === 'Kaij' ? 'कैज' : row.city,
      districtEn: row.district,
      districtMr: row.district === 'Beed' ? 'बीड' : row.district,
      pincode: row.pincode,
      latitude: Number(row.latitude) || 18.7042,
      longitude: Number(row.longitude) || 75.9556,
      googleMapsEmbedUrl: fallback.location?.googleMapsEmbedUrl,
      googleMapsExternalUrl: row.google_maps_url || fallback.location?.googleMapsExternalUrl
    },
    social: {
      whatsapp: row.whatsapp,
      instagramUrl: fallback.social?.instagramUrl,
      instagramHandle: fallback.social?.instagramHandle
    }
  };
}

function mapBusinessInfoToDb(info: Partial<VerifiedBusinessInfo>): Record<string, any> {
  const addrEn = info.location?.addressEn || info.shopAddressEn || 'Manglagwar Peth, Kaij, Dist. Beed, Maharashtra – 431123';
  const addrMr = info.location?.addressMr || info.shopAddressMr || 'मंगळवार पेठ, कैज, जि. बीड, महाराष्ट्र – ४३११२३';
  return {
    id: 'default_business_info',
    name: info.businessNameEn || 'Baliraja Krishi Seva Kendra',
    name_mr: info.businessNameMr || 'बळीराजा कृषी सेवा केंद्र',
    proprietor: info.ownerNameEn || 'Ganesh Shinde',
    proprietor_mr: info.ownerNameMr || 'गणेश शिंदे',
    address: addrEn,
    address_mr: addrMr,
    city: info.location?.cityEn || 'Kaij',
    district: info.location?.districtEn || 'Beed',
    state: 'Maharashtra',
    pincode: info.location?.pincode || '431123',
    phone: info.phone || '9881070520',
    whatsapp: info.whatsapp || '9881070520',
    email: info.email || 'shinde.krishi.director@baliraja.in',
    latitude: info.location?.latitude || 18.7042,
    longitude: info.location?.longitude || 75.9556,
    google_maps_url: info.location?.googleMapsExternalUrl || null,
    updated_at: new Date().toISOString()
  };
}

function mapOwnerProfileFromDb(row: any, fallback: OwnerProfile): OwnerProfile {
  return {
    name: row.name,
    nameMr: row.name_mr,
    village: fallback.village || { en: 'Janegaon', mr: 'जानेगाव' },
    role: { en: row.title, mr: row.title_mr },
    bio: { en: row.bio_en, mr: row.bio_mr },
    experience: {
      en: row.education_en || fallback.experience?.en || '',
      mr: row.education_mr || fallback.experience?.mr || ''
    },
    image: row.image,
    isDemoContent: fallback.isDemoContent || false
  };
}

function mapOwnerProfileToDb(profile: Partial<OwnerProfile>): Record<string, any> {
  return {
    id: 'default_owner_profile',
    name: profile.name || 'Ganesh Shinde',
    name_mr: profile.nameMr || 'गणेश शिंदे',
    title: profile.role?.en || 'Owner / Proprietor',
    title_mr: profile.role?.mr || 'संचालक',
    bio_en: profile.bio?.en || '',
    bio_mr: profile.bio?.mr || '',
    education_en: profile.experience?.en || null,
    education_mr: profile.experience?.mr || null,
    image: profile.image || '/assets/owner.png',
    updated_at: new Date().toISOString()
  };
}

function mapAuditLogFromDb(row: any): AdminAuditEntry {
  return {
    id: row.id,
    actionEn: row.action_en,
    actionMr: row.action_mr,
    itemType: row.item_type as AdminAuditEntry['itemType'],
    performedBy: row.performed_by,
    timestamp: row.timestamp
  };
}

function mapAuditLogToDb(entry: AdminAuditEntry): Record<string, any> {
  return {
    id: entry.id,
    action_en: entry.actionEn,
    action_mr: entry.actionMr,
    item_type: entry.itemType,
    performed_by: entry.performedBy,
    timestamp: entry.timestamp || new Date().toISOString()
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER CONTENT DATABASE CLASS
// ─────────────────────────────────────────────────────────────────────────────

class ServerContentDatabase {
  private localData: ServerContentData;

  constructor() {
    this.ensureDirectory();
    this.localData = this.loadLocalDatabase();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(CONTENT_DIR)) {
        fs.mkdirSync(CONTENT_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Content directory is read-only or not writable (in-memory mode active):', err instanceof Error ? err.message : String(err));
    }
  }

  public loadLocalDatabase(): ServerContentData {
    try {
      if (fs.existsSync(CONTENT_FILE)) {
        const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<ServerContentData>;
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
          this.localData = {
            products: parsed.products,
            categories: parsed.categories,
            brands: Array.isArray(parsed.brands) ? parsed.brands : [],
            fieldVisits: Array.isArray(parsed.fieldVisits) ? parsed.fieldVisits : [],
            fieldExperiences: Array.isArray(parsed.fieldExperiences) ? parsed.fieldExperiences : [],
            results: Array.isArray(parsed.results) ? parsed.results : [],
            businessInfo: parsed.businessInfo || defaultBusinessInfo,
            ownerProfile: parsed.ownerProfile || defaultOwnerProfile,
            auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
            version: parsed.version || 4,
            lastModified: parsed.lastModified || new Date().toISOString()
          };
          return this.localData;
        }
      }
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Error loading local content JSON file, initializing defaults:', err instanceof Error ? err.message : String(err));
    }

    const initial = initDefaultContent();
    try {
      this.saveLocalDatabaseSync(initial);
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Could not persist initial local content (read-only filesystem):', err instanceof Error ? err.message : String(err));
    }
    this.localData = initial;
    return initial;
  }

  private saveLocalDatabaseSync(data: ServerContentData): void {
    try {
      this.ensureDirectory();
      const tmpFile = `${CONTENT_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, CONTENT_FILE);
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Could not save content database file (in-memory state active):', err instanceof Error ? err.message : String(err));
    }
  }

  private persistLocal(): void {
    this.localData.lastModified = new Date().toISOString();
    this.saveLocalDatabaseSync(this.localData);
  }

  public async recordAudit(
    actionEn: string,
    actionMr: string,
    itemType: AdminAuditEntry['itemType'],
    performedBy: string = 'Administrator'
  ): Promise<void> {
    const entry: AdminAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actionEn,
      actionMr,
      itemType,
      performedBy
    };
    this.localData.auditLog = [entry, ...(this.localData.auditLog || [])].slice(0, 100);
    this.persistLocal();

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('admin_audit_logs').insert(mapAuditLogToDb(entry));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Failed to record audit log to Supabase:', err);
        }
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. FULL CONTENT BUNDLE
  // ═════════════════════════════════════════════════════════════════════════════
  public async getAllContent(): Promise<ServerContentData> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const [
            catsRes,
            prodsRes,
            brandsRes,
            visitsRes,
            expsRes,
            resultsRes,
            bizRes,
            ownerRes,
            logsRes
          ] = await Promise.all([
            supabase.from('categories').select('*').order('display_order', { ascending: true }),
            supabase.from('products').select('*').order('display_order', { ascending: true }),
            supabase.from('brands').select('*').order('display_order', { ascending: true }),
            supabase.from('field_visits').select('*').order('display_order', { ascending: true }),
            supabase.from('field_experiences').select('*'),
            supabase.from('farmer_results').select('*').order('display_order', { ascending: true }),
            supabase.from('business_info').select('*').limit(1),
            supabase.from('owner_profile').select('*').limit(1),
            supabase.from('admin_audit_logs').select('*').order('timestamp', { ascending: false }).limit(50),
          ]);

          const hasData = (catsRes.data && catsRes.data.length > 0) || (prodsRes.data && prodsRes.data.length > 0);

          if (hasData) {
            const categories = (catsRes.data || []).map(mapCategoryFromDb);
            const products = (prodsRes.data || []).map(mapProductFromDb);
            const brands = (brandsRes.data || []).map(mapBrandFromDb);
            const fieldVisits = (visitsRes.data || []).map(mapFieldVisitFromDb);
            const fieldExperiences = (expsRes.data || []).map(mapFieldExperienceFromDb);
            const results = (resultsRes.data || []).map(mapFarmerResultFromDb);

            const businessInfo = (bizRes.data && bizRes.data[0])
              ? mapBusinessInfoFromDb(bizRes.data[0], this.localData.businessInfo || defaultBusinessInfo)
              : (this.localData.businessInfo || defaultBusinessInfo);

            const ownerProfile = (ownerRes.data && ownerRes.data[0])
              ? mapOwnerProfileFromDb(ownerRes.data[0], this.localData.ownerProfile || defaultOwnerProfile)
              : (this.localData.ownerProfile || defaultOwnerProfile);

            const auditLog = (logsRes.data || []).map(mapAuditLogFromDb);

            return {
              products,
              categories,
              brands,
              fieldVisits,
              fieldExperiences,
              results,
              businessInfo,
              ownerProfile,
              auditLog,
              version: 4,
              lastModified: new Date().toISOString()
            };
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase query error in getAllContent, falling back to local storage:', err);
        }
      }
    }

    this.loadLocalDatabase();
    return JSON.parse(JSON.stringify(this.localData));
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. PRODUCTS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  public async getProducts(): Promise<Product[]> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('products').select('*').order('display_order', { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapProductFromDb);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getProducts error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.products];
  }

  public async getProductById(id: string): Promise<Product | null> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
          if (!error && data) {
            return mapProductFromDb(data);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getProductById error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    const p = this.localData.products.find((prod) => prod.id === id);
    return p ? { ...p } : null;
  }

  public async createProduct(productData: Partial<Product>, performedBy: string): Promise<Product> {
    this.loadLocalDatabase();
    const id = productData.id || `prod-${Date.now()}`;
    const slug = productData.slug || productData.nameEnglish?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;

    const rawImage = productData.image || productData.imageUrl || '/assets/products/seeds/seed_1.png';
    const sanitizedImage = saveBase64ImageSync(rawImage, 'product');
    const rawImageUrl = productData.imageUrl || productData.image || '/assets/products/seeds/seed_1.png';
    const sanitizedImageUrl = rawImageUrl === rawImage ? sanitizedImage : saveBase64ImageSync(rawImageUrl, 'product');

    const newProd: Product = {
      id,
      slug,
      nameEnglish: productData.nameEnglish || 'New Product',
      nameMarathi: productData.nameMarathi || productData.nameEnglish || 'नवीन उत्पादन',
      categoryId: productData.categoryId || 'seeds',
      category: productData.category || productData.categoryId || 'seeds',
      subcategoryId: productData.subcategoryId,
      descriptionEnglish: productData.descriptionEnglish || '',
      descriptionMarathi: productData.descriptionMarathi || '',
      image: sanitizedImage,
      imageUrl: sanitizedImageUrl,
      price: productData.price !== undefined ? productData.price : 0,
      createdAt: productData.createdAt || new Date().toISOString(),
      availability: productData.availability || 'available',
      featured: Boolean(productData.featured || productData.isBestseller),
      isBestseller: Boolean(productData.isBestseller || productData.featured),
      popularity: typeof productData.popularity === 'number' ? productData.popularity : 0,
      displayOrder: typeof productData.displayOrder === 'number' ? productData.displayOrder : this.localData.products.length + 1,
      isSample: Boolean(productData.isSample),
      keyPointsEnglish: Array.isArray(productData.keyPointsEnglish) ? productData.keyPointsEnglish : [],
      keyPointsMarathi: Array.isArray(productData.keyPointsMarathi) ? productData.keyPointsMarathi : [],
      suitableCropsEnglish: Array.isArray(productData.suitableCropsEnglish) ? productData.suitableCropsEnglish : [],
      suitableCropsMarathi: Array.isArray(productData.suitableCropsMarathi) ? productData.suitableCropsMarathi : [],
      translationSource: productData.translationSource,
      customTranslation: productData.customTranslation
    };

    // 1. Supabase Persistence
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const dbPayload = mapProductToDb(newProd);
          await supabase.from('products').upsert(dbPayload);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase createProduct error:', err);
        }
      }
    }

    // 2. Local Fallback Sync
    this.localData.products.unshift(newProd);
    await this.recordAudit(
      `Created product: ${newProd.nameEnglish}`,
      `नवीन उत्पादन जोडले: ${newProd.nameMarathi}`,
      'product',
      performedBy
    );
    this.persistLocal();
    return newProd;
  }

  public async updateProduct(id: string, updates: Partial<Product>, performedBy: string): Promise<Product | null> {
    this.loadLocalDatabase();
    const idx = this.localData.products.findIndex((p) => p.id === id);
    const current = idx !== -1 ? this.localData.products[idx] : null;

    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'product');
    }
    if (cleanUpdates.imageUrl) {
      cleanUpdates.imageUrl = saveBase64ImageSync(cleanUpdates.imageUrl, 'product');
    }

    const updated: Product = {
      ...(current || {}),
      ...cleanUpdates,
      id
    } as Product;

    // 1. Supabase Persistence
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const dbPayload = mapProductToDb(updated);
          await supabase.from('products').update(dbPayload).eq('id', id);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateProduct error:', err);
        }
      }
    }

    // 2. Local Fallback Sync
    if (idx !== -1) {
      this.localData.products[idx] = updated;
    } else {
      this.localData.products.push(updated);
    }

    await this.recordAudit(
      `Updated product: ${updated.nameEnglish}`,
      `उत्पादन अद्यतनित केले: ${updated.nameMarathi}`,
      'product',
      performedBy
    );
    this.persistLocal();
    return updated;
  }

  public async deleteProduct(id: string, performedBy: string): Promise<boolean> {
    this.loadLocalDatabase();
    const existing = this.localData.products.find((p) => p.id === id);

    // 1. Supabase Persistence
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('products').delete().eq('id', id);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase deleteProduct error:', err);
        }
      }
    }

    // 2. Local Fallback Sync
    this.localData.products = this.localData.products.filter((p) => p.id !== id);
    await this.recordAudit(
      `Deleted product: ${existing?.nameEnglish || id}`,
      `उत्पादन हटवले: ${existing?.nameMarathi || id}`,
      'product',
      performedBy
    );
    this.persistLocal();
    return true;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. CATEGORIES CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  public async getCategories(): Promise<NavCategory[]> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapCategoryFromDb);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getCategories error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public async getCategoryById(id: string): Promise<NavCategory | null> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('categories').select('*').or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
          if (!error && data) {
            return mapCategoryFromDb(data);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getCategoryById error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    const c = this.localData.categories.find((cat) => cat.id === id || cat.slug === id);
    return c ? { ...c } : null;
  }

  public async createCategory(catData: Partial<NavCategory>, performedBy: string): Promise<NavCategory> {
    this.loadLocalDatabase();
    const id = catData.id || `cat-${Date.now()}`;
    const slug = catData.slug || id;

    const rawImage = catData.image || '/assets/categories/seeds.png';
    const sanitizedImage = saveBase64ImageSync(rawImage, 'category');

    const newCat: NavCategory = {
      id,
      slug,
      name: catData.name || 'New Category',
      nameMr: catData.nameMr || catData.name || 'नवीन वर्गवारी',
      image: sanitizedImage,
      icon: catData.icon || 'Layers',
      shortDesc: catData.shortDesc || '',
      shortDescMr: catData.shortDescMr || '',
      subcategories: Array.isArray(catData.subcategories) ? catData.subcategories : [],
      highlight: Boolean(catData.highlight || catData.featured),
      featured: Boolean(catData.featured || catData.highlight),
      order: typeof catData.order === 'number' ? catData.order : this.localData.categories.length + 1,
      active: catData.active !== false
    };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('categories').upsert(mapCategoryToDb(newCat));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase createCategory error:', err);
        }
      }
    }

    this.localData.categories.push(newCat);
    await this.recordAudit(
      `Created category: ${newCat.name}`,
      `नवीन वर्गवारी तयार केली: ${newCat.nameMr}`,
      'category',
      performedBy
    );
    this.persistLocal();
    return newCat;
  }

  public async updateCategory(id: string, updates: Partial<NavCategory>, performedBy: string): Promise<NavCategory | null> {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      return null;
    }

    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'category');
    }

    const isFeatured = cleanUpdates.featured !== undefined
      ? Boolean(cleanUpdates.featured)
      : cleanUpdates.highlight !== undefined
        ? Boolean(cleanUpdates.highlight)
        : Boolean(existing.featured || existing.highlight);

    const updated: NavCategory = {
      ...existing,
      ...cleanUpdates,
      id: existing.id,
      slug: cleanUpdates.slug || existing.slug || existing.id,
      featured: isFeatured,
      highlight: isFeatured,
      active: cleanUpdates.active !== undefined ? Boolean(cleanUpdates.active) : existing.active !== false
    };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { error } = await supabase.from('categories').update(mapCategoryToDb(updated)).eq('id', existing.id);
          if (error) {
            console.warn('[SERVER_CONTENT_DB] Supabase updateCategory error:', error.message);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateCategory error:', err);
        }
      }
    }

    this.loadLocalDatabase();
    const idx = this.localData.categories.findIndex((c) => c.id === existing.id || c.slug === existing.id);
    if (idx !== -1) {
      this.localData.categories[idx] = updated;
    } else {
      this.localData.categories.push(updated);
    }

    await this.recordAudit(
      `Updated category: ${updated.name}`,
      `वर्गवारी अद्यतनित केली: ${updated.nameMr}`,
      'category',
      performedBy
    );
    this.persistLocal();
    return updated;
  }

  public async deleteCategory(id: string, performedBy: string): Promise<boolean> {
    const existing = await this.getCategoryById(id);
    if (!existing) return false;

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', existing.id);
          if (error) {
            console.warn('[SERVER_CONTENT_DB] Supabase deleteCategory error:', error.message);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase deleteCategory error:', err);
        }
      }
    }

    this.loadLocalDatabase();
    this.localData.categories = this.localData.categories.filter((c) => c.id !== existing.id && c.slug !== existing.id);
    await this.recordAudit(
      `Deleted category: ${existing.name}`,
      `वर्गवारी हटवली: ${existing.nameMr}`,
      'category',
      performedBy
    );
    this.persistLocal();
    return true;
  }

  public async reorderCategories(orderedIds: string[], performedBy: string): Promise<NavCategory[]> {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.categories.forEach((cat) => {
      if (orderMap.has(cat.id)) {
        cat.order = orderMap.get(cat.id)!;
      }
    });
    this.localData.categories.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from('categories').update({ display_order: i + 1 }).eq('id', orderedIds[i]);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase reorderCategories error:', err);
        }
      }
    }

    await this.recordAudit('Reordered categories display sequence', 'वर्गवारी क्रमवारी अद्यतनित केली', 'category', performedBy);
    this.persistLocal();
    return this.getCategories();
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. BRANDS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  public async getBrands(): Promise<Brand[]> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('brands').select('*').order('display_order', { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapBrandFromDb);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getBrands error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.brands].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public async createBrand(brandData: Partial<Brand>, performedBy: string): Promise<Brand> {
    this.loadLocalDatabase();
    const id = brandData.id || `brand-${Date.now()}`;
    const rawLogo = brandData.logo || '';
    const sanitizedLogo = saveBase64ImageSync(rawLogo, 'brand');

    const newBrand: Brand = {
      id,
      name: brandData.name || 'New Brand',
      logo: sanitizedLogo,
      order: typeof brandData.order === 'number' ? brandData.order : this.localData.brands.length + 1
    };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('brands').upsert(mapBrandToDb(newBrand));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase createBrand error:', err);
        }
      }
    }

    this.localData.brands.push(newBrand);
    await this.recordAudit(`Created brand: ${newBrand.name}`, `नवीन ब्रँड जोडला: ${newBrand.name}`, 'brand', performedBy);
    this.persistLocal();
    return newBrand;
  }

  public async updateBrand(id: string, updates: Partial<Brand>, performedBy: string): Promise<Brand | null> {
    this.loadLocalDatabase();
    const idx = this.localData.brands.findIndex((b) => b.id === id);
    const current = idx !== -1 ? this.localData.brands[idx] : null;

    const cleanUpdates = { ...updates };
    if (cleanUpdates.logo) {
      cleanUpdates.logo = saveBase64ImageSync(cleanUpdates.logo, 'brand');
    }

    const updated: Brand = { ...(current || {}), ...cleanUpdates, id } as Brand;

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('brands').upsert(mapBrandToDb(updated));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateBrand error:', err);
        }
      }
    }

    if (idx !== -1) {
      this.localData.brands[idx] = updated;
    } else {
      this.localData.brands.push(updated);
    }

    await this.recordAudit(`Updated brand: ${updated.name}`, `ब्रँड अद्यतनित केला: ${updated.name}`, 'brand', performedBy);
    this.persistLocal();
    return updated;
  }

  public async deleteBrand(id: string, performedBy: string): Promise<boolean> {
    this.loadLocalDatabase();
    const existing = this.localData.brands.find((b) => b.id === id);

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('brands').delete().eq('id', id);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase deleteBrand error:', err);
        }
      }
    }

    this.localData.brands = this.localData.brands.filter((b) => b.id !== id);
    await this.recordAudit(`Deleted brand: ${existing?.name || id}`, `ब्रँड हटवला: ${existing?.name || id}`, 'brand', performedBy);
    this.persistLocal();
    return true;
  }

  public async reorderBrands(orderedIds: string[], performedBy: string): Promise<Brand[]> {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.brands.forEach((brand) => {
      if (orderMap.has(brand.id)) {
        brand.order = orderMap.get(brand.id)!;
      }
    });
    this.localData.brands.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from('brands').update({ display_order: i + 1 }).eq('id', orderedIds[i]);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase reorderBrands error:', err);
        }
      }
    }

    await this.recordAudit('Reordered connected brands sequence', 'ब्रँड्स क्रमवारी अद्यतनित केली', 'brand', performedBy);
    this.persistLocal();
    return this.getBrands();
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 5. FIELD VISITS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  public async getFieldVisits(): Promise<FieldVisitItem[]> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('field_visits').select('*').order('display_order', { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapFieldVisitFromDb);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getFieldVisits error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.fieldVisits].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public async createFieldVisit(visitData: Partial<FieldVisitItem>, performedBy: string): Promise<FieldVisitItem> {
    this.loadLocalDatabase();
    const id = visitData.id || `visit-${Date.now()}`;
    const rawImageSrc = visitData.imageSrc || '/assets/visit/visit1.png';
    const sanitizedImageSrc = saveBase64ImageSync(rawImageSrc, 'visit');

    const newVisit: FieldVisitItem = {
      id,
      titleEn: visitData.titleEn || 'Field Guidance',
      titleMr: visitData.titleMr || visitData.titleEn || 'शेतातील प्रत्यक्ष मार्गदर्शन',
      imageSrc: sanitizedImageSrc,
      altEn: visitData.altEn,
      altMr: visitData.altMr,
      tagEn: visitData.tagEn,
      tagMr: visitData.tagMr,
      descriptionEn: visitData.descriptionEn,
      descriptionMr: visitData.descriptionMr,
      order: typeof visitData.order === 'number' ? visitData.order : this.localData.fieldVisits.length + 1,
      createdAt: visitData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('field_visits').upsert(mapFieldVisitToDb(newVisit));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase createFieldVisit error:', err);
        }
      }
    }

    this.localData.fieldVisits.unshift(newVisit);
    await this.recordAudit(`Added field visit record: ${newVisit.titleEn}`, `शेत भेट नोंद जोडली: ${newVisit.titleMr}`, 'field-visit', performedBy);
    this.persistLocal();
    return newVisit;
  }

  public async updateFieldVisit(id: string, updates: Partial<FieldVisitItem>, performedBy: string): Promise<FieldVisitItem | null> {
    this.loadLocalDatabase();
    const idx = this.localData.fieldVisits.findIndex((v) => v.id === id);
    const current = idx !== -1 ? this.localData.fieldVisits[idx] : null;

    const cleanUpdates = { ...updates };
    if (cleanUpdates.imageSrc) {
      cleanUpdates.imageSrc = saveBase64ImageSync(cleanUpdates.imageSrc, 'visit');
    }

    const updated: FieldVisitItem = {
      ...(current || {}),
      ...cleanUpdates,
      id,
      updatedAt: new Date().toISOString()
    } as FieldVisitItem;

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('field_visits').update(mapFieldVisitToDb(updated)).eq('id', id);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateFieldVisit error:', err);
        }
      }
    }

    if (idx !== -1) {
      this.localData.fieldVisits[idx] = updated;
    } else {
      this.localData.fieldVisits.push(updated);
    }

    await this.recordAudit(`Updated field visit: ${updated.titleEn}`, `शेत भेट अद्यतनित केली: ${updated.titleMr}`, 'field-visit', performedBy);
    this.persistLocal();
    return updated;
  }

  public async deleteFieldVisit(id: string, performedBy: string): Promise<boolean> {
    this.loadLocalDatabase();
    const existing = this.localData.fieldVisits.find((v) => v.id === id);

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('field_visits').delete().eq('id', id);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase deleteFieldVisit error:', err);
        }
      }
    }

    this.localData.fieldVisits = this.localData.fieldVisits.filter((v) => v.id !== id);
    await this.recordAudit(`Deleted field visit record: ${existing?.titleEn || id}`, `शेत भेट नोंद हटवली: ${existing?.titleMr || id}`, 'field-visit', performedBy);
    this.persistLocal();
    return true;
  }

  public async reorderFieldVisits(orderedIds: string[], performedBy: string): Promise<FieldVisitItem[]> {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.fieldVisits.forEach((visit) => {
      if (orderMap.has(visit.id)) {
        visit.order = orderMap.get(visit.id)!;
      }
    });
    this.localData.fieldVisits.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from('field_visits').update({ display_order: i + 1 }).eq('id', orderedIds[i]);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase reorderFieldVisits error:', err);
        }
      }
    }

    await this.recordAudit('Reordered field visits gallery sequence', 'शेत भेटींची क्रमवारी अद्यतनित केली', 'field-visit', performedBy);
    this.persistLocal();
    return this.getFieldVisits();
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 6. FIELD EXPERIENCES CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  public async getFieldExperiences(): Promise<FieldExperience[]> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('field_experiences').select('*');
          if (!error && data && data.length > 0) {
            return data.map(mapFieldExperienceFromDb);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getFieldExperiences error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.fieldExperiences];
  }

  public async createFieldExperience(feData: Partial<FieldExperience>, performedBy: string): Promise<FieldExperience> {
    this.loadLocalDatabase();
    const id = feData.id || `fe-${Date.now()}`;
    const rawImage = feData.image ? saveBase64ImageSync(feData.image, 'fieldexp') : undefined;

    const newFe: FieldExperience = {
      id,
      cropKey: feData.cropKey || 'general',
      cropNameEnglish: feData.cropNameEnglish || 'General Crop',
      cropNameMarathi: feData.cropNameMarathi || 'सामान्य पीक',
      titleEnglish: feData.titleEnglish || 'Field Advisory Observation',
      titleMarathi: feData.titleMarathi || feData.titleEnglish || 'कृषी सल्ला व निरीक्षण',
      summaryEnglish: feData.summaryEnglish || '',
      summaryMarathi: feData.summaryMarathi || '',
      observationEnglish: feData.observationEnglish || '',
      observationMarathi: feData.observationMarathi || '',
      practiceEnglish: feData.practiceEnglish || '',
      practiceMarathi: feData.practiceMarathi || '',
      seasonEnglish: feData.seasonEnglish,
      seasonMarathi: feData.seasonMarathi,
      stageEnglish: feData.stageEnglish,
      stageMarathi: feData.stageMarathi,
      categoryKey: feData.categoryKey,
      isSample: Boolean(feData.isSample),
      image: rawImage,
      relatedProductIds: Array.isArray(feData.relatedProductIds) ? feData.relatedProductIds : [],
      keyInsightsEnglish: Array.isArray(feData.keyInsightsEnglish) ? feData.keyInsightsEnglish : [],
      keyInsightsMarathi: Array.isArray(feData.keyInsightsMarathi) ? feData.keyInsightsMarathi : [],
      translationSource: feData.translationSource,
      customTranslation: feData.customTranslation
    };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('field_experiences').upsert(mapFieldExperienceToDb(newFe));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase createFieldExperience error:', err);
        }
      }
    }

    this.localData.fieldExperiences.unshift(newFe);
    await this.recordAudit(`Added field experience advisory: ${newFe.titleEnglish}`, `कृषी सल्ला नोंद जोडली: ${newFe.titleMarathi}`, 'field-experience', performedBy);
    this.persistLocal();
    return newFe;
  }

  public async updateFieldExperience(id: string, updates: Partial<FieldExperience>, performedBy: string): Promise<FieldExperience | null> {
    this.loadLocalDatabase();
    const idx = this.localData.fieldExperiences.findIndex((fe) => fe.id === id);
    const current = idx !== -1 ? this.localData.fieldExperiences[idx] : null;

    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'fieldexp');
    }

    const updated: FieldExperience = { ...(current || {}), ...cleanUpdates, id } as FieldExperience;

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('field_experiences').upsert(mapFieldExperienceToDb(updated));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateFieldExperience error:', err);
        }
      }
    }

    if (idx !== -1) {
      this.localData.fieldExperiences[idx] = updated;
    } else {
      this.localData.fieldExperiences.push(updated);
    }

    await this.recordAudit(`Updated field experience: ${updated.titleEnglish}`, `कृषी सल्ला नोंद अद्यतनित केली: ${updated.titleMarathi}`, 'field-experience', performedBy);
    this.persistLocal();
    return updated;
  }

  public async deleteFieldExperience(id: string, performedBy: string): Promise<boolean> {
    this.loadLocalDatabase();
    const existing = this.localData.fieldExperiences.find((fe) => fe.id === id);

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('field_experiences').delete().eq('id', id);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase deleteFieldExperience error:', err);
        }
      }
    }

    this.localData.fieldExperiences = this.localData.fieldExperiences.filter((fe) => fe.id !== id);
    await this.recordAudit(`Deleted field experience: ${existing?.titleEnglish || id}`, `कृषी सल्ला नोंद हटवली: ${existing?.titleMarathi || id}`, 'field-experience', performedBy);
    this.persistLocal();
    return true;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 7. FARMER RESULTS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  public async getResults(): Promise<FarmerResult[]> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('farmer_results').select('*').order('display_order', { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapFarmerResultFromDb);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getResults error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.results].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public async createResult(resData: Partial<FarmerResult>, performedBy: string): Promise<FarmerResult> {
    this.loadLocalDatabase();
    const id = resData.id || `res-${Date.now()}`;
    const nameEn = resData.name?.en || resData.nameEn || 'Progressive Farmer';
    const nameMr = resData.name?.mr || resData.nameMr || 'शेतकरी बांधव';
    const locEn = resData.location?.en || resData.locationEn || 'Kaij Region';
    const locMr = resData.location?.mr || resData.locationMr || 'कैज परिसर';

    const rawImage = resData.image || '/assets/result/1-himachal-variety-this-special-variety-from-himachal-pradesh-is-ideal-for-1723807624.jpg';
    const sanitizedImage = saveBase64ImageSync(rawImage, 'result');

    const newRes: FarmerResult = {
      id,
      image: sanitizedImage,
      name: { en: nameEn, mr: nameMr },
      location: { en: locEn, mr: locMr },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr,
      order: typeof resData.order === 'number' ? resData.order : this.localData.results.length + 1,
      createdAt: resData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('farmer_results').upsert(mapFarmerResultToDb(newRes));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase createResult error:', err);
        }
      }
    }

    this.localData.results.unshift(newRes);
    await this.recordAudit(`Added farmer success result: ${newRes.name.en}`, `शेतकरी यशोगाथा जोडली: ${newRes.name.mr}`, 'result', performedBy);
    this.persistLocal();
    return newRes;
  }

  public async updateResult(id: string, updates: Partial<FarmerResult>, performedBy: string): Promise<FarmerResult | null> {
    this.loadLocalDatabase();
    const idx = this.localData.results.findIndex((r) => r.id === id);
    const current = idx !== -1 ? this.localData.results[idx] : null;

    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'result');
    }

    const nameEn = cleanUpdates.name?.en || cleanUpdates.nameEn || current?.name.en || 'Farmer Partner';
    const nameMr = cleanUpdates.name?.mr || cleanUpdates.nameMr || current?.name.mr || 'शेतकरी बांधव';
    const locEn = cleanUpdates.location?.en || cleanUpdates.locationEn || current?.location.en || 'Kaij Region';
    const locMr = cleanUpdates.location?.mr || cleanUpdates.locationMr || current?.location.mr || 'कैज परिसर';

    const updated: FarmerResult = {
      ...(current || {}),
      ...cleanUpdates,
      id,
      name: { en: nameEn, mr: nameMr },
      location: { en: locEn, mr: locMr },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr,
      updatedAt: new Date().toISOString()
    } as FarmerResult;

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('farmer_results').upsert(mapFarmerResultToDb(updated));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateResult error:', err);
        }
      }
    }

    if (idx !== -1) {
      this.localData.results[idx] = updated;
    } else {
      this.localData.results.push(updated);
    }

    await this.recordAudit(`Updated farmer result: ${updated.name.en}`, `शेतकरी यशोगाथा अद्यतनित केली: ${updated.name.mr}`, 'result', performedBy);
    this.persistLocal();
    return updated;
  }

  public async deleteResult(id: string, performedBy: string): Promise<boolean> {
    this.loadLocalDatabase();
    const existing = this.localData.results.find((r) => r.id === id);

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('farmer_results').delete().eq('id', id);
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase deleteResult error:', err);
        }
      }
    }

    this.localData.results = this.localData.results.filter((r) => r.id !== id);
    await this.recordAudit(`Deleted farmer result: ${existing?.name.en || id}`, `शेतकरी यशोगाथा हटवली: ${existing?.name.mr || id}`, 'result', performedBy);
    this.persistLocal();
    return true;
  }

  public async reorderResults(orderedIds: string[], performedBy: string): Promise<FarmerResult[]> {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.results.forEach((res) => {
      if (orderMap.has(res.id)) {
        res.order = orderMap.get(res.id)!;
      }
    });
    this.localData.results.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from('farmer_results').update({ display_order: i + 1 }).eq('id', orderedIds[i]);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase reorderResults error:', err);
        }
      }
    }

    await this.recordAudit('Reordered farmer results showcase sequence', 'शेतकरी यशोगाथांची क्रमवारी अद्यतनित केली', 'result', performedBy);
    this.persistLocal();
    return this.getResults();
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 8. BUSINESS INFO & OWNER PROFILE
  // ═════════════════════════════════════════════════════════════════════════════
  public async getBusinessInfo(): Promise<VerifiedBusinessInfo> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('business_info').select('*').limit(1);
          if (!error && data && data.length > 0) {
            return mapBusinessInfoFromDb(data[0], this.localData.businessInfo || defaultBusinessInfo);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getBusinessInfo error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return { ...this.localData.businessInfo };
  }

  public async updateBusinessInfo(info: Partial<VerifiedBusinessInfo>, performedBy: string): Promise<VerifiedBusinessInfo> {
    this.loadLocalDatabase();
    this.localData.businessInfo = { ...this.localData.businessInfo, ...info };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('business_info').upsert(mapBusinessInfoToDb(this.localData.businessInfo));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateBusinessInfo error:', err);
        }
      }
    }

    await this.recordAudit('Updated verified business and contact info', 'व्यवसाय व संपर्क माहिती अद्यतनित केली', 'contact', performedBy);
    this.persistLocal();
    return this.getBusinessInfo();
  }

  public async getOwnerProfile(): Promise<OwnerProfile> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('owner_profile').select('*').limit(1);
          if (!error && data && data.length > 0) {
            return mapOwnerProfileFromDb(data[0], this.localData.ownerProfile || defaultOwnerProfile);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getOwnerProfile error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return { ...this.localData.ownerProfile };
  }

  public async updateOwnerProfile(profile: Partial<OwnerProfile>, performedBy: string): Promise<OwnerProfile> {
    this.loadLocalDatabase();
    const cleanProfile = { ...profile };
    if (cleanProfile.image) {
      cleanProfile.image = saveBase64ImageSync(cleanProfile.image, 'owner');
    }
    this.localData.ownerProfile = { ...this.localData.ownerProfile, ...cleanProfile };

    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('owner_profile').upsert(mapOwnerProfileToDb(this.localData.ownerProfile));
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase updateOwnerProfile error:', err);
        }
      }
    }

    await this.recordAudit('Updated founder profile & agronomy credentials', 'संस्थापक प्रोफाइल अद्यतनित केले', 'about', performedBy);
    this.persistLocal();
    return this.getOwnerProfile();
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 9. AUDIT LOG
  // ═════════════════════════════════════════════════════════════════════════════
  public async getAuditLog(): Promise<AdminAuditEntry[]> {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from('admin_audit_logs').select('*').order('timestamp', { ascending: false }).limit(100);
          if (!error && data && data.length > 0) {
            return data.map(mapAuditLogFromDb);
          }
        } catch (err) {
          console.warn('[SERVER_CONTENT_DB] Supabase getAuditLog error:', err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...(this.localData.auditLog || [])];
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 10. RESET & BACKUP UTILITIES
  // ═════════════════════════════════════════════════════════════════════════════
  public async resetToDefaults(performedBy: string): Promise<ServerContentData> {
    this.localData = initDefaultContent();
    await this.recordAudit('Reset all content to verified initial agricultural catalog defaults', 'सर्व सामग्री सुरुवातीच्या प्रमाणित स्थितीत पुनर्संचयित केली', 'system', performedBy);
    this.persistLocal();
    return this.getAllContent();
  }

  public async importBackup(parsed: any, performedBy: string): Promise<{ success: boolean; error?: string }> {
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.products)) {
      return { success: false, error: 'Invalid backup file: Missing products array.' };
    }

    const sanitized = this.sanitizeImportedContent(parsed);

    this.localData = {
      products: sanitized.products,
      categories: Array.isArray(sanitized.categories) ? sanitized.categories : defaultCategories,
      brands: Array.isArray(sanitized.brands) ? sanitized.brands : [],
      fieldVisits: Array.isArray(sanitized.fieldVisits) ? sanitized.fieldVisits : [],
      fieldExperiences: Array.isArray(sanitized.fieldExperiences) ? sanitized.fieldExperiences : [],
      results: Array.isArray(sanitized.results) ? sanitized.results : [],
      businessInfo: sanitized.businessInfo || defaultBusinessInfo,
      ownerProfile: sanitized.ownerProfile || defaultOwnerProfile,
      auditLog: Array.isArray(sanitized.auditLog) ? sanitized.auditLog : [],
      version: sanitized.version || 4,
      lastModified: new Date().toISOString()
    };

    await this.recordAudit('Restored content database from JSON backup file', 'JSON बॅकअपमधून सामग्री डेटाबेस पुनर्स्थापित केला', 'system', performedBy);
    this.persistLocal();
    return { success: true };
  }

  private sanitizeImportedContent(parsed: any): any {
    if (!parsed || typeof parsed !== 'object') return parsed;
    const cloned = JSON.parse(JSON.stringify(parsed));

    if (Array.isArray(cloned.products)) {
      cloned.products = cloned.products.map((p: any) => ({
        ...p,
        image: p.image ? saveBase64ImageSync(p.image, 'product') : p.image,
        imageUrl: p.imageUrl ? saveBase64ImageSync(p.imageUrl, 'product') : p.imageUrl
      }));
    }
    if (Array.isArray(cloned.categories)) {
      cloned.categories = cloned.categories.map((c: any) => ({
        ...c,
        image: c.image ? saveBase64ImageSync(c.image, 'category') : c.image
      }));
    }
    if (Array.isArray(cloned.brands)) {
      cloned.brands = cloned.brands.map((b: any) => ({
        ...b,
        logo: b.logo ? saveBase64ImageSync(b.logo, 'brand') : b.logo
      }));
    }
    if (Array.isArray(cloned.fieldVisits)) {
      cloned.fieldVisits = cloned.fieldVisits.map((v: any) => ({
        ...v,
        imageSrc: v.imageSrc ? saveBase64ImageSync(v.imageSrc, 'visit') : v.imageSrc
      }));
    }
    if (Array.isArray(cloned.results)) {
      cloned.results = cloned.results.map((r: any) => ({
        ...r,
        image: r.image ? saveBase64ImageSync(r.image, 'result') : r.image
      }));
    }
    if (Array.isArray(cloned.fieldExperiences)) {
      cloned.fieldExperiences = cloned.fieldExperiences.map((f: any) => ({
        ...f,
        image: f.image ? saveBase64ImageSync(f.image, 'fieldexp') : f.image
      }));
    }
    if (cloned.ownerProfile?.image) {
      cloned.ownerProfile.image = saveBase64ImageSync(cloned.ownerProfile.image, 'owner');
    }

    return cloned;
  }
}

export const serverContentDb = new ServerContentDatabase();
