import { useState, useEffect } from 'react';
import type { 
  Product, 
  NavCategory, 
  Brand, 
  FieldVisitItem, 
  FieldExperience, 
  FarmerResult, 
  VerifiedBusinessInfo, 
  OwnerProfile 
} from '../types/index.ts';
import { sampleProducts } from './productData.ts';
import { defaultCategories } from './navigationData.ts';
import { fieldVisitItems as defaultFieldVisits } from './fieldVisitsData.ts';
import { fieldExperiences as defaultFieldExperiences } from './fieldExperienceData.ts';
import { defaultFarmerResults } from './resultsData.ts';
import { verifiedBusinessInfo as defaultBusinessInfo, ownerProfile as defaultOwnerProfile } from './aboutData.ts';
import { 
  getStoredContentFromDb, 
  saveStoredContentToDb, 
  broadcastContentChange, 
  subscribeToContentSync 
} from '../lib/storageDb.ts';
import { authService } from '../admin/auth/authService.ts';

/**
 * BALIRAJA KRISHI SEVA KENDRA — Central Content Store & Server Data Adapter (Phase 2B)
 * 
 * Server-backed Single Source of Truth for Products, Categories, Brands, Field Visits,
 * Field Experiences, Farmer Results, and Business Profile.
 * - Public Website reads from centralized Express backend (/api/content/*).
 * - Admin Panel operations perform server-side authorized mutations with HttpOnly cookies & Anti-CSRF protection.
 * - LocalStorage / IndexedDB serve strictly as fallback cache.
 */

const STORAGE_KEY = 'baliraja_dev_content_store_v4';
const AUDIT_STORAGE_KEY = 'baliraja_admin_audit_log_v1';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actionEn: string;
  actionMr: string;
  itemType: 'product' | 'category' | 'brand' | 'field-visit' | 'field-experience' | 'result' | 'about' | 'contact' | 'system';
  performedBy: string;
}

export interface StoredContent {
  products: Product[];
  categories: NavCategory[];
  brands: Brand[];
  fieldVisits: FieldVisitItem[];
  fieldExperiences: FieldExperience[];
  results: FarmerResult[];
  businessInfo: VerifiedBusinessInfo;
  ownerProfile: OwnerProfile;
  auditLog?: AdminAuditEntry[];
  version: number;
}

const DEFAULT_CONTENT: StoredContent = {
  products: sampleProducts,
  categories: defaultCategories,
  brands: [],
  fieldVisits: defaultFieldVisits.map((v, i) => ({ ...v, order: i + 1 })),
  fieldExperiences: defaultFieldExperiences,
  results: defaultFarmerResults.map((r, i) => ({ ...r, order: i + 1 })),
  businessInfo: defaultBusinessInfo,
  ownerProfile: defaultOwnerProfile,
  version: 4
};

type Listener = () => void;

class ContentStore {
  private content: StoredContent;
  private auditLog: AdminAuditEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private isSyncing: boolean = false;

  constructor() {
    this.content = this.loadFromStorage();
    this.auditLog = this.loadAuditLog();
    this.initAsyncStorage();
    this.syncFromServer();
  }

  private normalizeContent(raw: unknown): StoredContent {
    if (!raw || typeof raw !== 'object') return DEFAULT_CONTENT;
    const parsed = raw as Partial<StoredContent>;

    const normalizeCategories = (rawCat: unknown): NavCategory[] => {
      if (!Array.isArray(rawCat)) return defaultCategories;
      return rawCat.map((c: Partial<NavCategory>, idx: number) => ({
        id: c.id || `cat-${idx + 1}`,
        slug: c.slug || c.id || `cat-${idx + 1}`,
        name: c.name || 'Category',
        nameMr: c.nameMr || c.name || 'वर्गवारी',
        image: c.image || '',
        icon: c.icon || c.id || 'Layers',
        shortDesc: c.shortDesc || '',
        shortDescMr: c.shortDescMr || '',
        subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
        highlight: Boolean(c.highlight || c.featured),
        featured: Boolean(c.featured || c.highlight),
        order: typeof c.order === 'number' ? c.order : idx + 1,
        active: c.active !== false
      }));
    };

    const normalizeProducts = (rawProd: unknown): Product[] => {
      if (!Array.isArray(rawProd)) return sampleProducts;
      return rawProd.map((p: Partial<Product>, idx: number) => {
        let cleanPrice: number | string | undefined = undefined;
        if (p.price !== undefined && p.price !== null && p.price !== '') {
          if (typeof p.price === 'number') {
            cleanPrice = p.price;
          } else {
            const cleaned = String(p.price).replace(/[^0-9.]/g, '');
            const num = Number(cleaned);
            cleanPrice = !isNaN(num) && cleaned.length > 0 ? num : String(p.price).trim();
          }
        }

        const isFeatured = Boolean(p.featured || p.isBestseller);

        return {
          id: p.id || `prod-${idx + 1}`,
          slug: p.slug || p.id || `prod-${idx + 1}`,
          nameEnglish: p.nameEnglish || (p as any).name || 'Agricultural Product',
          nameMarathi: p.nameMarathi || (p as any).nameMr || p.nameEnglish || 'कृषी उत्पादन',
          categoryId: p.categoryId || (p as any).category || 'seeds',
          category: (p as any).category || p.categoryId || 'seeds',
          subcategoryId: p.subcategoryId,
          descriptionEnglish: p.descriptionEnglish || (p as any).description || '',
          descriptionMarathi: p.descriptionMarathi || (p as any).descriptionMr || '',
          image: p.image || (p as any).imageUrl || '/assets/products/seeds/seed_1.png',
          imageUrl: (p as any).imageUrl || p.image,
          price: cleanPrice,
          availability: p.availability || 'available',
          featured: isFeatured,
          isBestseller: isFeatured,
          displayOrder: typeof p.displayOrder === 'number' ? p.displayOrder : idx + 1,
          isSample: Boolean(p.isSample),
          keyPointsEnglish: Array.isArray(p.keyPointsEnglish) ? p.keyPointsEnglish : [],
          keyPointsMarathi: Array.isArray(p.keyPointsMarathi) ? p.keyPointsMarathi : [],
          suitableCropsEnglish: Array.isArray(p.suitableCropsEnglish) ? p.suitableCropsEnglish : [],
          suitableCropsMarathi: Array.isArray(p.suitableCropsMarathi) ? p.suitableCropsMarathi : [],
          translationSource: p.translationSource,
          customTranslation: p.customTranslation,
          createdAt: p.createdAt
        };
      });
    };

    const normalizeFieldVisits = (rawVisits: unknown): FieldVisitItem[] => {
      if (!Array.isArray(rawVisits)) return defaultFieldVisits.map((v, i) => ({ ...v, order: i + 1 }));
      return rawVisits.map((v: Partial<FieldVisitItem>, idx: number) => ({
        id: v.id || `visit-${idx + 1}`,
        titleEn: v.titleEn || 'Field Guidance',
        titleMr: v.titleMr || v.titleEn || 'शेतातील प्रत्यक्ष मार्गदर्शन',
        imageSrc: v.imageSrc || '/assets/visit/visit1.png',
        altEn: v.altEn,
        altMr: v.altMr,
        tagEn: v.tagEn,
        tagMr: v.tagMr,
        descriptionEn: v.descriptionEn,
        descriptionMr: v.descriptionMr,
        order: typeof v.order === 'number' ? v.order : idx + 1,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
      }));
    };

    const normalizeFarmerResults = (rawRes: unknown): FarmerResult[] => {
      if (!Array.isArray(rawRes)) return defaultFarmerResults.map((r, i) => ({ ...r, order: i + 1 }));
      return rawRes.map((r: Partial<FarmerResult>, idx: number) => {
        const nameEn = r.name?.en || r.nameEn || 'Progressive Farmer';
        const nameMr = r.name?.mr || r.nameMr || 'शेतकरी बांधव';
        const locEn = r.location?.en || r.locationEn || 'Kaij Region';
        const locMr = r.location?.mr || r.locationMr || 'कैज परिसर';
        return {
          id: r.id || `res-${idx + 1}`,
          image: r.image || '/assets/result/1-himachal-variety-this-special-variety-from-himachal-pradesh-is-ideal-for-1723807624.jpg',
          name: { en: nameEn, mr: nameMr },
          location: { en: locEn, mr: locMr },
          nameEn,
          nameMr,
          locationEn: locEn,
          locationMr: locMr,
          order: typeof r.order === 'number' ? r.order : idx + 1,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        };
      });
    };

    return {
      products: normalizeProducts(parsed.products),
      categories: normalizeCategories(parsed.categories),
      brands: Array.isArray(parsed.brands) ? parsed.brands : [],
      fieldVisits: normalizeFieldVisits(parsed.fieldVisits),
      fieldExperiences: Array.isArray(parsed.fieldExperiences) ? parsed.fieldExperiences : defaultFieldExperiences,
      results: normalizeFarmerResults(parsed.results),
      businessInfo: parsed.businessInfo || defaultBusinessInfo,
      ownerProfile: parsed.ownerProfile || defaultOwnerProfile,
      version: 4
    };
  }

  public async syncFromServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const res = await fetch('/api/content', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.content = this.normalizeContent(json.data);
          if (Array.isArray(json.data.auditLog)) {
            this.auditLog = json.data.auditLog;
          }
          this.saveToStorage();
          this.listeners.forEach((listener) => listener());
        }
      }
    } catch {
      // Backend may be starting or offline; fallback cache in memory/IndexedDB takes over
    } finally {
      this.isSyncing = false;
    }
  }

  private async initAsyncStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    subscribeToContentSync(() => {
      this.syncFromServer();
    });

    try {
      const dbContent = await getStoredContentFromDb<StoredContent>();
      if (dbContent && typeof dbContent === 'object' && Array.isArray(dbContent.products)) {
        this.content = this.normalizeContent(dbContent);
        this.listeners.forEach((listener) => listener());
      }
    } catch {
      // ignore
    }
  }

  private loadFromStorage(): StoredContent {
    if (typeof window === 'undefined') return DEFAULT_CONTENT;
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed === 'object') {
          return this.normalizeContent(parsed);
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONTENT;
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.content));
    } catch {
      // ignore
    }
    try {
      saveStoredContentToDb(this.content);
    } catch {
      // ignore
    }
  }

  private loadAuditLog(): AdminAuditEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.slice(0, 50);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private recordAudit(
    actionEn: string, 
    actionMr: string, 
    itemType: AdminAuditEntry['itemType']
  ): void {
    const entry: AdminAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actionEn,
      actionMr,
      itemType,
      performedBy: 'Administrator'
    };
    this.auditLog = [entry, ...this.auditLog].slice(0, 50);
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.auditLog));
    } catch {
      // ignore
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((listener) => listener());
    broadcastContentChange();
  }

  private getMutationHeaders(): Record<string, string> {
    const csrf = authService.getCsrfToken();
    return {
      'Content-Type': 'application/json',
      'x-csrf-token': csrf
    };
  }

  // --- Getters ---
  public getProducts(): Product[] {
    return [...this.content.products];
  }

  public getProductById(id: string): Product | undefined {
    return this.content.products.find((p) => p.id === id);
  }

  public getCategories(includeInactive: boolean = false): NavCategory[] {
    const list = [...(this.content.categories || defaultCategories)];
    const filtered = includeInactive ? list : list.filter((c) => c.active !== false);
    return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public getCategoryById(id: string): NavCategory | undefined {
    return (this.content.categories || defaultCategories).find(
      (c) => c.id === id || c.slug === id
    );
  }

  public getBrands(): Brand[] {
    return [...(this.content.brands || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public getBrandById(id: string): Brand | undefined {
    return (this.content.brands || []).find((b) => b.id === id);
  }

  public getFieldVisits(): FieldVisitItem[] {
    return [...this.content.fieldVisits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public getFieldExperiences(): FieldExperience[] {
    return [...this.content.fieldExperiences];
  }

  public getFieldExperienceById(id: string): FieldExperience | undefined {
    return this.content.fieldExperiences.find((f) => f.id === id);
  }

  public getResults(): FarmerResult[] {
    return [...this.content.results].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public getBusinessInfo(): VerifiedBusinessInfo {
    return { ...this.content.businessInfo };
  }

  public getOwnerProfile(): OwnerProfile {
    return { ...this.content.ownerProfile };
  }

  public getAuditLog(): AdminAuditEntry[] {
    return [...this.auditLog];
  }

  // --- Product Mutations ---
  public createProduct(product: Omit<Product, 'id'> & { id?: string }): { success: boolean; error?: string; product?: Product } {
    if (!product.nameEnglish?.trim() || !product.nameMarathi?.trim()) {
      return { success: false, error: 'Product name is required in both English and Marathi.' };
    }
    if (!product.categoryId) {
      return { success: false, error: 'Valid category assignment is required.' };
    }

    const newId = product.id && !this.content.products.some((p) => p.id === product.id)
      ? product.id
      : `prod-${Date.now()}`;

    let cleanPrice: number | string | undefined = undefined;
    if (product.price !== undefined && product.price !== null && product.price !== '') {
      if (typeof product.price === 'number') {
        cleanPrice = product.price;
      } else {
        const cleaned = String(product.price).replace(/[^0-9.]/g, '');
        const num = Number(cleaned);
        cleanPrice = !isNaN(num) && cleaned.length > 0 ? num : String(product.price).trim();
      }
    }

    const newProduct: Product = {
      ...product,
      id: newId,
      slug: product.slug || product.nameEnglish.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `prod-${Date.now()}`,
      price: cleanPrice,
      displayOrder: typeof product.displayOrder === 'number' ? product.displayOrder : this.content.products.length + 1,
      availability: product.availability || 'available',
      featured: Boolean(product.featured),
      isBestseller: Boolean(product.featured),
      isSample: false,
      createdAt: new Date().toISOString()
    };

    this.content.products.unshift(newProduct);
    this.recordAudit(`Added new product "${newProduct.nameEnglish}" (${newProduct.id})`, `नवीन उत्पादन जोडले: "${newProduct.nameMarathi}"`, 'product');
    this.notify();

    // Persist to Server REST API
    fetch('/api/content/products', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(newProduct)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to create product on server:', err));

    return { success: true, product: newProduct };
  }

  public updateProduct(id: string, updates: Partial<Product>): { success: boolean; error?: string } {
    const index = this.content.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: `Product not found with ID: ${id}` };
    }

    const existing = this.content.products[index];
    let cleanPrice: number | string | undefined = existing.price;
    if (updates.price !== undefined) {
      if (updates.price === null || updates.price === '') {
        cleanPrice = undefined;
      } else if (typeof updates.price === 'number') {
        cleanPrice = updates.price;
      } else {
        const cleaned = String(updates.price).replace(/[^0-9.]/g, '');
        const num = Number(cleaned);
        cleanPrice = !isNaN(num) && cleaned.length > 0 ? num : String(updates.price).trim();
      }
    }

    const nextFeatured = updates.featured !== undefined ? Boolean(updates.featured) : existing.featured;

    const updated: Product = {
      ...existing,
      ...updates,
      id: existing.id,
      price: cleanPrice,
      featured: nextFeatured,
      isBestseller: nextFeatured,
      categoryId: updates.categoryId || existing.categoryId,
      category: updates.category !== undefined ? updates.category : existing.category,
      image: updates.image || existing.image,
      imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : existing.imageUrl,
      isSample: false
    };

    this.content.products[index] = updated;
    this.recordAudit(`Updated product "${updated.nameEnglish}" (${updated.id})`, `उत्पादन अद्यतनित केले: "${updated.nameMarathi}"`, 'product');
    this.notify();

    // Persist to Server REST API
    fetch(`/api/content/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(updated)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to update product on server:', err));

    return { success: true };
  }

  public saveProduct(product: Product): { success: boolean; error?: string } {
    if (!product.nameEnglish?.trim() || !product.nameMarathi?.trim()) {
      return { success: false, error: 'Product name is required in both English and Marathi.' };
    }
    if (!product.categoryId) {
      return { success: false, error: 'Valid category assignment is required.' };
    }

    if (this.content.products.some((p) => p.id === product.id)) {
      return this.updateProduct(product.id, product);
    }
    return this.createProduct(product);
  }

  public toggleProductAvailability(id: string): { success: boolean } {
    const p = this.content.products.find((prod) => prod.id === id);
    if (p) {
      p.availability = p.availability === 'available' ? 'out_of_stock' : 'available';
      this.recordAudit(`Toggled availability for "${p.nameEnglish}" to ${p.availability}`, `"${p.nameMarathi}" ची उपलब्धता बदलली: ${p.availability}`, 'product');
      this.notify();

      fetch(`/api/content/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: this.getMutationHeaders(),
        body: JSON.stringify({ availability: p.availability })
      }).catch((err) => console.error('[CONTENT_SYNC] Failed to patch availability on server:', err));
    }
    return { success: true };
  }

  public toggleProductFeatured(id: string): { success: boolean; error?: string } {
    const p = this.content.products.find((prod) => prod.id === id);
    if (!p) {
      return { success: false, error: `Product not found with ID: ${id}` };
    }
    const nextState = !p.featured;
    p.featured = nextState;
    p.isBestseller = nextState;
    this.recordAudit(`Toggled featured status for "${p.nameEnglish}" to ${nextState ? 'Yes' : 'No'}`, `"${p.nameMarathi}" चे वैशिष्ट्यीकृत स्वरूप बदलले: ${nextState ? 'होय' : 'नाही'}`, 'product');
    this.notify();

    fetch(`/api/content/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify({ featured: nextState, isBestseller: nextState })
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to patch featured status on server:', err));

    return { success: true };
  }

  public deleteProduct(id: string): { success: boolean; error?: string } {
    const referencing = this.content.fieldExperiences.filter((fe) =>
      fe.relatedProductIds?.includes(id)
    );

    if (referencing.length > 0) {
      const titles = referencing.map((r) => r.titleEnglish).join(', ');
      return {
        success: false,
        error: `Cannot delete: Product is referenced in Field Experience (${titles}). Remove the reference before deleting.`
      };
    }

    const item = this.content.products.find((p) => p.id === id);
    this.content.products = this.content.products.filter((p) => p.id !== id);
    this.recordAudit(`Deleted product "${item?.nameEnglish || id}"`, `उत्पादन हटवले: "${item?.nameMarathi || id}"`, 'product');
    this.notify();

    fetch(`/api/content/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getMutationHeaders()
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to delete product on server:', err));

    return { success: true };
  }

  // --- Category Mutations ---
  public createCategory(category: Omit<NavCategory, 'id'> & { id?: string }): { success: boolean; error?: string; category?: NavCategory } {
    const nameTrimmed = category.name?.trim();
    if (!nameTrimmed) {
      return { success: false, error: 'Category English name is required.' };
    }

    if (!this.content.categories) {
      this.content.categories = [...defaultCategories];
    }

    const duplicate = this.content.categories.some(
      (c) => c.name.toLowerCase().trim() === nameTrimmed.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: `A category named "${nameTrimmed}" already exists. Please choose a distinct name.` };
    }

    const baseSlug = (category.id || category.slug || nameTrimmed)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let cleanId = baseSlug || `cat-${Date.now()}`;

    if (this.content.categories.some((c) => c.id === cleanId)) {
      let counter = 1;
      while (this.content.categories.some((c) => c.id === `${cleanId}-${counter}`)) {
        counter++;
      }
      cleanId = `${cleanId}-${counter}`;
    }

    const isFeatured = Boolean(category.featured || category.highlight);
    const maxOrder = this.content.categories.reduce((max, c) => Math.max(max, c.order || 0), 0);
    const order = typeof category.order === 'number' && !isNaN(category.order)
      ? category.order
      : maxOrder + 1;

    const newCategory: NavCategory = {
      ...category,
      id: cleanId,
      slug: category.slug || cleanId,
      name: nameTrimmed,
      nameMr: category.nameMr?.trim() || nameTrimmed,
      image: category.image || '/assets/categories/fertilizers.png',
      icon: category.icon || 'Layers',
      shortDesc: category.shortDesc?.trim() || '',
      shortDescMr: category.shortDescMr?.trim() || '',
      order,
      active: category.active !== false,
      featured: isFeatured,
      highlight: isFeatured,
      subcategories: Array.isArray(category.subcategories) ? category.subcategories : []
    };

    this.content.categories.push(newCategory);
    this.recordAudit(`Added new category "${newCategory.name}" (${newCategory.id})`, `नवीन श्रेणी जोडली: "${newCategory.nameMr}"`, 'category');
    this.notify();

    fetch('/api/content/categories', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(newCategory)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to create category on server:', err));

    return { success: true, category: newCategory };
  }

  public updateCategory(id: string, updates: Partial<NavCategory>): { success: boolean; error?: string; category?: NavCategory } {
    if (!this.content.categories) {
      this.content.categories = [...defaultCategories];
    }

    const targetIndex = this.content.categories.findIndex((c) => c.id === id || c.slug === id);
    if (targetIndex < 0) {
      return { success: false, error: `Category with ID "${id}" not found.` };
    }

    const existing = this.content.categories[targetIndex];
    const isFeatured = updates.featured !== undefined 
      ? Boolean(updates.featured) 
      : updates.highlight !== undefined 
        ? Boolean(updates.highlight) 
        : Boolean(existing.featured || existing.highlight);

    const updated: NavCategory = {
      ...existing,
      ...updates,
      id: existing.id,
      slug: updates.slug || existing.slug || existing.id,
      featured: isFeatured,
      highlight: isFeatured
    };

    this.content.categories[targetIndex] = updated;
    this.recordAudit(`Updated category "${updated.name}" (${updated.id})`, `श्रेणी अद्यतनित केली: "${updated.nameMr}"`, 'category');
    this.notify();

    fetch(`/api/content/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(updated)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to update category on server:', err));

    return { success: true, category: updated };
  }

  public saveCategory(category: NavCategory): { success: boolean; error?: string; category?: NavCategory } {
    if (this.content.categories.some((c) => c.id === category.id || c.slug === category.id)) {
      return this.updateCategory(category.id, category);
    }
    return this.createCategory(category);
  }

  public toggleCategoryFeatured(id: string): { success: boolean; error?: string } {
    const c = this.content.categories.find((cat) => cat.id === id || cat.slug === id);
    if (!c) {
      return { success: false, error: `Category not found with ID: ${id}` };
    }
    const nextState = !c.featured;
    c.featured = nextState;
    c.highlight = nextState;
    this.recordAudit(`Toggled featured status for category "${c.name}" to ${nextState ? 'Yes' : 'No'}`, `श्रेणी "${c.nameMr}" चे वैशिष्ट्यीकृत स्वरूप बदलले: ${nextState ? 'होय' : 'नाही'}`, 'category');
    this.notify();

    fetch(`/api/content/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify({ featured: nextState, highlight: nextState })
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to patch category featured on server:', err));

    return { success: true };
  }

  public toggleCategoryActive(id: string): { success: boolean; error?: string } {
    const c = this.content.categories.find((cat) => cat.id === id || cat.slug === id);
    if (!c) {
      return { success: false, error: `Category not found with ID: ${id}` };
    }
    c.active = c.active === false ? true : false;
    this.recordAudit(`Toggled active status for category "${c.name}" to ${c.active ? 'Active' : 'Hidden'}`, `श्रेणी "${c.nameMr}" ची स्थिती बदलली: ${c.active ? 'सक्रिय' : 'लपवलेली'}`, 'category');
    this.notify();

    fetch(`/api/content/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify({ active: c.active })
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to patch category active on server:', err));

    return { success: true };
  }

  public deleteCategory(id: string): { success: boolean; error?: string } {
    const assignedProducts = this.content.products.filter(
      (p) => p.categoryId === id || (p as any).category === id
    );

    if (assignedProducts.length > 0) {
      return {
        success: false,
        error: `Cannot delete: Category contains ${assignedProducts.length} product(s). Please reassign or delete the products first.`
      };
    }

    const item = this.content.categories.find((c) => c.id === id || c.slug === id);
    this.content.categories = this.content.categories.filter((c) => c.id !== id && c.slug !== id);
    this.recordAudit(`Deleted category "${item?.name || id}"`, `श्रेणी हटवली: "${item?.nameMr || id}"`, 'category');
    this.notify();

    fetch(`/api/content/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getMutationHeaders()
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to delete category on server:', err));

    return { success: true };
  }

  public reorderCategories(orderedIds: string[]): { success: boolean } {
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.content.categories.forEach((cat) => {
      if (orderMap.has(cat.id)) {
        cat.order = orderMap.get(cat.id)!;
      }
    });
    this.content.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered categories display sequence', 'वर्गवारी क्रमवारी अद्यतनित केली', 'category');
    this.notify();

    fetch('/api/content/categories/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify({ orderedIds })
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to reorder categories on server:', err));

    return { success: true };
  }

  public moveCategoryOrder(id: string, direction: 'up' | 'down'): { success: boolean } {
    const sorted = [...this.content.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((c) => c.id === id || c.slug === id);
    if (idx === -1) return { success: false };

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return { success: false };

    const currentCat = sorted[idx];
    const swapCat = sorted[targetIdx];
    const tempOrder = currentCat.order;
    currentCat.order = swapCat.order;
    swapCat.order = tempOrder;

    return this.reorderCategories(sorted.map((c) => c.id));
  }

  // --- Brand Mutations ---
  public saveBrand(brand: Brand): { success: boolean; error?: string } {
    if (!brand.name?.trim()) {
      return { success: false, error: 'Brand name is required.' };
    }

    const idx = this.content.brands.findIndex((b) => b.id === brand.id);
    if (idx >= 0) {
      this.content.brands[idx] = { ...brand };
      this.recordAudit(`Updated brand "${brand.name}"`, `ब्रँड अद्यतनित केला: "${brand.name}"`, 'brand');
    } else {
      const newBrand: Brand = {
        ...brand,
        id: brand.id || `brand-${Date.now()}`,
        order: typeof brand.order === 'number' ? brand.order : this.content.brands.length + 1
      };
      this.content.brands.push(newBrand);
      this.recordAudit(`Added brand "${newBrand.name}"`, `नवीन ब्रँड जोडला: "${newBrand.name}"`, 'brand');
    }

    this.notify();

    fetch(`/api/content/brands/${encodeURIComponent(brand.id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(brand)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to save brand on server:', err));

    return { success: true };
  }

  public deleteBrand(id: string): { success: boolean; error?: string } {
    const item = this.content.brands.find((b) => b.id === id);
    this.content.brands = this.content.brands.filter((b) => b.id !== id);
    this.recordAudit(`Deleted brand "${item?.name || id}"`, `ब्रँड हटवला: "${item?.name || id}"`, 'brand');
    this.notify();

    fetch(`/api/content/brands/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getMutationHeaders()
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to delete brand on server:', err));

    return { success: true };
  }

  public reorderBrands(orderedIds: string[]): { success: boolean } {
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.content.brands.forEach((brand) => {
      if (orderMap.has(brand.id)) {
        brand.order = orderMap.get(brand.id)!;
      }
    });
    this.content.brands.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered connected brands sequence', 'ब्रँड्स क्रमवारी अद्यतनित केली', 'brand');
    this.notify();

    fetch('/api/content/brands/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify({ orderedIds })
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to reorder brands on server:', err));

    return { success: true };
  }

  public moveBrandOrder(id: string, direction: 'up' | 'down'): { success: boolean } {
    const sorted = [...this.content.brands].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((b) => b.id === id);
    if (idx === -1) return { success: false };

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return { success: false };

    const currentBrand = sorted[idx];
    const swapBrand = sorted[targetIdx];
    const tempOrder = currentBrand.order;
    currentBrand.order = swapBrand.order;
    swapBrand.order = tempOrder;

    return this.reorderBrands(sorted.map((b) => b.id));
  }

  // --- Field Visit Mutations ---
  public createFieldVisit(visit: Omit<FieldVisitItem, 'id'> & { id?: string }): { success: boolean; visit?: FieldVisitItem; error?: string } {
    const newVisit: FieldVisitItem = {
      ...visit,
      id: visit.id || `visit-${Date.now()}`,
      order: typeof visit.order === 'number' ? visit.order : this.content.fieldVisits.length + 1
    };
    this.content.fieldVisits.unshift(newVisit);
    this.recordAudit(`Added field visit: ${newVisit.titleEn}`, `शेत भेट नोंद जोडली: ${newVisit.titleMr}`, 'field-visit');
    this.notify();

    fetch('/api/content/field-visits', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(newVisit)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to create field visit on server:', err));

    return { success: true, visit: newVisit };
  }

  public updateFieldVisit(id: string, updates: Partial<FieldVisitItem>): { success: boolean; error?: string } {
    const idx = this.content.fieldVisits.findIndex((v) => v.id === id);
    if (idx === -1) return { success: false, error: 'Field visit not found' };

    this.content.fieldVisits[idx] = { ...this.content.fieldVisits[idx], ...updates, id };
    this.recordAudit(`Updated field visit: ${this.content.fieldVisits[idx].titleEn}`, `शेत भेट अद्यतनित केली: ${this.content.fieldVisits[idx].titleMr}`, 'field-visit');
    this.notify();

    fetch(`/api/content/field-visits/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(this.content.fieldVisits[idx])
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to update field visit on server:', err));

    return { success: true };
  }

  public saveFieldVisit(visit: FieldVisitItem): { success: boolean; error?: string } {
    if (this.content.fieldVisits.some((v) => v.id === visit.id)) {
      return this.updateFieldVisit(visit.id, visit);
    }
    return this.createFieldVisit(visit);
  }

  public deleteFieldVisit(id: string): { success: boolean; error?: string } {
    const item = this.content.fieldVisits.find((v) => v.id === id);
    this.content.fieldVisits = this.content.fieldVisits.filter((v) => v.id !== id);
    this.recordAudit(`Deleted field visit "${item?.titleEn || id}"`, `शेत भेट नोंद हटवली: "${item?.titleMr || id}"`, 'field-visit');
    this.notify();

    fetch(`/api/content/field-visits/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getMutationHeaders()
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to delete field visit on server:', err));

    return { success: true };
  }

  public reorderFieldVisits(orderedIds: string[]): { success: boolean } {
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.content.fieldVisits.forEach((visit) => {
      if (orderMap.has(visit.id)) {
        visit.order = orderMap.get(visit.id)!;
      }
    });
    this.content.fieldVisits.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered field visits gallery sequence', 'शेत भेटींची क्रमवारी अद्यतनित केली', 'field-visit');
    this.notify();

    fetch('/api/content/field-visits/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify({ orderedIds })
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to reorder field visits on server:', err));

    return { success: true };
  }

  public moveFieldVisitOrder(id: string, direction: 'up' | 'down'): { success: boolean } {
    const sorted = [...this.content.fieldVisits].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((v) => v.id === id);
    if (idx === -1) return { success: false };

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return { success: false };

    const currentVisit = sorted[idx];
    const swapVisit = sorted[targetIdx];
    const tempOrder = currentVisit.order;
    currentVisit.order = swapVisit.order;
    swapVisit.order = tempOrder;

    return this.reorderFieldVisits(sorted.map((v) => v.id));
  }

  // --- Field Experience Mutations ---
  public saveFieldExperience(fe: FieldExperience): { success: boolean; error?: string } {
    const idx = this.content.fieldExperiences.findIndex((f) => f.id === fe.id);
    if (idx >= 0) {
      this.content.fieldExperiences[idx] = { ...fe };
      this.recordAudit(`Updated field advisory: ${fe.titleEnglish}`, `कृषी सल्ला नोंद अद्यतनित केली: ${fe.titleMarathi}`, 'field-experience');
    } else {
      const newFe: FieldExperience = { ...fe, id: fe.id || `fe-${Date.now()}` };
      this.content.fieldExperiences.unshift(newFe);
      this.recordAudit(`Added field advisory: ${newFe.titleEnglish}`, `कृषी सल्ला नोंद जोडली: ${newFe.titleMarathi}`, 'field-experience');
    }
    this.notify();

    fetch(`/api/content/field-experiences/${encodeURIComponent(fe.id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(fe)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to save field experience on server:', err));

    return { success: true };
  }

  public deleteFieldExperience(id: string): { success: boolean; error?: string } {
    const item = this.content.fieldExperiences.find((f) => f.id === id);
    this.content.fieldExperiences = this.content.fieldExperiences.filter((f) => f.id !== id);
    this.recordAudit(`Deleted field experience "${item?.titleEnglish || id}"`, `कृषी सल्ला नोंद हटवली: "${item?.titleMarathi || id}"`, 'field-experience');
    this.notify();

    fetch(`/api/content/field-experiences/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getMutationHeaders()
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to delete field experience on server:', err));

    return { success: true };
  }

  // --- Farmer Results Mutations ---
  public createResult(resData: Omit<FarmerResult, 'id'> & { id?: string }): { success: boolean; result?: FarmerResult; error?: string } {
    const nameEn = resData.name?.en || resData.nameEn || 'Progressive Farmer';
    const nameMr = resData.name?.mr || resData.nameMr || 'शेतकरी बांधव';
    const locEn = resData.location?.en || resData.locationEn || 'Kaij Region';
    const locMr = resData.location?.mr || resData.locationMr || 'कैज परिसर';

    const newRes: FarmerResult = {
      ...resData,
      id: resData.id || `res-${Date.now()}`,
      name: { en: nameEn, mr: nameMr },
      location: { en: locEn, mr: locMr },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr,
      order: typeof resData.order === 'number' ? resData.order : this.content.results.length + 1
    };
    this.content.results.unshift(newRes);
    this.recordAudit(`Added farmer success result: ${newRes.name.en}`, `शेतकरी यशोगाथा जोडली: ${newRes.name.mr}`, 'result');
    this.notify();

    fetch('/api/content/results', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(newRes)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to create result on server:', err));

    return { success: true, result: newRes };
  }

  public updateResult(id: string, updates: Partial<FarmerResult>): { success: boolean; error?: string } {
    const idx = this.content.results.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: 'Result not found' };

    const current = this.content.results[idx];
    const nameEn = updates.name?.en || updates.nameEn || current.name.en;
    const nameMr = updates.name?.mr || updates.nameMr || current.name.mr;
    const locEn = updates.location?.en || updates.locationEn || current.location.en;
    const locMr = updates.location?.mr || updates.locationMr || current.location.mr;

    this.content.results[idx] = {
      ...current,
      ...updates,
      id,
      name: { en: nameEn, mr: nameMr },
      location: { en: locEn, mr: locMr },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr
    };
    this.recordAudit(`Updated farmer result: ${this.content.results[idx].name.en}`, `शेतकरी यशोगाथा अद्यतनित केली: ${this.content.results[idx].name.mr}`, 'result');
    this.notify();

    fetch(`/api/content/results/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(this.content.results[idx])
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to update result on server:', err));

    return { success: true };
  }

  public saveResult(r: FarmerResult): { success: boolean; error?: string } {
    if (this.content.results.some((item) => item.id === r.id)) {
      return this.updateResult(r.id, r);
    }
    return this.createResult(r);
  }

  public deleteResult(id: string): { success: boolean; error?: string } {
    const item = this.content.results.find((r) => r.id === id);
    this.content.results = this.content.results.filter((r) => r.id !== id);
    const displayNameEn = item?.name?.en || item?.nameEn || id;
    const displayNameMr = item?.name?.mr || item?.nameMr || id;
    this.recordAudit(`Deleted farmer result "${displayNameEn}"`, `शेतकरी यशोगाथा हटवली: "${displayNameMr}"`, 'result');
    this.notify();

    fetch(`/api/content/results/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getMutationHeaders()
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to delete result on server:', err));

    return { success: true };
  }

  public reorderResults(orderedIds: string[]): { success: boolean } {
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.content.results.forEach((res) => {
      if (orderMap.has(res.id)) {
        res.order = orderMap.get(res.id)!;
      }
    });
    this.content.results.sort((a, b) => (a.order || 0) - (b.order || 0));
    this.recordAudit('Reordered farmer results showcase sequence', 'शेतकरी यशोगाथांची क्रमवारी अद्यतनित केली', 'result');
    this.notify();

    fetch('/api/content/results/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify({ orderedIds })
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to reorder results on server:', err));

    return { success: true };
  }

  public moveResultOrder(id: string, direction: 'up' | 'down'): { success: boolean } {
    const sorted = [...this.content.results].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false };

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return { success: false };

    const currentRes = sorted[idx];
    const swapRes = sorted[targetIdx];
    const tempOrder = currentRes.order;
    currentRes.order = swapRes.order;
    swapRes.order = tempOrder;

    return this.reorderResults(sorted.map((r) => r.id));
  }

  // --- Business Info & Owner Profile Mutations ---
  public saveBusinessInfo(info: VerifiedBusinessInfo): { success: boolean } {
    this.content.businessInfo = { ...info };
    this.recordAudit('Updated verified business info', 'व्यवसाय माहिती अद्यतनित केली', 'contact');
    this.notify();

    fetch('/api/content/business-info', {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(info)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to save business info on server:', err));

    return { success: true };
  }

  public saveOwnerProfile(profile: OwnerProfile): { success: boolean } {
    this.content.ownerProfile = { ...profile };
    this.recordAudit('Updated owner profile', 'संस्थापक प्रोफाइल अद्यतनित केले', 'about');
    this.notify();

    fetch('/api/content/owner-profile', {
      method: 'PUT',
      credentials: 'include',
      headers: this.getMutationHeaders(),
      body: JSON.stringify(profile)
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to save owner profile on server:', err));

    return { success: true };
  }

  // --- Reset & Backup ---
  public resetToDefaults(): void {
    this.content = {
      products: sampleProducts,
      categories: defaultCategories,
      brands: [],
      fieldVisits: defaultFieldVisits.map((v, i) => ({ ...v, order: i + 1 })),
      fieldExperiences: defaultFieldExperiences,
      results: defaultFarmerResults.map((r, i) => ({ ...r, order: i + 1 })),
      businessInfo: defaultBusinessInfo,
      ownerProfile: defaultOwnerProfile,
      version: 4
    };
    this.recordAudit('Reset all content to verified initial defaults', 'सर्व सामग्री सुरुवातीच्या प्रमाणित स्थितीत पुनर्संचयित केली', 'system');
    this.notify();

    fetch('/api/content/reset', {
      method: 'POST',
      credentials: 'include',
      headers: this.getMutationHeaders()
    }).catch((err) => console.error('[CONTENT_SYNC] Failed to reset content on server:', err));
  }

  public exportBackupJson(): string {
    return JSON.stringify(this.content, null, 2);
  }

  public importBackupJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.products || !Array.isArray(parsed.products)) {
        return { success: false, error: 'Invalid backup file: Missing products array.' };
      }
      this.content = {
        products: parsed.products,
        categories: Array.isArray(parsed.categories) ? parsed.categories : defaultCategories,
        brands: Array.isArray(parsed.brands) ? parsed.brands : [],
        fieldVisits: Array.isArray(parsed.fieldVisits) ? parsed.fieldVisits : defaultFieldVisits.map((v, i) => ({ ...v, order: i + 1 })),
        fieldExperiences: Array.isArray(parsed.fieldExperiences) ? parsed.fieldExperiences : defaultFieldExperiences,
        results: Array.isArray(parsed.results) ? parsed.results : defaultFarmerResults.map((r, i) => ({ ...r, order: i + 1 })),
        businessInfo: parsed.businessInfo || defaultBusinessInfo,
        ownerProfile: parsed.ownerProfile || defaultOwnerProfile,
        version: 4
      };
      this.recordAudit('Imported content database from JSON backup', 'JSON बॅकअपमधून सामग्री डेटाबेस आयात केला', 'system');
      this.notify();

      fetch('/api/content/import', {
        method: 'POST',
        credentials: 'include',
        headers: this.getMutationHeaders(),
        body: JSON.stringify(parsed)
      }).catch((err) => console.error('[CONTENT_SYNC] Failed to import content on server:', err));

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to parse backup JSON file.' };
    }
  }
}

export const contentStore = new ContentStore();

export function useContentStore() {
  const [data, setData] = useState(() => ({
    products: contentStore.getProducts(),
    categories: contentStore.getCategories(false),
    allCategories: contentStore.getCategories(true),
    brands: contentStore.getBrands(),
    fieldVisits: contentStore.getFieldVisits(),
    fieldExperiences: contentStore.getFieldExperiences(),
    results: contentStore.getResults(),
    businessInfo: contentStore.getBusinessInfo(),
    ownerProfile: contentStore.getOwnerProfile(),
    auditLog: contentStore.getAuditLog()
  }));

  useEffect(() => {
    // Initial sync
    contentStore.syncFromServer();

    const unsubscribe = contentStore.subscribe(() => {
      setData({
        products: contentStore.getProducts(),
        categories: contentStore.getCategories(false),
        allCategories: contentStore.getCategories(true),
        brands: contentStore.getBrands(),
        fieldVisits: contentStore.getFieldVisits(),
        fieldExperiences: contentStore.getFieldExperiences(),
        results: contentStore.getResults(),
        businessInfo: contentStore.getBusinessInfo(),
        ownerProfile: contentStore.getOwnerProfile(),
        auditLog: contentStore.getAuditLog()
      });
    });
    return unsubscribe;
  }, []);

  return {
    ...data,
    saveProduct: (p: Product) => contentStore.saveProduct(p),
    createProduct: (p: Omit<Product, 'id'> & { id?: string }) => contentStore.createProduct(p),
    updateProduct: (id: string, updates: Partial<Product>) => contentStore.updateProduct(id, updates),
    toggleProductAvailability: (id: string) => contentStore.toggleProductAvailability(id),
    toggleProductFeatured: (id: string) => contentStore.toggleProductFeatured(id),
    deleteProduct: (id: string) => contentStore.deleteProduct(id),
    saveCategory: (c: NavCategory) => contentStore.saveCategory(c),
    createCategory: (c: Omit<NavCategory, 'id'> & { id?: string }) => contentStore.createCategory(c),
    updateCategory: (id: string, updates: Partial<NavCategory>) => contentStore.updateCategory(id, updates),
    toggleCategoryFeatured: (id: string) => contentStore.toggleCategoryFeatured(id),
    toggleCategoryActive: (id: string) => contentStore.toggleCategoryActive(id),
    deleteCategory: (id: string) => contentStore.deleteCategory(id),
    reorderCategories: (orderedIds: string[]) => contentStore.reorderCategories(orderedIds),
    moveCategoryOrder: (id: string, direction: 'up' | 'down') => contentStore.moveCategoryOrder(id, direction),
    saveBrand: (b: Brand) => contentStore.saveBrand(b),
    deleteBrand: (id: string) => contentStore.deleteBrand(id),
    reorderBrands: (orderedIds: string[]) => contentStore.reorderBrands(orderedIds),
    moveBrandOrder: (id: string, direction: 'up' | 'down') => contentStore.moveBrandOrder(id, direction),
    saveFieldVisit: (v: FieldVisitItem) => contentStore.saveFieldVisit(v),
    createFieldVisit: (v: Omit<FieldVisitItem, 'id'> & { id?: string }) => contentStore.createFieldVisit(v),
    updateFieldVisit: (id: string, updates: Partial<FieldVisitItem>) => contentStore.updateFieldVisit(id, updates),
    deleteFieldVisit: (id: string) => contentStore.deleteFieldVisit(id),
    reorderFieldVisits: (orderedIds: string[]) => contentStore.reorderFieldVisits(orderedIds),
    moveFieldVisitOrder: (id: string, direction: 'up' | 'down') => contentStore.moveFieldVisitOrder(id, direction),
    saveFieldExperience: (fe: FieldExperience) => contentStore.saveFieldExperience(fe),
    deleteFieldExperience: (id: string) => contentStore.deleteFieldExperience(id),
    saveResult: (r: FarmerResult) => contentStore.saveResult(r),
    createResult: (r: Omit<FarmerResult, 'id'> & { id?: string }) => contentStore.createResult(r),
    updateResult: (id: string, updates: Partial<FarmerResult>) => contentStore.updateResult(id, updates),
    deleteResult: (id: string) => contentStore.deleteResult(id),
    reorderResults: (orderedIds: string[]) => contentStore.reorderResults(orderedIds),
    moveResultOrder: (id: string, direction: 'up' | 'down') => contentStore.moveResultOrder(id, direction),
    saveBusinessInfo: (info: VerifiedBusinessInfo) => contentStore.saveBusinessInfo(info),
    saveOwnerProfile: (profile: OwnerProfile) => contentStore.saveOwnerProfile(profile),
    resetToDefaults: () => contentStore.resetToDefaults(),
    exportBackupJson: () => contentStore.exportBackupJson(),
    importBackupJson: (json: string) => contentStore.importBackupJson(json)
  };
}
