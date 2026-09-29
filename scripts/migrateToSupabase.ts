import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
import type { ServerContentData, AdminAuditEntry } from '../server/contentDb';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION & CLIENT INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

const isExecuteMode = process.argv.includes('--execute');
const isVerbose = process.argv.includes('--verbose');

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  ''
).trim();
const SUPABASE_STORAGE_BUCKET = (
  process.env.SUPABASE_STORAGE_BUCKET || 'baliraja-assets'
).trim();

const ROOT_DIR = process.cwd();
const CONTENT_FILE = path.join(ROOT_DIR, 'server/data/content.json');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_DIR = path.join(ROOT_DIR, 'server/uploads');

const REQUIRED_TABLES = [
  'categories',
  'products',
  'brands',
  'field_visits',
  'field_experiences',
  'farmer_results',
  'business_info',
  'owner_profile',
  'admin_audit_logs'
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// DATA ROW MAPPERS (TypeScript CamelCase -> PostgreSQL snake_case)
// ─────────────────────────────────────────────────────────────────────────────

function mapCategoryToDb(cat: NavCategory): Record<string, any> {
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

function mapProductToDb(prod: Product): Record<string, any> {
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
    category_id: prod.categoryId || prod.category || 'seeds',
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

function mapBrandToDb(brand: Brand): Record<string, any> {
  return {
    id: brand.id,
    name: brand.name || 'Brand',
    logo: brand.logo || '',
    display_order: typeof brand.order === 'number' ? brand.order : 1,
    updated_at: new Date().toISOString()
  };
}

function mapFieldVisitToDb(visit: FieldVisitItem): Record<string, any> {
  return {
    id: visit.id,
    title_en: visit.titleEn || 'Field Guidance',
    title_mr: visit.titleMr || visit.titleEn || 'शेतातील प्रत्यक्ष मार्गदर्शन',
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

function mapFieldExperienceToDb(fe: FieldExperience): Record<string, any> {
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

function mapFarmerResultToDb(res: FarmerResult): Record<string, any> {
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

function mapBusinessInfoToDb(info: VerifiedBusinessInfo): Record<string, any> {
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

function mapOwnerProfileToDb(profile: OwnerProfile): Record<string, any> {
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
// IMAGE VERIFICATION HELPER
// ─────────────────────────────────────────────────────────────────────────────

interface ImageCheckResult {
  path: string;
  type: 'static' | 'upload' | 'remote' | 'base64' | 'missing';
  existsOnDisk: boolean;
  resolvedPath?: string;
  sizeBytes?: number;
}

function checkImageReference(imgPath: string | undefined | null): ImageCheckResult {
  if (!imgPath) {
    return { path: '', type: 'missing', existsOnDisk: false };
  }

  if (imgPath.startsWith('data:image/')) {
    return { path: imgPath.slice(0, 30) + '...', type: 'base64', existsOnDisk: true };
  }

  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    return { path: imgPath, type: 'remote', existsOnDisk: true };
  }

  if (imgPath.startsWith('/assets/')) {
    const localFile = path.join(PUBLIC_DIR, imgPath);
    const exists = fs.existsSync(localFile);
    let size = 0;
    if (exists) {
      try {
        size = fs.statSync(localFile).size;
      } catch {
        // ignore
      }
    }
    return {
      path: imgPath,
      type: exists ? 'static' : 'missing',
      existsOnDisk: exists,
      resolvedPath: localFile,
      sizeBytes: size
    };
  }

  if (imgPath.startsWith('/uploads/')) {
    const localFile = path.join(UPLOADS_DIR, path.basename(imgPath));
    const exists = fs.existsSync(localFile);
    let size = 0;
    if (exists) {
      try {
        size = fs.statSync(localFile).size;
      } catch {
        // ignore
      }
    }
    return {
      path: imgPath,
      type: exists ? 'upload' : 'missing',
      existsOnDisk: exists,
      resolvedPath: localFile,
      sizeBytes: size
    };
  }

  // Fallback relative check
  const candidatePublic = path.join(PUBLIC_DIR, imgPath);
  if (fs.existsSync(candidatePublic)) {
    return {
      path: imgPath,
      type: 'static',
      existsOnDisk: true,
      resolvedPath: candidatePublic,
      sizeBytes: fs.statSync(candidatePublic).size
    };
  }

  return { path: imgPath, type: 'missing', existsOnDisk: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MIGRATION & DRY-RUN SCRIPT
// ─────────────────────────────────────────────────────────────────────────────

async function runMigration() {
  console.log('================================================================');
  console.log('🌾 BALIRAJA KRISHI SEVA KENDRA — SUPABASE DATA MIGRATION TOOL');
  console.log('================================================================');
  console.log(`Execution Mode: ${isExecuteMode ? '🚨 LIVE EXECUTION (--execute)' : '🛡️ DRY-RUN ONLY (Safe Plan & Verify)'}`);
  console.log(`Database URL:   ${SUPABASE_URL ? SUPABASE_URL.replace(/(\/\/[^:]+:[^@]+@)/, '//***@') : 'NOT CONFIGURED'}`);
  console.log(`Storage Bucket: ${SUPABASE_STORAGE_BUCKET}`);
  console.log(`Local Content:  ${CONTENT_FILE}`);
  console.log('----------------------------------------------------------------\n');

  // 1. Validate Credentials
  const hasSupabaseConfig = Boolean(
    SUPABASE_URL &&
    SUPABASE_SERVICE_ROLE_KEY &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_SERVICE_ROLE_KEY.length > 20
  );

  let supabase: SupabaseClient | null = null;
  if (hasSupabaseConfig) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } else if (isExecuteMode) {
    console.error('❌ FATAL: Cannot execute live migration without valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.');
    process.exit(1);
  } else {
    console.warn('⚠️ NOTE: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in local .env.');
    console.warn('   Running in OFFLINE DRY-RUN MODE: Validating local datasets, foreign keys, media assets, and generated insertion plan.\n');
  }

  // 2. Verify Schema Tables
  console.log('1️⃣ VERIFYING SUPABASE TABLES & ROW COUNTS...');
  const tableCountsBefore: Record<string, number> = {};
  const existingRowsMap: Record<string, any[]> = {};
  let schemaErrors = 0;

  if (supabase) {
    for (const tableName of REQUIRED_TABLES) {
      try {
        const { data, count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' });

        if (error) {
          console.error(`   ❌ Table "${tableName}" error:`, error.message);
          schemaErrors++;
        } else {
          const rowCount = count ?? (data ? data.length : 0);
          tableCountsBefore[tableName] = rowCount;
          existingRowsMap[tableName] = data || [];
          console.log(`   ✅ Table "${tableName}": ${rowCount} existing rows`);
        }
      } catch (err: any) {
        console.error(`   ❌ Exception querying table "${tableName}":`, err.message || String(err));
        schemaErrors++;
      }
    }

    if (schemaErrors > 0) {
      console.error(`\n❌ Found ${schemaErrors} schema / permission error(s).`);
      console.error('💡 Quick Fix:');
      console.error('   1. Ensure `supabase/schema.sql` (with GRANT statements) is executed in your Supabase SQL Editor.');
      console.error('   2. Verify that `SUPABASE_SERVICE_ROLE_KEY` in your `.env` is the `service_role` secret key (not the `anon` key).');
      console.error('      Find it at: Supabase Dashboard -> Project Settings -> API -> Project API keys -> service_role');
      process.exit(1);
    }
  } else {
    for (const tableName of REQUIRED_TABLES) {
      tableCountsBefore[tableName] = 0;
      existingRowsMap[tableName] = [];
      console.log(`   ℹ️ Table "${tableName}": [Offline Simulation - Assumed 0 existing rows]`);
    }
  }

  // 3. Verify Storage Bucket
  console.log('\n2️⃣ VERIFYING SUPABASE STORAGE BUCKET...');
  let bucketFound = false;
  if (supabase) {
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.warn(`   ⚠️ Warning querying buckets:`, bucketError.message);
      } else {
        const bucket = buckets?.find((b) => b.name === SUPABASE_STORAGE_BUCKET);
        if (bucket) {
          console.log(`   ✅ Bucket "${SUPABASE_STORAGE_BUCKET}" found (public: ${bucket.public ? 'YES' : 'NO'})`);
          bucketFound = true;
        } else {
          console.warn(`   ⚠️ Bucket "${SUPABASE_STORAGE_BUCKET}" not found in bucket list.`);
        }
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Exception querying storage buckets:`, err.message || String(err));
    }
    if (!bucketFound) {
      console.warn(`   ℹ️ Note: Bucket "${SUPABASE_STORAGE_BUCKET}" verification status: NOT YET CONFIRMED`);
    }
  } else {
    console.log(`   ℹ️ Bucket "${SUPABASE_STORAGE_BUCKET}": [Offline Simulation - Assumed existing & public]`);
  }

  // 4. Load Authoritative Local Content Data
  console.log('\n3️⃣ LOADING & VALIDATING AUTHORITATIVE LOCAL DATASET...');
  if (!fs.existsSync(CONTENT_FILE)) {
    console.error(`❌ FATAL: Authoritative local content file not found at ${CONTENT_FILE}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(CONTENT_FILE, 'utf-8');
  const localData: ServerContentData = JSON.parse(rawJson);

  const categories: NavCategory[] = localData.categories || [];
  const products: Product[] = localData.products || [];
  const brands: Brand[] = localData.brands || [];
  const fieldVisits: FieldVisitItem[] = localData.fieldVisits || [];
  const fieldExperiences: FieldExperience[] = localData.fieldExperiences || [];
  const results: FarmerResult[] = localData.results || [];
  const businessInfo: VerifiedBusinessInfo = localData.businessInfo;
  const ownerProfile: OwnerProfile = localData.ownerProfile;
  const auditLogs: AdminAuditEntry[] = localData.auditLog || [];

  console.log(`   - Categories:        ${categories.length} (Expected: 4)`);
  console.log(`   - Products:          ${products.length} (Expected: 25)`);
  console.log(`   - Brands:            ${brands.length} (Expected: 0 active)`);
  console.log(`   - Field Visits:      ${fieldVisits.length} (Expected: 5)`);
  console.log(`   - Field Experiences: ${fieldExperiences.length} (Expected: 5)`);
  console.log(`   - Farmer Results:    ${results.length} (Expected: 6)`);
  console.log(`   - Business Info:     ${businessInfo ? '1 record' : '0 records'} (Expected: 1)`);
  console.log(`   - Owner Profile:     ${ownerProfile ? '1 record' : '0 records'} (Expected: 1)`);
  console.log(`   - Admin Audit Logs:  ${auditLogs.length} record(s)`);

  // 5. Relationship & Foreign Key Integrity Checks
  console.log('\n4️⃣ VALIDATING FOREIGN KEY & RELATIONSHIP INTEGRITY...');
  const categoryIdSet = new Set(categories.map((c) => c.id));
  const subcategoryMap = new Map<string, Set<string>>();
  categories.forEach((cat) => {
    subcategoryMap.set(cat.id, new Set((cat.subcategories || []).map((s) => s.id)));
  });

  const productIdSet = new Set(products.map((p) => p.id));
  let relationshipErrors = 0;

  // Validate Products -> Category
  for (const prod of products) {
    const catId = prod.categoryId || prod.category;
    if (!catId || !categoryIdSet.has(catId)) {
      console.error(`   ❌ Product "${prod.id}" (${prod.nameEnglish}) references unknown category_id "${catId}"`);
      relationshipErrors++;
    }

    if (prod.subcategoryId && catId) {
      const allowedSubs = subcategoryMap.get(catId);
      if (allowedSubs && !allowedSubs.has(prod.subcategoryId)) {
        console.warn(`   ⚠️ Product "${prod.id}" subcategory "${prod.subcategoryId}" is not in category "${catId}" subcategories list (non-fatal)`);
      }
    }
  }

  // Validate Field Experiences -> Related Products
  for (const fe of fieldExperiences) {
    if (Array.isArray(fe.relatedProductIds)) {
      for (const relId of fe.relatedProductIds) {
        if (!productIdSet.has(relId)) {
          console.warn(`   ⚠️ Field Experience "${fe.id}" references relatedProductId "${relId}" which is not in current products list (non-fatal, stored in JSONB)`);
        }
      }
    }
  }

  if (relationshipErrors === 0) {
    console.log('   ✅ All foreign key dependencies and primary relationships are 100% VALID.');
  } else {
    console.error(`   ❌ Found ${relationshipErrors} relationship error(s).`);
  }

  // 6. Media Asset Audit
  console.log('\n5️⃣ AUDITING MEDIA ASSETS & IMAGE REFERENCES...');
  const assetAudit = {
    staticAssets: 0,
    uploadAssets: 0,
    remoteUrls: 0,
    missingAssets: [] as string[]
  };

  const imagesToCheck: { entity: string; id: string; field: string; path: string }[] = [];

  categories.forEach((c) => {
    if (c.image) imagesToCheck.push({ entity: 'category', id: c.id, field: 'image', path: c.image });
  });

  products.forEach((p) => {
    if (p.image) imagesToCheck.push({ entity: 'product', id: p.id, field: 'image', path: p.image });
    if (p.imageUrl && p.imageUrl !== p.image) imagesToCheck.push({ entity: 'product', id: p.id, field: 'imageUrl', path: p.imageUrl });
  });

  brands.forEach((b) => {
    if (b.logo) imagesToCheck.push({ entity: 'brand', id: b.id, field: 'logo', path: b.logo });
  });

  fieldVisits.forEach((v) => {
    if (v.imageSrc) imagesToCheck.push({ entity: 'field_visit', id: v.id, field: 'imageSrc', path: v.imageSrc });
  });

  fieldExperiences.forEach((f) => {
    if (f.image) imagesToCheck.push({ entity: 'field_experience', id: f.id, field: 'image', path: f.image });
  });

  results.forEach((r) => {
    if (r.image) imagesToCheck.push({ entity: 'farmer_result', id: r.id, field: 'image', path: r.image });
  });

  if (ownerProfile?.image) {
    imagesToCheck.push({ entity: 'owner_profile', id: 'owner', field: 'image', path: ownerProfile.image });
  }

  for (const item of imagesToCheck) {
    const res = checkImageReference(item.path);
    if (res.type === 'static') {
      assetAudit.staticAssets++;
    } else if (res.type === 'upload') {
      assetAudit.uploadAssets++;
    } else if (res.type === 'remote') {
      assetAudit.remoteUrls++;
    } else if (res.type === 'missing') {
      assetAudit.missingAssets.push(`${item.entity}:${item.id} -> ${item.path}`);
      console.warn(`   ⚠️ Missing local image file for ${item.entity} [${item.id}]: "${item.path}"`);
    }
  }

  console.log(`   - Static assets (/assets/...) verified on disk: ${assetAudit.staticAssets}`);
  console.log(`   - Upload assets (/uploads/...) verified on disk: ${assetAudit.uploadAssets}`);
  console.log(`   - Remote CDN / HTTPS URLs:                     ${assetAudit.remoteUrls}`);
  console.log(`   - Missing image files:                         ${assetAudit.missingAssets.length}`);

  // 7. Migration Plan Generation & Conflict Detection
  console.log('\n6️⃣ GENERATING MIGRATION PLAN (IDEMPOTENT COMPARISON)...');

  interface EntityPlan {
    table: string;
    plannedInserts: any[];
    alreadyMatching: any[];
    conflicts: { id: string; reason: string }[];
  }

  const plans: EntityPlan[] = [];

  function planTable(tableName: string, localItems: any[], mapper: (item: any) => Record<string, any>) {
    const existing = existingRowsMap[tableName] || [];
    const existingById = new Map(existing.map((row) => [row.id, row]));

    const plannedInserts: any[] = [];
    const alreadyMatching: any[] = [];
    const conflicts: { id: string; reason: string }[] = [];

    for (const item of localItems) {
      const dbRow = mapper(item);
      const match = existingById.get(dbRow.id);

      if (!match) {
        plannedInserts.push(dbRow);
      } else {
        // Compare essential content fields
        let isDiff = false;
        let diffKey = '';
        for (const [key, val] of Object.entries(dbRow)) {
          if (key === 'updated_at' || key === 'created_at') continue;
          const matchVal = match[key];
          if (JSON.stringify(val) !== JSON.stringify(matchVal)) {
            isDiff = true;
            diffKey = key;
            break;
          }
        }

        if (isDiff) {
          conflicts.push({ id: dbRow.id, reason: `Field "${diffKey}" differs from local dataset` });
        } else {
          alreadyMatching.push(dbRow);
        }
      }
    }

    plans.push({
      table: tableName,
      plannedInserts,
      alreadyMatching,
      conflicts
    });
  }

  planTable('categories', categories, mapCategoryToDb);
  planTable('products', products, mapProductToDb);
  planTable('brands', brands, mapBrandToDb);
  planTable('field_visits', fieldVisits, mapFieldVisitToDb);
  planTable('field_experiences', fieldExperiences, mapFieldExperienceToDb);
  planTable('farmer_results', results, mapFarmerResultToDb);
  planTable('business_info', businessInfo ? [businessInfo] : [], mapBusinessInfoToDb);
  planTable('owner_profile', ownerProfile ? [ownerProfile] : [], mapOwnerProfileToDb);
  planTable('admin_audit_logs', auditLogs, mapAuditLogToDb);

  let totalPlannedInserts = 0;
  let totalAlreadyMatching = 0;
  let totalConflicts = 0;

  for (const p of plans) {
    totalPlannedInserts += p.plannedInserts.length;
    totalAlreadyMatching += p.alreadyMatching.length;
    totalConflicts += p.conflicts.length;

    console.log(`   📋 Table "${p.table.padEnd(18)}": ${String(p.plannedInserts.length).padStart(2)} to INSERT | ${String(p.alreadyMatching.length).padStart(2)} MATCHING | ${String(p.conflicts.length).padStart(2)} CONFLICTS`);
    if (isVerbose && p.plannedInserts.length > 0) {
      console.log(`      IDs to insert: ${p.plannedInserts.map((r) => r.id).join(', ')}`);
    }
  }

  // 8. Live Execution (Only if --execute flag was explicitly passed)
  if (isExecuteMode) {
    if (!supabase) {
      console.error('❌ FATAL: Supabase client is null. Cannot execute live migration.');
      process.exit(1);
    }
    console.log('\n🚨 LIVE EXECUTION REQUESTED (--execute flag detected)...');
    console.log('   Executing planned inserts in strict dependency order...');

    for (const p of plans) {
      if (p.plannedInserts.length > 0) {
        console.log(`   Inserting ${p.plannedInserts.length} record(s) into "${p.table}"...`);
        const { error: insertError } = await supabase.from(p.table).insert(p.plannedInserts);
        if (insertError) {
          console.error(`   ❌ Error inserting into table "${p.table}":`, insertError.message);
          console.error('   Aborting migration to prevent inconsistent database state.');
          process.exit(1);
        } else {
          console.log(`   ✅ Successfully inserted ${p.plannedInserts.length} record(s) into "${p.table}".`);
        }
      }
    }
  } else {
    console.log('\n🛡️ DRY-RUN COMPLETED: ZERO DATABASE WRITES WERE EXECUTED.');
  }

  // 9. Post-Verification of Table Counts
  console.log('\n7️⃣ VERIFYING FINAL SUPABASE TABLE COUNTS...');
  const tableCountsAfter: Record<string, number> = {};
  if (supabase) {
    for (const tableName of REQUIRED_TABLES) {
      const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
      tableCountsAfter[tableName] = count ?? 0;
    }
  } else {
    for (const tableName of REQUIRED_TABLES) {
      tableCountsAfter[tableName] = 0;
    }
  }

  let tableCountsChanged = false;
  for (const tableName of REQUIRED_TABLES) {
    const before = tableCountsBefore[tableName] || 0;
    const after = tableCountsAfter[tableName] || 0;
    if (before !== after) tableCountsChanged = true;
    console.log(`   Table "${tableName.padEnd(18)}": Before = ${before}, After = ${after}`);
  }

  // 10. Final Summary Report
  console.log('\n================================================================');
  console.log('📊 MIGRATION READINESS SUMMARY');
  console.log('================================================================');
  console.log(`Source records in local dataset:     ${products.length + categories.length + brands.length + fieldVisits.length + fieldExperiences.length + results.length + (businessInfo ? 1 : 0) + (ownerProfile ? 1 : 0) + auditLogs.length}`);
  console.log(`Existing records in Supabase:        ${Object.values(tableCountsBefore).reduce((a, b) => a + b, 0)}`);
  console.log(`Planned inserts:                     ${totalPlannedInserts}`);
  console.log(`Already matching:                    ${totalAlreadyMatching}`);
  console.log(`Data conflicts:                      ${totalConflicts}`);
  console.log(`Missing image assets:                ${assetAudit.missingAssets.length}`);
  console.log(`Relationship / Foreign key errors:   ${relationshipErrors}`);
  console.log(`Supabase state modified:             ${tableCountsChanged ? 'YES ⚠️' : 'NO (0 writes)'}`);
  
  const isReady = relationshipErrors === 0 && totalConflicts === 0 && schemaErrors === 0;
  console.log(`Ready for execute:                   ${isReady ? 'YES ✅' : 'NO ❌'}`);
  console.log('================================================================\n');

  if (!isExecuteMode) {
    console.log('💡 To execute this migration live in Phase 4 when ready, run:');
    console.log('   npx tsx scripts/migrateToSupabase.ts --execute\n');
  }
}

runMigration().catch((err) => {
  console.error('❌ Unhandled Migration Error:', err);
  process.exit(1);
});
