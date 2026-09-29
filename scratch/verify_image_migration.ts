import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import app from '../server/index.ts';
import { serverContentDb } from '../server/contentDb.ts';
import { serverDb } from '../server/db.ts';
import { 
  UPLOADS_DIR, 
  validateImageBuffer, 
  verifyImageFile
} from '../server/storageService.ts';

// 1x1 transparent PNG base64
const TEST_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Test runner helper
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, description: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${description}`);
  }
}

async function runVerificationSuite(): Promise<void> {
  console.log('====================================================');
  console.log('🧪 RUNNING BALIRAJA IMAGE STORAGE VERIFICATION SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST GROUP 1: Backup & Storage Directory Integrity
  // ----------------------------------------------------
  console.log('📁 1. BACKUP & STORAGE DIRECTORY INTEGRITY:');
  const backupFiles = fs.readdirSync(path.resolve(process.cwd(), 'server/data'))
    .filter(f => f.startsWith('content_backup_pre_image_migration_') && f.endsWith('.json'));
  assert(backupFiles.length >= 1, `Automated pre-migration backup found: ${backupFiles[0]}`);

  if (backupFiles.length > 0) {
    const backupPath = path.resolve(process.cwd(), 'server/data', backupFiles[0]);
    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    assert(backupContent.length > 1000000, `Pre-migration backup is intact and complete (${(backupContent.length / 1024 / 1024).toFixed(2)} MB)`);
    const base64CountInBackup = (backupContent.match(/data:image\//g) || []).length;
    assert(base64CountInBackup === 12, `Pre-migration backup verified to contain exactly 12 Base64 images (Found: ${base64CountInBackup})`);
  }

  assert(fs.existsSync(UPLOADS_DIR), `Persistent upload directory exists at ${UPLOADS_DIR}`);

  // ----------------------------------------------------
  // TEST GROUP 2: Migrated Image Files & Signatures on Disk
  // ----------------------------------------------------
  console.log('\n🖼️ 2. MIGRATED IMAGE VERIFICATION (MAGIC BYTES & INTEGRITY):');
  const uploadedFiles = fs.readdirSync(UPLOADS_DIR);
  assert(uploadedFiles.length >= 12, `At least 12 migrated image files exist on disk (Found: ${uploadedFiles.length})`);

  let allFilesValid = true;
  for (const file of uploadedFiles) {
    const filePath = path.join(UPLOADS_DIR, file);
    const stat = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);
    const validation = validateImageBuffer(buffer);
    if (!validation.valid || stat.size === 0) {
      allFilesValid = false;
      console.error(`     File corrupt or invalid format: ${file}`);
    }
  }
  assert(allFilesValid, `All ${uploadedFiles.length} files in server/uploads/ have verified cryptographic magic bytes headers`);

  // ----------------------------------------------------
  // TEST GROUP 3: Database & Zero Base64 State in content.json
  // ----------------------------------------------------
  console.log('\n💾 3. DATABASE (content.json) ZERO-BASE64 & SIZE AUDIT:');
  const contentPath = path.resolve(process.cwd(), 'server/data/content.json');
  const currentContentRaw = fs.readFileSync(contentPath, 'utf-8');
  const currentBase64Occurrences = (currentContentRaw.match(/data:image\//g) || []).length;
  assert(currentBase64Occurrences === 0, `Zero Base64 images remaining in content.json (Found: ${currentBase64Occurrences})`);
  assert(currentContentRaw.length < 150000, `content.json size successfully reduced to ${(currentContentRaw.length / 1024).toFixed(2)} KB (down from 3.45 MB)`);

  const currentDb = serverContentDb.getAllContent();
  assert(Array.isArray(currentDb.products) && currentDb.products.length > 0, `Products array loaded properly (${currentDb.products.length} products)`);
  assert(Array.isArray(currentDb.categories) && currentDb.categories.length > 0, `Categories array loaded properly (${currentDb.categories.length} categories)`);
  assert(Array.isArray(currentDb.brands) && currentDb.brands.length > 0, `Brands array loaded properly (${currentDb.brands.length} brands)`);
  assert(Array.isArray(currentDb.fieldVisits) && currentDb.fieldVisits.length > 0, `Field visits array loaded properly (${currentDb.fieldVisits.length} visits)`);
  assert(Array.isArray(currentDb.results) && currentDb.results.length > 0, `Results array loaded properly (${currentDb.results.length} results)`);

  // Verify each migrated entity's image URL format
  const migratedCategory = currentDb.categories.find(c => c.image?.startsWith('/uploads/'));
  assert(Boolean(migratedCategory?.image?.startsWith('/uploads/')), `Category image migrated to /uploads/... (${migratedCategory?.name}: ${migratedCategory?.image})`);

  const sampleBrand = currentDb.brands.find(b => b.logo?.startsWith('/uploads/'));
  assert(Boolean(sampleBrand?.logo?.startsWith('/uploads/')), `Brand logo migrated to /uploads/... (${sampleBrand?.name}: ${sampleBrand?.logo})`);

  const sampleVisit = currentDb.fieldVisits.find(v => v.imageSrc?.startsWith('/uploads/'));
  assert(Boolean(sampleVisit?.imageSrc?.startsWith('/uploads/')), `Field visit image migrated to /uploads/... (${sampleVisit?.titleEn}: ${sampleVisit?.imageSrc})`);

  const sampleResult = currentDb.results.find(r => r.image?.startsWith('/uploads/'));
  assert(Boolean(sampleResult?.image?.startsWith('/uploads/')), `Farmer result image migrated to /uploads/... (${sampleResult?.name.en}: ${sampleResult?.image})`);

  // ----------------------------------------------------
  // TEST GROUP 4: HTTP Server Endpoints & Security Checks
  // ----------------------------------------------------
  console.log('\n🔒 4. HTTP ROUTES, SECURITY & AUTH CHECKS:');
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, resolve));
  const port = (testServer.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 4.1 Test static image serving
    const firstUploadFile = uploadedFiles[0];
    const imageRes = await fetch(`${baseUrl}/uploads/${firstUploadFile}`);
    assert(imageRes.status === 200, `GET /uploads/${firstUploadFile} returned 200 OK`);
    assert(imageRes.headers.get('x-content-type-options') === 'nosniff', `X-Content-Type-Options: nosniff header present`);
    assert(Boolean(imageRes.headers.get('cache-control')?.includes('public')), `Cache-Control header configured for caching`);

    // 4.2 Test Path Traversal Attack Protection
    const pathTraversalRes = await fetch(`${baseUrl}/uploads/..%2Fdata%2Fadmin_auth.json`);
    assert(pathTraversalRes.status === 403 || pathTraversalRes.status === 404, `Path traversal attempt blocked with HTTP ${pathTraversalRes.status}`);

    const directDotDotRes = await fetch(`${baseUrl}/uploads/../data/admin_auth.json`);
    assert(directDotDotRes.status === 403 || directDotDotRes.status === 404, `Direct ../ path traversal blocked with HTTP ${directDotDotRes.status}`);

    // 4.3 Test Unauthorized Upload
    const unauthUploadRes = await fetch(`${baseUrl}/api/content/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: TEST_PNG_BASE64, prefix: 'test' })
    });
    assert(unauthUploadRes.status === 401, `Unauthorized upload request rejected with 401 Unauthorized`);

    // 4.4 Test Authorized Upload (Session + CSRF)
    const admin = serverDb.getAdmin();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    serverDb.createSession(sessionToken, admin!.id, 3600000, csrfToken);

    const authUploadRes = await fetch(`${baseUrl}/api/content/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `baliraja_admin_session=${sessionToken}; baliraja_admin_csrf=${csrfToken}`,
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ image: TEST_PNG_BASE64, prefix: 'verify_test' })
    });

    const uploadJson = await authUploadRes.json();
    assert(authUploadRes.status === 201 && uploadJson.success === true, `Authorized upload succeeded with HTTP 201: ${uploadJson.url}`);
    const testFileOnDisk = verifyImageFile(uploadJson.url);
    assert(testFileOnDisk.exists && testFileOnDisk.valid, `Uploaded test file physically exists and is verified valid on disk`);

    // 4.5 Test Image Deletion Protection (Referenced vs Unreferenced)
    // A) Attempt to delete actively referenced category image -> should be rejected with 409
    const deleteReferencedRes = await fetch(`${baseUrl}/api/content/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `baliraja_admin_session=${sessionToken}; baliraja_admin_csrf=${csrfToken}`,
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ url: migratedCategory!.image })
    });
    assert(deleteReferencedRes.status === 409, `Deletion of actively referenced image rejected with 409 Conflict`);

    // B) Delete the unreferenced test image -> should succeed with 200
    const deleteUnreferencedRes = await fetch(`${baseUrl}/api/content/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `baliraja_admin_session=${sessionToken}; baliraja_admin_csrf=${csrfToken}`,
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ url: uploadJson.url })
    });
    assert(deleteUnreferencedRes.status === 200, `Deletion of unreferenced test image succeeded with 200 OK`);
    const afterDeleteVerification = verifyImageFile(uploadJson.url);
    assert(!afterDeleteVerification.exists, `Test image successfully removed from server disk`);

    // Clean up test session
    serverDb.deleteSession(sessionToken);

  } finally {
    testServer.close();
  }

  // ----------------------------------------------------
  // TEST GROUP 5: External Image URL Preservation
  // ----------------------------------------------------
  console.log('\n🌐 5. EXTERNAL URL PRESERVATION TEST:');
  const externalUrl = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800';
  const createdProd = serverContentDb.createProduct({
    nameEnglish: 'Test External Product',
    nameMarathi: 'चाचणी उत्पादन',
    image: externalUrl,
    imageUrl: externalUrl
  }, 'VerificationSuite');

  assert(createdProd.image === externalUrl, `External image URL preserved without being overwritten (${createdProd.image})`);
  assert(createdProd.imageUrl === externalUrl, `External imageUrl preserved intact`);
  serverContentDb.deleteProduct(createdProd.id, 'VerificationSuite');

  // ----------------------------------------------------
  // TEST GROUP 6: Persistence across Server Restart Simulation
  // ----------------------------------------------------
  console.log('\n🔄 6. SERVER RESTART / PERSISTENCE SIMULATION:');
  const reloadedData = serverContentDb.loadDatabase();
  assert(reloadedData.products.length > 0, `Data reloaded from disk with full product catalog (${reloadedData.products.length})`);
  assert(reloadedData.brands.length === 6, `Brands array persists 6 verified brands across reload`);
  assert(reloadedData.fieldVisits.length === 5, `Field visits array persists 5 visits across reload`);
  assert(reloadedData.results.length === 6, `Results array persists 6 results across reload`);

  // Final Summary
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerificationSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
