import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'server/uploads');

// Ensure upload directory exists on server initialization
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface ImageValidationResult {
  valid: boolean;
  mimeType: string;
  extension: string;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  errorEn?: string;
  errorMr?: string;
}

/**
 * Validate image buffer using cryptographic magic bytes / header signatures.
 * Never trust user-provided extensions or Content-Type headers alone.
 */
export function validateImageBuffer(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, mimeType: '', extension: '', error: 'File is empty.' };
  }

  // 15 MB Maximum file size limit
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, mimeType: '', extension: '', error: 'File size exceeds maximum 15MB limit.' };
  }

  // 1. WebP: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, mimeType: 'image/webp', extension: '.webp' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: 'image/png', extension: '.png' };
  }

  // 3. JPEG / JPG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  ) {
    return { valid: true, mimeType: 'image/jpeg', extension: '.jpg' };
  }

  // 4. GIF: 47 49 46 38 (GIF87a / GIF89a)
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return { valid: true, mimeType: 'image/gif', extension: '.gif' };
  }

  // 5. SVG: Text-based inspection with strict XML sanitization (No script execution)
  const headerSample = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf-8').trim().toLowerCase();
  if (headerSample.includes('<svg') || headerSample.includes('<?xml')) {
    const fullText = buffer.toString('utf-8').toLowerCase();
    if (fullText.includes('<svg') && fullText.includes('</svg>')) {
      // Reject dangerous active content embedded inside SVGs
      const dangerousPatterns = [
        '<script',
        'javascript:',
        'onload=',
        'onerror=',
        'onclick=',
        'onmouseover=',
        '<foreignobject',
        'xlink:href="javascript',
        'xlink:href=\'javascript'
      ];

      const hasDanger = dangerousPatterns.some((pattern) => fullText.includes(pattern));
      if (hasDanger) {
        return { valid: false, mimeType: '', extension: '', error: 'SVG contains disallowed executable script elements.' };
      }

      return { valid: true, mimeType: 'image/svg+xml', extension: '.svg' };
    }
  }

  return { valid: false, mimeType: '', extension: '', error: 'Unsupported or corrupted image format. Please upload WebP, PNG, JPEG, GIF, or clean SVG.' };
}

/**
 * Generate a cryptographically secure random filename.
 * Never uses or trusts client-supplied filenames to prevent path traversal and arbitrary execution.
 */
export function generateSafeFilename(prefix: string, extension: string): string {
  const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, '').toLowerCase().slice(0, 16) || 'upload';
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  const cleanExt = extension.startsWith('.') ? extension : `.${extension}`;
  return `${safePrefix}_${timestamp}_${randomHex}${cleanExt}`;
}

/**
 * Extract binary Buffer from a Base64 data URL or raw Base64 string.
 */
export function extractBufferFromBase64(dataUrlOrBase64: string): { buffer: Buffer; declaredMime?: string } | null {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') return null;

  const trimmed = dataUrlOrBase64.trim();
  const matches = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

  if (matches && matches[2]) {
    try {
      const buffer = Buffer.from(matches[2], 'base64');
      return { buffer, declaredMime: matches[1] };
    } catch {
      return null;
    }
  }

  // Raw base64 string fallback
  try {
    const buffer = Buffer.from(trimmed, 'base64');
    return { buffer };
  } catch {
    return null;
  }
}

/**
 * Save an uploaded Base64 image directly to the secure server upload folder.
 */
export async function saveBase64Image(dataUrlOrBase64: string, prefix = 'upload'): Promise<UploadResult> {
  const extracted = extractBufferFromBase64(dataUrlOrBase64);
  if (!extracted || !extracted.buffer || extracted.buffer.length === 0) {
    return {
      success: false,
      errorEn: 'Invalid or malformed Base64 image payload.',
      errorMr: 'अवैध किंवा दूषित प्रतिमा डेटा.'
    };
  }

  return saveBinaryImage(extracted.buffer, prefix);
}

/**
 * Synchronously converts a Base64 data URL to a persistent server upload file.
 * Returns the public /uploads/... URL or the original string if not base64.
 */
export function saveBase64ImageSync(dataUrlOrBase64: string, prefix = 'upload'): string {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string' || !dataUrlOrBase64.startsWith('data:image/')) {
    return dataUrlOrBase64;
  }
  const extracted = extractBufferFromBase64(dataUrlOrBase64);
  if (!extracted || !extracted.buffer || extracted.buffer.length === 0) {
    return dataUrlOrBase64;
  }
  const validation = validateImageBuffer(extracted.buffer);
  if (!validation.valid) {
    return dataUrlOrBase64;
  }
  const filename = generateSafeFilename(prefix, validation.extension);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!path.resolve(filePath).startsWith(UPLOADS_DIR)) {
    return dataUrlOrBase64;
  }
  try {
    const tmpPath = `${filePath}.tmp_${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tmpPath, extracted.buffer);
    fs.renameSync(tmpPath, filePath);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('[STORAGE_SERVICE] Failed to save base64 image synchronously:', err);
    return dataUrlOrBase64;
  }
}

/**
 * Save raw binary image Buffer to server uploads directory with full validation.
 */
export async function saveBinaryImage(buffer: Buffer, prefix = 'upload'): Promise<UploadResult> {
  const validation = validateImageBuffer(buffer);
  if (!validation.valid) {
    return {
      success: false,
      errorEn: validation.error || 'Image validation failed.',
      errorMr: 'प्रतिमा पडताळणी अयशस्वी. कृपया योग्य फॉरमॅट निवडा.'
    };
  }

  const filename = generateSafeFilename(prefix, validation.extension);
  const filePath = path.join(UPLOADS_DIR, filename);

  // Security check: Verify filePath does not escape UPLOADS_DIR
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOADS_DIR)) {
    return {
      success: false,
      errorEn: 'Security violation: Path traversal detected.',
      errorMr: 'सुरक्षा त्रुटी: अवैध मार्ग आढळला.'
    };
  }

  try {
    // Write file atomically via tmp file
    const tmpPath = `${filePath}.tmp_${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, filePath);

    // Verify written file exists and matches size
    const stat = fs.statSync(filePath);
    if (stat.size !== buffer.length) {
      throw new Error(`Written file size mismatch (expected ${buffer.length}, got ${stat.size})`);
    }

    const publicUrl = `/uploads/${filename}`;
    return {
      success: true,
      url: publicUrl,
      filename,
      size: stat.size,
      mimeType: validation.mimeType
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[STORAGE_SERVICE] Failed to save image file to disk:', msg);
    return {
      success: false,
      errorEn: `Server storage error: ${msg}`,
      errorMr: 'सर्व्हरवर प्रतिमा जतन करताना त्रुटी आली.'
    };
  }
}

/**
 * Verify if a given image URL or filename exists on server disk and is a valid image.
 */
export function verifyImageFile(urlOrFilename: string): { exists: boolean; size: number; valid: boolean } {
  if (!urlOrFilename || typeof urlOrFilename !== 'string') {
    return { exists: false, size: 0, valid: false };
  }

  const cleanName = path.basename(urlOrFilename.replace(/^\/uploads\//, '').split('?')[0]);
  const filePath = path.join(UPLOADS_DIR, cleanName);

  if (!path.resolve(filePath).startsWith(UPLOADS_DIR)) {
    return { exists: false, size: 0, valid: false };
  }

  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (stat.isFile() && stat.size > 0) {
        const header = fs.readFileSync(filePath, { flag: 'r' });
        const validation = validateImageBuffer(header);
        return { exists: true, size: stat.size, valid: validation.valid };
      }
    }
  } catch {
    // ignore
  }

  return { exists: false, size: 0, valid: false };
}

/**
 * Safely delete an uploaded file from server disk.
 */
export function deleteUploadFile(urlOrFilename: string): boolean {
  if (!urlOrFilename || typeof urlOrFilename !== 'string') return false;
  if (!urlOrFilename.startsWith('/uploads/') && !urlOrFilename.includes('server/uploads')) {
    return false; // Do not touch static assets or external URLs
  }

  const cleanName = path.basename(urlOrFilename.replace(/^\/uploads\//, '').split('?')[0]);
  const filePath = path.join(UPLOADS_DIR, cleanName);

  if (!path.resolve(filePath).startsWith(UPLOADS_DIR)) {
    return false;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.error(`[STORAGE_SERVICE] Failed to delete file ${filePath}:`, err);
  }
  return false;
}
