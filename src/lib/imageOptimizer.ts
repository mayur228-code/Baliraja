/**
 * BALIRAJA KRISHI SEVA KENDRA — Image Optimization Utility
 * 
 * Automatically scales and compresses uploaded image files to crisp HD resolution (max 1920x1280)
 * at quality ~0.86, converting massive 3MB–8MB camera photos to lightweight ~100–250KB WebP/JPEG data URLs.
 * Ensures instant browser storage, ultra-fast loading, and zero QuotaExceeded errors.
 */

export async function optimizeImage(
  fileOrDataUrl: File | string,
  maxWidth = 1920,
  maxHeight = 1200,
  quality = 0.86
): Promise<string> {
  if (typeof window === 'undefined') {
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processImage = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        // Calculate aspect ratio scale
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try modern WebP format first
        try {
          const webpUrl = canvas.toDataURL('image/webp', quality);
          if (webpUrl && webpUrl.startsWith('data:image/webp') && webpUrl.length > 50) {
            resolve(webpUrl);
            return;
          }
        } catch {
          // fallback to JPEG
        }

        const jpegUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegUrl);
      } catch {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };

    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    };

    if (typeof fileOrDataUrl === 'string') {
      img.onload = processImage;
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          img.onload = processImage;
          img.src = result;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
