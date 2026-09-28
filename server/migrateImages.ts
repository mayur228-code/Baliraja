import fs from 'node:fs';
import path from 'node:path';
import { saveBase64Image, verifyImageFile, UPLOADS_DIR } from './storageService.ts';
import type { ServerContentData } from './contentDb.ts';

const CONTENT_FILE = path.resolve(process.cwd(), 'server/data/content.json');

export interface MigrationReport {
  success: boolean;
  totalFound: number;
  totalMigrated: number;
  totalVerified: number;
  failedCount: number;
  backupPath: string | null;
  beforeSize: number;
  afterSize: number;
  migratedDetails: Array<{
    field: string;
    id: string;
    originalLength: number;
    newUrl: string;
    verified: boolean;
  }>;
  error?: string;
}

/**
 * Perform safe, non-destructive migration of all Base64 images to server disk files.
 */
export async function migrateBase64Images(): Promise<MigrationReport> {
  const report: MigrationReport = {
    success: false,
    totalFound: 0,
    totalMigrated: 0,
    totalVerified: 0,
    failedCount: 0,
    backupPath: null,
    beforeSize: 0,
    afterSize: 0,
    migratedDetails: []
  };

  if (!fs.existsSync(CONTENT_FILE)) {
    report.success = true;
    report.error = 'content.json does not exist.';
    return report;
  }

  const rawContent = fs.readFileSync(CONTENT_FILE, 'utf-8');
  report.beforeSize = Buffer.byteLength(rawContent, 'utf-8');

  let data: ServerContentData;
  try {
    data = JSON.parse(rawContent);
  } catch (err) {
    report.error = `Failed to parse content.json: ${err}`;
    return report;
  }

  // Find all Base64 images to migrate
  interface PendingMigration {
    type: string;
    id: string;
    field: string;
    base64: string;
    prefix: string;
    setter: (newUrl: string) => void;
  }

  const pending: PendingMigration[] = [];

  // 1. Categories
  if (Array.isArray(data.categories)) {
    data.categories.forEach((cat) => {
      if (cat.image && typeof cat.image === 'string' && cat.image.startsWith('data:image/')) {
        pending.push({
          type: 'category',
          id: cat.id,
          field: `category[${cat.id}].image`,
          base64: cat.image,
          prefix: 'cat',
          setter: (url) => { cat.image = url; }
        });
      }
    });
  }

  // 2. Brands
  if (Array.isArray(data.brands)) {
    data.brands.forEach((brand) => {
      if (brand.logo && typeof brand.logo === 'string' && brand.logo.startsWith('data:image/')) {
        pending.push({
          type: 'brand',
          id: brand.id,
          field: `brand[${brand.name || brand.id}].logo`,
          base64: brand.logo,
          prefix: 'brand',
          setter: (url) => { brand.logo = url; }
        });
      }
    });
  }

  // 3. Field Visits
  if (Array.isArray(data.fieldVisits)) {
    data.fieldVisits.forEach((visit) => {
      if (visit.imageSrc && typeof visit.imageSrc === 'string' && visit.imageSrc.startsWith('data:image/')) {
        pending.push({
          type: 'fieldVisit',
          id: visit.id,
          field: `fieldVisit[${visit.id}].imageSrc`,
          base64: visit.imageSrc,
          prefix: 'visit',
          setter: (url) => { visit.imageSrc = url; }
        });
      }
    });
  }

  // 4. Farmer Results
  if (Array.isArray(data.results)) {
    data.results.forEach((res) => {
      if (res.image && typeof res.image === 'string' && res.image.startsWith('data:image/')) {
        pending.push({
          type: 'result',
          id: res.id,
          field: `result[${res.id}].image`,
          base64: res.image,
          prefix: 'result',
          setter: (url) => { res.image = url; }
        });
      }
    });
  }

  // 5. Products
  if (Array.isArray(data.products)) {
    data.products.forEach((prod) => {
      if (prod.image && typeof prod.image === 'string' && prod.image.startsWith('data:image/')) {
        pending.push({
          type: 'product',
          id: prod.id,
          field: `product[${prod.id}].image`,
          base64: prod.image,
          prefix: 'prod',
          setter: (url) => {
            prod.image = url;
            if (prod.imageUrl && prod.imageUrl.startsWith('data:image/')) {
              prod.imageUrl = url;
            }
          }
        });
      } else if (prod.imageUrl && typeof prod.imageUrl === 'string' && prod.imageUrl.startsWith('data:image/')) {
        pending.push({
          type: 'product',
          id: prod.id,
          field: `product[${prod.id}].imageUrl`,
          base64: prod.imageUrl,
          prefix: 'prod',
          setter: (url) => { prod.imageUrl = url; }
        });
      }
    });
  }

  // 6. Field Experiences
  if (Array.isArray(data.fieldExperiences)) {
    data.fieldExperiences.forEach((fe) => {
      if (fe.image && typeof fe.image === 'string' && fe.image.startsWith('data:image/')) {
        pending.push({
          type: 'fieldExperience',
          id: fe.id,
          field: `fieldExperience[${fe.id}].image`,
          base64: fe.image,
          prefix: 'fe',
          setter: (url) => { fe.image = url; }
        });
      }
    });
  }

  // 7. Owner Profile
  if (data.ownerProfile?.image && typeof data.ownerProfile.image === 'string' && data.ownerProfile.image.startsWith('data:image/')) {
    pending.push({
      type: 'ownerProfile',
      id: 'owner',
      field: 'ownerProfile.image',
      base64: data.ownerProfile.image,
      prefix: 'owner',
      setter: (url) => { data.ownerProfile.image = url; }
    });
  }

  report.totalFound = pending.length;

  if (pending.length === 0) {
    console.log('[MIGRATION] No Base64 images found in content.json. Migration already complete.');
    report.success = true;
    report.afterSize = report.beforeSize;
    return report;
  }

  // Step 1: Create automatic backup before modifying anything
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.resolve(process.cwd(), `server/data/content_backup_pre_image_migration_${timestamp}.json`);
  try {
    fs.writeFileSync(backupFile, rawContent, 'utf-8');
    report.backupPath = backupFile;
    console.log(`[MIGRATION] Created safety backup: ${backupFile}`);
  } catch (err) {
    report.error = `Failed to create backup: ${err}`;
    return report;
  }

  // Step 2: Migrate each Base64 image to server/uploads/ and verify
  const createdFiles: string[] = [];
  let allVerified = true;

  for (const item of pending) {
    const uploadRes = await saveBase64Image(item.base64, item.prefix);
    if (!uploadRes.success || !uploadRes.url) {
      console.error(`[MIGRATION] FAILED to save ${item.field}:`, uploadRes.errorEn);
      report.failedCount++;
      allVerified = false;
      break;
    }

    createdFiles.push(uploadRes.url);

    // Verify written file immediately
    const verify = verifyImageFile(uploadRes.url);
    if (!verify.exists || !verify.valid || verify.size === 0) {
      console.error(`[MIGRATION] Verification failed for ${uploadRes.url}`);
      report.failedCount++;
      allVerified = false;
      break;
    }

    // Apply change to in-memory object
    item.setter(uploadRes.url);
    report.totalMigrated++;
    report.totalVerified++;
    report.migratedDetails.push({
      field: item.field,
      id: item.id,
      originalLength: item.base64.length,
      newUrl: uploadRes.url,
      verified: true
    });
  }

  // Step 3: Check if all migrations were successful
  if (!allVerified || report.failedCount > 0) {
    report.error = `Migration aborted: ${report.failedCount} images failed verification. No changes applied to content.json.`;
    console.error(`[MIGRATION] ABORTED: Restoring from backup. Cleaning up created files.`);
    // Clean up created files on failure to avoid orphans
    for (const fileUrl of createdFiles) {
      const filename = path.basename(fileUrl);
      const fullPath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch {}
      }
    }
    return report;
  }

  // Step 4: Write updated content.json atomically
  try {
    const newContentJson = JSON.stringify(data, null, 2);
    const tmpFile = `${CONTENT_FILE}.tmp_${Date.now()}`;
    fs.writeFileSync(tmpFile, newContentJson, 'utf-8');
    fs.renameSync(tmpFile, CONTENT_FILE);

    report.afterSize = Buffer.byteLength(newContentJson, 'utf-8');
    report.success = true;

    console.log(`====================================================`);
    console.log(`✅ [MIGRATION COMPLETE] Successfully migrated ${report.totalMigrated}/${report.totalFound} images.`);
    console.log(`   Before size: ${(report.beforeSize / 1024 / 1024).toFixed(2)} MB (${report.beforeSize} bytes)`);
    console.log(`   After size:  ${(report.afterSize / 1024).toFixed(2)} KB (${report.afterSize} bytes)`);
    console.log(`   Space saved: ${(((report.beforeSize - report.afterSize) / report.beforeSize) * 100).toFixed(1)}%`);
    console.log(`   Backup kept at: ${report.backupPath}`);
    console.log(`====================================================`);

    return report;
  } catch (err) {
    report.error = `Failed to write updated content.json: ${err}`;
    return report;
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.replace(/\\/g, '/').endsWith('server/migrateImages.ts')) {
  migrateBase64Images().then((rep) => {
    if (!rep.success) {
      console.error('Migration failed:', rep.error);
      process.exit(1);
    }
  }).catch((err) => {
    console.error('Fatal migration error:', err);
    process.exit(1);
  });
}
