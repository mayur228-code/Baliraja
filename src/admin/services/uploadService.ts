import { authService } from '../auth/authService.ts';

export interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Upload an image (File or Base64 data URL) to the secure server upload storage.
 * Automatically attaches session cookies and anti-CSRF token.
 */
export async function uploadImageToServer(
  fileOrDataUrl: File | string,
  prefix = 'upload'
): Promise<UploadResponse> {
  let base64Payload = '';

  if (typeof fileOrDataUrl === 'string') {
    base64Payload = fileOrDataUrl;
  } else {
    // Read File to Base64 data URL
    try {
      base64Payload = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read image file.'));
          }
        };
        reader.onerror = () => reject(new Error('File reader error.'));
        reader.readAsDataURL(fileOrDataUrl);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  if (!base64Payload || !base64Payload.startsWith('data:image/')) {
    return { success: false, error: 'Invalid image format. Expected an image file or data URL.' };
  }

  const csrfToken = authService.getCsrfToken();

  try {
    const res = await fetch('/api/content/upload', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({
        image: base64Payload,
        prefix
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.errorEn || data.error || `Upload failed (HTTP ${res.status})`
      };
    }

    return {
      success: true,
      url: data.url,
      filename: data.filename,
      size: data.size,
      mimeType: data.mimeType
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Upload network error: ${msg}` };
  }
}

/**
 * Delete an uploaded image from server storage if no longer referenced.
 */
export async function deleteUploadedImageFromServer(url: string): Promise<{ success: boolean; error?: string }> {
  if (!url || !url.startsWith('/uploads/')) {
    return { success: true }; // Not a server-managed upload file
  }

  const csrfToken = authService.getCsrfToken();

  try {
    const res = await fetch('/api/content/upload', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.errorEn || data.error || `Delete failed (HTTP ${res.status})`
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
