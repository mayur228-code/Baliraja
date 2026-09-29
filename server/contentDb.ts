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
} from '../src/types/index.ts';
import { sampleProducts } from '../src/data/productData.ts';
import { defaultCategories } from '../src/data/navigationData.ts';
import { fieldVisitItems as defaultFieldVisits } from '../src/data/fieldVisitsData.ts';
import { fieldExperiences as defaultFieldExperiences } from '../src/data/fieldExperienceData.ts';
import { defaultFarmerResults } from '../src/data/resultsData.ts';
import { verifiedBusinessInfo as defaultBusinessInfo, ownerProfile as defaultOwnerProfile } from '../src/data/aboutData.ts';
import { saveBase64ImageSync } from './storageService.ts';

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

class ServerContentDatabase {
  private data: ServerContentData;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(CONTENT_DIR)) {
        fs.mkdirSync(CONTENT_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Content directory is read-only or not writable (operating in-memory mode):', err instanceof Error ? err.message : String(err));
    }
  }

  public loadDatabase(): ServerContentData {
    try {
      if (fs.existsSync(CONTENT_FILE)) {
        const raw = fs.readFileSync(CONTENT_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<ServerContentData>;
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
          this.data = {
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
          return this.data;
        }
      }
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Error loading content database file, initializing defaults:', err instanceof Error ? err.message : String(err));
    }

    const initial = initDefaultContent();
    try {
      this.saveDatabaseSync(initial);
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Could not persist initial content (read-only filesystem):', err instanceof Error ? err.message : String(err));
    }
    this.data = initial;
    return initial;
  }

  private saveDatabaseSync(data: ServerContentData): void {
    try {
      this.ensureDirectory();
      const tmpFile = `${CONTENT_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, CONTENT_FILE);
    } catch (err) {
      console.warn('[SERVER_CONTENT_DB] Could not save content database file (in-memory state active):', err instanceof Error ? err.message : String(err));
    }
  }

  private persist(): void {
    this.data.lastModified = new Date().toISOString();
    this.saveDatabaseSync(this.data);
  }

  public recordAudit(
    actionEn: string,
    actionMr: string,
    itemType: AdminAuditEntry['itemType'],
    performedBy: string = 'Administrator'
  ): void {
    const entry: AdminAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actionEn,
      actionMr,
      itemType,
      performedBy
    };
    this.data.auditLog = [entry, ...(this.data.auditLog || [])].slice(0, 100);
  }

  // --- Full Bundle ---
  public getAllContent(): ServerContentData {
    this.loadDatabase();
    return JSON.parse(JSON.stringify(this.data));
  }

  // --- Products ---
  public getProducts(): Product[] {
    this.loadDatabase();
    return [...this.data.products];
  }

  public getProductById(id: string): Product | null {
    this.loadDatabase();
    const p = this.data.products.find((prod) => prod.id === id);
    return p ? { ...p } : null;
  }

  public createProduct(productData: Partial<Product>, performedBy: string): Product {
    this.loadDatabase();
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
      displayOrder: typeof productData.displayOrder === 'number' ? productData.displayOrder : this.data.products.length + 1,
      isSample: Boolean(productData.isSample),
      keyPointsEnglish: Array.isArray(productData.keyPointsEnglish) ? productData.keyPointsEnglish : [],
      keyPointsMarathi: Array.isArray(productData.keyPointsMarathi) ? productData.keyPointsMarathi : [],
      suitableCropsEnglish: Array.isArray(productData.suitableCropsEnglish) ? productData.suitableCropsEnglish : [],
      suitableCropsMarathi: Array.isArray(productData.suitableCropsMarathi) ? productData.suitableCropsMarathi : [],
      translationSource: productData.translationSource,
      customTranslation: productData.customTranslation
    };

    this.data.products.unshift(newProd);
    this.recordAudit(
      `Created product: ${newProd.nameEnglish}`,
      `नवीन उत्पादन जोडले: ${newProd.nameMarathi}`,
      'product',
      performedBy
    );
    this.persist();
    return newProd;
  }

  public updateProduct(id: string, updates: Partial<Product>, performedBy: string): Product | null {
    this.loadDatabase();
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const current = this.data.products[idx];
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'product');
    }
    if (cleanUpdates.imageUrl) {
      cleanUpdates.imageUrl = saveBase64ImageSync(cleanUpdates.imageUrl, 'product');
    }

    const updated: Product = {
      ...current,
      ...cleanUpdates,
      id: current.id // ID cannot be altered
    };

    this.data.products[idx] = updated;
    this.recordAudit(
      `Updated product: ${updated.nameEnglish}`,
      `उत्पादन अद्यतनित केले: ${updated.nameMarathi}`,
      'product',
      performedBy
    );
    this.persist();
    return updated;
  }

  public deleteProduct(id: string, performedBy: string): boolean {
    this.loadDatabase();
    const existing = this.data.products.find((p) => p.id === id);
    if (!existing) return false;

    this.data.products = this.data.products.filter((p) => p.id !== id);
    this.recordAudit(
      `Deleted product: ${existing.nameEnglish} (ID: ${id})`,
      `उत्पादन हटवले: ${existing.nameMarathi} (आयडी: ${id})`,
      'product',
      performedBy
    );
    this.persist();
    return true;
  }

  // --- Categories ---
  public getCategories(): NavCategory[] {
    this.loadDatabase();
    return [...this.data.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public getCategoryById(id: string): NavCategory | null {
    this.loadDatabase();
    const c = this.data.categories.find((cat) => cat.id === id || cat.slug === id);
    return c ? { ...c } : null;
  }

  public createCategory(catData: Partial<NavCategory>, performedBy: string): NavCategory {
    this.loadDatabase();
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
      order: typeof catData.order === 'number' ? catData.order : this.data.categories.length + 1,
      active: catData.active !== false
    };

    this.data.categories.push(newCat);
    this.recordAudit(
      `Created category: ${newCat.name}`,
      `नवीन वर्गवारी तयार केली: ${newCat.nameMr}`,
      'category',
      performedBy
    );
    this.persist();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<NavCategory>, performedBy: string): NavCategory | null {
    this.loadDatabase();
    const idx = this.data.categories.findIndex((c) => c.id === id || c.slug === id);
    if (idx === -1) return null;

    const current = this.data.categories[idx];
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'category');
    }

    const updated: NavCategory = {
      ...current,
      ...cleanUpdates,
      id: current.id
    };

    this.data.categories[idx] = updated;
    this.recordAudit(
      `Updated category: ${updated.name}`,
      `वर्गवारी अद्यतनित केली: ${updated.nameMr}`,
      'category',
      performedBy
    );
    this.persist();
    return updated;
  }

  public deleteCategory(id: string, performedBy: string): boolean {
    this.loadDatabase();
    const existing = this.data.categories.find((c) => c.id === id);
    if (!existing) return false;

    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this.recordAudit(
      `Deleted category: ${existing.name}`,
      `वर्गवारी हटवली: ${existing.nameMr}`,
      'category',
      performedBy
    );
    this.persist();
    return true;
  }

  public reorderCategories(orderedIds: string[], performedBy: string): NavCategory[] {
    this.loadDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.data.categories.forEach((cat) => {
      if (orderMap.has(cat.id)) {
        cat.order = orderMap.get(cat.id)!;
      }
    });
    this.data.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered categories display sequence', 'वर्गवारी क्रमवारी अद्यतनित केली', 'category', performedBy);
    this.persist();
    return this.getCategories();
  }

  // --- Brands ---
  public getBrands(): Brand[] {
    this.loadDatabase();
    return [...this.data.brands].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public createBrand(brandData: Partial<Brand>, performedBy: string): Brand {
    this.loadDatabase();
    const id = brandData.id || `brand-${Date.now()}`;
    const rawLogo = brandData.logo || '';
    const sanitizedLogo = saveBase64ImageSync(rawLogo, 'brand');

    const newBrand: Brand = {
      id,
      name: brandData.name || 'New Brand',
      logo: sanitizedLogo,
      order: typeof brandData.order === 'number' ? brandData.order : this.data.brands.length + 1
    };

    this.data.brands.push(newBrand);
    this.recordAudit(`Created brand: ${newBrand.name}`, `नवीन ब्रँड जोडला: ${newBrand.name}`, 'brand', performedBy);
    this.persist();
    return newBrand;
  }

  public updateBrand(id: string, updates: Partial<Brand>, performedBy: string): Brand | null {
    this.loadDatabase();
    const idx = this.data.brands.findIndex((b) => b.id === id);
    if (idx === -1) {
      return this.createBrand({ ...updates, id }, performedBy);
    }

    const current = this.data.brands[idx];
    const cleanUpdates = { ...updates };
    if (cleanUpdates.logo) {
      cleanUpdates.logo = saveBase64ImageSync(cleanUpdates.logo, 'brand');
    }

    const updated: Brand = { ...current, ...cleanUpdates, id: current.id };
    this.data.brands[idx] = updated;
    this.recordAudit(`Updated brand: ${updated.name}`, `ब्रँड अद्यतनित केला: ${updated.name}`, 'brand', performedBy);
    this.persist();
    return updated;
  }

  public deleteBrand(id: string, performedBy: string): boolean {
    this.loadDatabase();
    const existing = this.data.brands.find((b) => b.id === id);
    if (!existing) return false;

    this.data.brands = this.data.brands.filter((b) => b.id !== id);
    this.recordAudit(`Deleted brand: ${existing.name}`, `ब्रँड हटवला: ${existing.name}`, 'brand', performedBy);
    this.persist();
    return true;
  }

  public reorderBrands(orderedIds: string[], performedBy: string): Brand[] {
    this.loadDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.data.brands.forEach((brand) => {
      if (orderMap.has(brand.id)) {
        brand.order = orderMap.get(brand.id)!;
      }
    });
    this.data.brands.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered connected brands sequence', 'ब्रँड्स क्रमवारी अद्यतनित केली', 'brand', performedBy);
    this.persist();
    return this.getBrands();
  }

  // --- Field Visits ---
  public getFieldVisits(): FieldVisitItem[] {
    this.loadDatabase();
    return [...this.data.fieldVisits].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public createFieldVisit(visitData: Partial<FieldVisitItem>, performedBy: string): FieldVisitItem {
    this.loadDatabase();
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
      order: typeof visitData.order === 'number' ? visitData.order : this.data.fieldVisits.length + 1,
      createdAt: visitData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.fieldVisits.unshift(newVisit);
    this.recordAudit(`Added field visit record: ${newVisit.titleEn}`, `शेत भेट नोंद जोडली: ${newVisit.titleMr}`, 'field-visit', performedBy);
    this.persist();
    return newVisit;
  }

  public updateFieldVisit(id: string, updates: Partial<FieldVisitItem>, performedBy: string): FieldVisitItem | null {
    this.loadDatabase();
    const idx = this.data.fieldVisits.findIndex((v) => v.id === id);
    if (idx === -1) return null;

    const current = this.data.fieldVisits[idx];
    const cleanUpdates = { ...updates };
    if (cleanUpdates.imageSrc) {
      cleanUpdates.imageSrc = saveBase64ImageSync(cleanUpdates.imageSrc, 'visit');
    }

    const updated: FieldVisitItem = {
      ...current,
      ...cleanUpdates,
      id: current.id,
      updatedAt: new Date().toISOString()
    };
    this.data.fieldVisits[idx] = updated;
    this.recordAudit(`Updated field visit: ${updated.titleEn}`, `शेत भेट अद्यतनित केली: ${updated.titleMr}`, 'field-visit', performedBy);
    this.persist();
    return updated;
  }

  public deleteFieldVisit(id: string, performedBy: string): boolean {
    this.loadDatabase();
    const existing = this.data.fieldVisits.find((v) => v.id === id);
    if (!existing) return false;

    this.data.fieldVisits = this.data.fieldVisits.filter((v) => v.id !== id);
    this.recordAudit(`Deleted field visit record: ${existing.titleEn}`, `शेत भेट नोंद हटवली: ${existing.titleMr}`, 'field-visit', performedBy);
    this.persist();
    return true;
  }

  public reorderFieldVisits(orderedIds: string[], performedBy: string): FieldVisitItem[] {
    this.loadDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.data.fieldVisits.forEach((visit) => {
      if (orderMap.has(visit.id)) {
        visit.order = orderMap.get(visit.id)!;
      }
    });
    this.data.fieldVisits.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered field visits gallery sequence', 'शेत भेटींची क्रमवारी अद्यतनित केली', 'field-visit', performedBy);
    this.persist();
    return this.getFieldVisits();
  }

  // --- Field Experiences ---
  public getFieldExperiences(): FieldExperience[] {
    this.loadDatabase();
    return [...this.data.fieldExperiences];
  }

  public createFieldExperience(feData: Partial<FieldExperience>, performedBy: string): FieldExperience {
    this.loadDatabase();
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

    this.data.fieldExperiences.unshift(newFe);
    this.recordAudit(`Added field experience advisory: ${newFe.titleEnglish}`, `कृषी सल्ला नोंद जोडली: ${newFe.titleMarathi}`, 'field-experience', performedBy);
    this.persist();
    return newFe;
  }

  public updateFieldExperience(id: string, updates: Partial<FieldExperience>, performedBy: string): FieldExperience | null {
    this.loadDatabase();
    const idx = this.data.fieldExperiences.findIndex((fe) => fe.id === id);
    if (idx === -1) {
      return this.createFieldExperience({ ...updates, id }, performedBy);
    }

    const current = this.data.fieldExperiences[idx];
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'fieldexp');
    }

    const updated: FieldExperience = { ...current, ...cleanUpdates, id: current.id };
    this.data.fieldExperiences[idx] = updated;
    this.recordAudit(`Updated field experience: ${updated.titleEnglish}`, `कृषी सल्ला नोंद अद्यतनित केली: ${updated.titleMarathi}`, 'field-experience', performedBy);
    this.persist();
    return updated;
  }

  public deleteFieldExperience(id: string, performedBy: string): boolean {
    this.loadDatabase();
    const existing = this.data.fieldExperiences.find((fe) => fe.id === id);
    if (!existing) return false;

    this.data.fieldExperiences = this.data.fieldExperiences.filter((fe) => fe.id !== id);
    this.recordAudit(`Deleted field experience: ${existing.titleEnglish}`, `कृषी सल्ला नोंद हटवली: ${existing.titleMarathi}`, 'field-experience', performedBy);
    this.persist();
    return true;
  }

  // --- Farmer Results ---
  public getResults(): FarmerResult[] {
    this.loadDatabase();
    return [...this.data.results].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public createResult(resData: Partial<FarmerResult>, performedBy: string): FarmerResult {
    this.loadDatabase();
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
      name: {
        en: nameEn,
        mr: nameMr
      },
      location: {
        en: locEn,
        mr: locMr
      },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr,
      order: typeof resData.order === 'number' ? resData.order : this.data.results.length + 1,
      createdAt: resData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.results.unshift(newRes);
    this.recordAudit(`Added farmer success result: ${newRes.name.en}`, `शेतकरी यशोगाथा जोडली: ${newRes.name.mr}`, 'result', performedBy);
    this.persist();
    return newRes;
  }

  public updateResult(id: string, updates: Partial<FarmerResult>, performedBy: string): FarmerResult | null {
    this.loadDatabase();
    const idx = this.data.results.findIndex((r) => r.id === id);
    if (idx === -1) {
      return this.createResult({ ...updates, id }, performedBy);
    }

    const current = this.data.results[idx];
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, 'result');
    }

    const nameEn = cleanUpdates.name?.en || cleanUpdates.nameEn || current.name.en;
    const nameMr = cleanUpdates.name?.mr || cleanUpdates.nameMr || current.name.mr;
    const locEn = cleanUpdates.location?.en || cleanUpdates.locationEn || current.location.en;
    const locMr = cleanUpdates.location?.mr || cleanUpdates.locationMr || current.location.mr;

    const updated: FarmerResult = {
      ...current,
      ...cleanUpdates,
      id: current.id,
      name: { en: nameEn, mr: nameMr },
      location: { en: locEn, mr: locMr },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr,
      updatedAt: new Date().toISOString()
    };
    this.data.results[idx] = updated;
    this.recordAudit(`Updated farmer result: ${updated.name.en}`, `शेतकरी यशोगाथा अद्यतनित केली: ${updated.name.mr}`, 'result', performedBy);
    this.persist();
    return updated;
  }

  public deleteResult(id: string, performedBy: string): boolean {
    this.loadDatabase();
    const existing = this.data.results.find((r) => r.id === id);
    if (!existing) return false;

    this.data.results = this.data.results.filter((r) => r.id !== id);
    this.recordAudit(`Deleted farmer result: ${existing.name.en}`, `शेतकरी यशोगाथा हटवली: ${existing.name.mr}`, 'result', performedBy);
    this.persist();
    return true;
  }

  public reorderResults(orderedIds: string[], performedBy: string): FarmerResult[] {
    this.loadDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.data.results.forEach((res) => {
      if (orderMap.has(res.id)) {
        res.order = orderMap.get(res.id)!;
      }
    });
    this.data.results.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered farmer results showcase sequence', 'शेतकरी यशोगाथांची क्रमवारी अद्यतनित केली', 'result', performedBy);
    this.persist();
    return this.getResults();
  }

  // --- Business Info & Owner Profile ---
  public getBusinessInfo(): VerifiedBusinessInfo {
    this.loadDatabase();
    return { ...this.data.businessInfo };
  }

  public updateBusinessInfo(info: Partial<VerifiedBusinessInfo>, performedBy: string): VerifiedBusinessInfo {
    this.loadDatabase();
    this.data.businessInfo = { ...this.data.businessInfo, ...info };
    this.recordAudit('Updated verified business and contact info', 'व्यवसाय व संपर्क माहिती अद्यतनित केली', 'contact', performedBy);
    this.persist();
    return this.getBusinessInfo();
  }

  public getOwnerProfile(): OwnerProfile {
    this.loadDatabase();
    return { ...this.data.ownerProfile };
  }

  public updateOwnerProfile(profile: Partial<OwnerProfile>, performedBy: string): OwnerProfile {
    this.loadDatabase();
    const cleanProfile = { ...profile };
    if (cleanProfile.image) {
      cleanProfile.image = saveBase64ImageSync(cleanProfile.image, 'owner');
    }
    this.data.ownerProfile = { ...this.data.ownerProfile, ...cleanProfile };
    this.recordAudit('Updated founder profile & agronomy credentials', 'संस्थापक प्रोफाइल अद्यतनित केले', 'about', performedBy);
    this.persist();
    return this.getOwnerProfile();
  }

  // --- Audit Log ---
  public getAuditLog(): AdminAuditEntry[] {
    this.loadDatabase();
    return [...(this.data.auditLog || [])];
  }

  // --- Reset & Backup ---
  public resetToDefaults(performedBy: string): ServerContentData {
    this.data = initDefaultContent();
    this.recordAudit('Reset all content to verified initial agricultural catalog defaults', 'सर्व सामग्री सुरुवातीच्या प्रमाणित स्थितीत पुनर्संचयित केली', 'system', performedBy);
    this.persist();
    return this.getAllContent();
  }

  public importBackup(parsed: any, performedBy: string): { success: boolean; error?: string } {
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.products)) {
      return { success: false, error: 'Invalid backup file: Missing products array.' };
    }

    const sanitized = this.sanitizeImportedContent(parsed);

    this.data = {
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

    this.recordAudit('Restored content database from JSON backup file', 'JSON बॅकअपमधून सामग्री डेटाबेस पुनर्स्थापित केला', 'system', performedBy);
    this.persist();
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
    if (Array.isArray(cloned.fieldExperiences)) {
      cloned.fieldExperiences = cloned.fieldExperiences.map((f: any) => ({
        ...f,
        image: f.image ? saveBase64ImageSync(f.image, 'fieldexp') : f.image
      }));
    }
    if (Array.isArray(cloned.results)) {
      cloned.results = cloned.results.map((r: any) => ({
        ...r,
        image: r.image ? saveBase64ImageSync(r.image, 'result') : r.image
      }));
    }
    if (cloned.ownerProfile && typeof cloned.ownerProfile === 'object' && cloned.ownerProfile.image) {
      cloned.ownerProfile.image = saveBase64ImageSync(cloned.ownerProfile.image, 'owner');
    }
    return cloned;
  }
}

export const serverContentDb = new ServerContentDatabase();
