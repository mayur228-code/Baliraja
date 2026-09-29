import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import crypto from 'node:crypto';
import { serverContentDb } from './contentDb.ts';
import { serverDb } from './db.ts';
import { getSessionToken, parseCookies, CSRF_COOKIE_NAME } from './routes.ts';
import { saveBase64Image, deleteUploadFile } from './storageService.ts';

export const contentRouter = Router();

// Extend Request type to carry admin user info
interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
  };
  sessionToken?: string;
}

// Helper to safely extract string ID from Express 5 params
function getParamId(req: Request): string {
  const raw = req.params?.id;
  if (Array.isArray(raw)) return raw[0] || '';
  return String(raw || '').trim();
}

// Middleware: Require valid HttpOnly Admin Session
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      errorEn: 'Unauthorized: Administrative sign-in required.',
      errorMr: 'अनधिकृत: प्रशासकीय लॉगिन आवश्यक आहे.'
    });
    return;
  }

  const session = serverDb.getSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      errorEn: 'Unauthorized: Session expired or invalid.',
      errorMr: 'अनधिकृत: सत्र संपले आहे किंवा अवैध आहे.'
    });
    return;
  }

  const admin = serverDb.getAdmin();
  if (!admin || admin.id !== session.userId) {
    res.status(403).json({
      success: false,
      errorEn: 'Forbidden: Insufficient privileges.',
      errorMr: 'निषिद्ध: अपुरे अधिकार.'
    });
    return;
  }

  req.adminUser = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    name: admin.name,
    role: admin.role
  };
  req.sessionToken = token;
  next();
}

// Middleware: Require valid Anti-CSRF Token for state mutations
export function requireCsrf(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.sessionToken || getSessionToken(req);
  const session = token ? serverDb.getSession(token) : null;

  if (!session) {
    res.status(401).json({
      success: false,
      errorEn: 'Unauthorized: Active session required.',
      errorMr: 'अनधिकृत: सक्रिय सत्र आवश्यक आहे.'
    });
    return;
  }

  const headerCsrf = ((req.headers['x-csrf-token'] as string) || (req.headers['x-xsrf-token'] as string) || '').trim();
  const cookieCsrf = (parseCookies(req.headers['cookie'])[CSRF_COOKIE_NAME] || '').trim();
  const tokenToVerify = headerCsrf || cookieCsrf;

  if (!session.csrfToken || !tokenToVerify) {
    res.status(403).json({
      success: false,
      errorEn: 'Security check failed: CSRF token missing.',
      errorMr: 'सुरक्षा पडताळणी अयशस्वी: CSRF टोकन गहाळ आहे.'
    });
    return;
  }

  const a = Buffer.from(session.csrfToken);
  const b = Buffer.from(tokenToVerify);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(403).json({
      success: false,
      errorEn: 'Security check failed: Invalid CSRF token.',
      errorMr: 'सुरक्षा पडताळणी अयशस्वी: अवैध CSRF टोकन.'
    });
    return;
  }

  next();
}

// Sanitization helper
function sanitizeString(val: unknown, maxLen = 5000): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. FULL CONTENT BUNDLE (Public Read, Protected Reset/Import/Export)
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/', (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const data = serverContentDb.getAllContent();
    const durationMs = Date.now() - startTime;
    console.log(`[DIAGNOSTIC_CONTENT_GET] Path: ${req.originalUrl || req.url} | Status: 200 | Products: ${data?.products?.length ?? 0} | Categories: ${data?.categories?.length ?? 0} | Duration: ${durationMs}ms`);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error(`[DIAGNOSTIC_CONTENT_GET_ERROR] Path: ${req.originalUrl || req.url} | Status: 500 | Duration: ${durationMs}ms | Error: ${errMsg}`);
    if (errStack) console.error(`[DIAGNOSTIC_CONTENT_GET_STACK]`, errStack);

    res.status(500).json({
      success: false,
      errorEn: 'Internal server error while retrieving catalog content.',
      errorMr: 'कॅटलॉग सामग्री मिळवताना सर्व्हर त्रुटी आली.'
    });
  }
});

contentRouter.post('/reset', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const data = serverContentDb.resetToDefaults(performedBy);
  res.json({ success: true, messageEn: 'Content reset to verified defaults', data });
});

contentRouter.post('/import', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const result = serverContentDb.importBackup(req.body, performedBy);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json({ success: true, data: serverContentDb.getAllContent() });
});

contentRouter.get('/export', requireAdminAuth, (_req: Request, res: Response) => {
  const data = serverContentDb.getAllContent();
  res.json(data);
});

contentRouter.get('/audit-log', requireAdminAuth, (_req: Request, res: Response) => {
  const data = serverContentDb.getAuditLog();
  res.json({ success: true, data });
});

// ════════════════════════════════════════════════════════════════════════════════
// 2. PRODUCTS CRUD
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/products', (_req: Request, res: Response) => {
  const products = serverContentDb.getProducts();
  res.json({ success: true, data: products });
});

contentRouter.get('/products/:id', (req: Request, res: Response) => {
  const id = getParamId(req);
  const product = serverContentDb.getProductById(id);
  if (!product) {
    res.status(404).json({ success: false, errorEn: 'Product not found' });
    return;
  }
  res.json({ success: true, data: product });
});

contentRouter.post('/products', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const body = req.body || {};

  const nameEnglish = sanitizeString(body.nameEnglish, 250);
  const nameMarathi = sanitizeString(body.nameMarathi, 250);
  if (!nameEnglish && !nameMarathi) {
    res.status(400).json({ success: false, errorEn: 'Product name in English or Marathi is required' });
    return;
  }

  const created = serverContentDb.createProduct(body, performedBy);
  res.status(201).json({ success: true, data: created });
});

contentRouter.put('/products/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateProduct(id, req.body || {}, performedBy);
  if (!updated) {
    res.status(404).json({ success: false, errorEn: 'Product not found' });
    return;
  }
  res.json({ success: true, data: updated });
});

contentRouter.patch('/products/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateProduct(id, req.body || {}, performedBy);
  if (!updated) {
    res.status(404).json({ success: false, errorEn: 'Product not found' });
    return;
  }
  res.json({ success: true, data: updated });
});

contentRouter.delete('/products/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const deleted = serverContentDb.deleteProduct(id, performedBy);
  if (!deleted) {
    res.status(404).json({ success: false, errorEn: 'Product not found' });
    return;
  }
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════════
// 3. CATEGORIES CRUD
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = serverContentDb.getCategories();
  res.json({ success: true, data: categories });
});

contentRouter.get('/categories/:id', (req: Request, res: Response) => {
  const id = getParamId(req);
  const category = serverContentDb.getCategoryById(id);
  if (!category) {
    res.status(404).json({ success: false, errorEn: 'Category not found' });
    return;
  }
  res.json({ success: true, data: category });
});

contentRouter.post('/categories', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const body = req.body || {};
  const name = sanitizeString(body.name, 150);
  if (!name) {
    res.status(400).json({ success: false, errorEn: 'Category name is required' });
    return;
  }

  const created = serverContentDb.createCategory(body, performedBy);
  res.status(201).json({ success: true, data: created });
});

contentRouter.put('/categories/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateCategory(id, req.body || {}, performedBy);
  if (!updated) {
    res.status(404).json({ success: false, errorEn: 'Category not found' });
    return;
  }
  res.json({ success: true, data: updated });
});

contentRouter.patch('/categories/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateCategory(id, req.body || {}, performedBy);
  if (!updated) {
    res.status(404).json({ success: false, errorEn: 'Category not found' });
    return;
  }
  res.json({ success: true, data: updated });
});

contentRouter.delete('/categories/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const deleted = serverContentDb.deleteCategory(id, performedBy);
  if (!deleted) {
    res.status(404).json({ success: false, errorEn: 'Category not found' });
    return;
  }
  res.json({ success: true });
});

contentRouter.post('/categories/reorder', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, errorEn: 'orderedIds must be an array of category IDs' });
    return;
  }
  const categories = serverContentDb.reorderCategories(orderedIds, performedBy);
  res.json({ success: true, data: categories });
});

// ════════════════════════════════════════════════════════════════════════════════
// 4. BRANDS CRUD
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/brands', (_req: Request, res: Response) => {
  const brands = serverContentDb.getBrands();
  res.json({ success: true, data: brands });
});

contentRouter.post('/brands', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const created = serverContentDb.createBrand(req.body || {}, performedBy);
  res.status(201).json({ success: true, data: created });
});

contentRouter.put('/brands/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateBrand(id, req.body || {}, performedBy);
  res.json({ success: true, data: updated });
});

contentRouter.delete('/brands/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const deleted = serverContentDb.deleteBrand(id, performedBy);
  if (!deleted) {
    res.status(404).json({ success: false, errorEn: 'Brand not found' });
    return;
  }
  res.json({ success: true });
});

contentRouter.post('/brands/reorder', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, errorEn: 'orderedIds must be an array of brand IDs' });
    return;
  }
  const brands = serverContentDb.reorderBrands(orderedIds, performedBy);
  res.json({ success: true, data: brands });
});

// ════════════════════════════════════════════════════════════════════════════════
// 5. FIELD VISITS CRUD
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/field-visits', (_req: Request, res: Response) => {
  const visits = serverContentDb.getFieldVisits();
  res.json({ success: true, data: visits });
});

contentRouter.post('/field-visits', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const created = serverContentDb.createFieldVisit(req.body || {}, performedBy);
  res.status(201).json({ success: true, data: created });
});

contentRouter.put('/field-visits/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateFieldVisit(id, req.body || {}, performedBy);
  if (!updated) {
    res.status(404).json({ success: false, errorEn: 'Field visit not found' });
    return;
  }
  res.json({ success: true, data: updated });
});

contentRouter.delete('/field-visits/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const deleted = serverContentDb.deleteFieldVisit(id, performedBy);
  if (!deleted) {
    res.status(404).json({ success: false, errorEn: 'Field visit not found' });
    return;
  }
  res.json({ success: true });
});

contentRouter.post('/field-visits/reorder', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, errorEn: 'orderedIds must be an array of visit IDs' });
    return;
  }
  const visits = serverContentDb.reorderFieldVisits(orderedIds, performedBy);
  res.json({ success: true, data: visits });
});

// ════════════════════════════════════════════════════════════════════════════════
// 6. FIELD EXPERIENCES CRUD
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/field-experiences', (_req: Request, res: Response) => {
  const data = serverContentDb.getFieldExperiences();
  res.json({ success: true, data });
});

contentRouter.post('/field-experiences', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const created = serverContentDb.createFieldExperience(req.body || {}, performedBy);
  res.status(201).json({ success: true, data: created });
});

contentRouter.put('/field-experiences/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateFieldExperience(id, req.body || {}, performedBy);
  res.json({ success: true, data: updated });
});

contentRouter.delete('/field-experiences/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const deleted = serverContentDb.deleteFieldExperience(id, performedBy);
  if (!deleted) {
    res.status(404).json({ success: false, errorEn: 'Field experience not found' });
    return;
  }
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════════
// 7. FARMER RESULTS CRUD
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/results', (_req: Request, res: Response) => {
  const results = serverContentDb.getResults();
  res.json({ success: true, data: results });
});

contentRouter.post('/results', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const created = serverContentDb.createResult(req.body || {}, performedBy);
  res.status(201).json({ success: true, data: created });
});

contentRouter.put('/results/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateResult(id, req.body || {}, performedBy);
  res.json({ success: true, data: updated });
});

contentRouter.delete('/results/:id', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const id = getParamId(req);
  const performedBy = req.adminUser?.name || 'Administrator';
  const deleted = serverContentDb.deleteResult(id, performedBy);
  if (!deleted) {
    res.status(404).json({ success: false, errorEn: 'Result not found' });
    return;
  }
  res.json({ success: true });
});

contentRouter.post('/results/reorder', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, errorEn: 'orderedIds must be an array of result IDs' });
    return;
  }
  const results = serverContentDb.reorderResults(orderedIds, performedBy);
  res.json({ success: true, data: results });
});

// ════════════════════════════════════════════════════════════════════════════════
// 8. BUSINESS INFO & OWNER PROFILE
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.get('/business-info', (_req: Request, res: Response) => {
  const businessInfo = serverContentDb.getBusinessInfo();
  res.json({ success: true, data: businessInfo });
});

contentRouter.put('/business-info', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateBusinessInfo(req.body || {}, performedBy);
  res.json({ success: true, data: updated });
});

contentRouter.get('/owner-profile', (_req: Request, res: Response) => {
  const ownerProfile = serverContentDb.getOwnerProfile();
  res.json({ success: true, data: ownerProfile });
});

contentRouter.put('/owner-profile', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const performedBy = req.adminUser?.name || 'Administrator';
  const updated = serverContentDb.updateOwnerProfile(req.body || {}, performedBy);
  res.json({ success: true, data: updated });
});

// ════════════════════════════════════════════════════════════════════════════════
// 9. PROTECTED IMAGE UPLOAD & ASSET MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════
contentRouter.post('/upload', requireAdminAuth, requireCsrf, async (req: AuthenticatedRequest, res: Response) => {
  const { image, dataUrl, prefix = 'upload' } = req.body || {};
  const payload = image || dataUrl;

  if (!payload || typeof payload !== 'string') {
    res.status(400).json({
      success: false,
      errorEn: 'Missing image payload. Please provide a valid Base64 data URL.',
      errorMr: 'प्रतिमा डेटा गहाळ आहे. कृपया वैध प्रतिमा डेटा निवडा.'
    });
    return;
  }

  const result = await saveBase64Image(payload, String(prefix));
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  const performedBy = req.adminUser?.name || 'Administrator';
  serverContentDb.recordAudit(
    `Uploaded media asset: ${result.filename} (${((result.size || 0) / 1024).toFixed(1)} KB)`,
    `मीडिया फाइल अपलोड केली: ${result.filename}`,
    'system',
    performedBy
  );

  res.status(201).json(result);
});

contentRouter.delete('/upload', requireAdminAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, errorEn: 'Image URL is required' });
    return;
  }

  // Check if image is currently referenced in any active catalog entity
  const allContent = serverContentDb.getAllContent();
  const referencedUrls = new Set<string>();

  allContent.products?.forEach((p) => {
    if (p.image) referencedUrls.add(p.image);
    if (p.imageUrl) referencedUrls.add(p.imageUrl);
  });
  allContent.categories?.forEach((c) => {
    if (c.image) referencedUrls.add(c.image);
  });
  allContent.brands?.forEach((b) => {
    if (b.logo) referencedUrls.add(b.logo);
  });
  allContent.fieldVisits?.forEach((v) => {
    if (v.imageSrc) referencedUrls.add(v.imageSrc);
  });
  allContent.results?.forEach((r) => {
    if (r.image) referencedUrls.add(r.image);
  });
  allContent.fieldExperiences?.forEach((f) => {
    if (f.image) referencedUrls.add(f.image);
  });
  if (allContent.ownerProfile?.image) referencedUrls.add(allContent.ownerProfile.image);

  if (referencedUrls.has(url)) {
    res.status(409).json({
      success: false,
      errorEn: 'Cannot delete image: It is currently assigned to one or more active catalog items.',
      errorMr: 'प्रतिमा हटवता येत नाही: ती सध्या इतर घटकांमध्ये वापरात आहे.'
    });
    return;
  }

  const deleted = deleteUploadFile(url);
  if (!deleted) {
    res.status(404).json({ success: false, errorEn: 'File not found or cannot be deleted.' });
    return;
  }

  res.json({ success: true, messageEn: 'Image file removed from server disk.' });
});
