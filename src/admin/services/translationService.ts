/**
 * BALIRAJA KRISHI SEVA KENDRA — Agricultural Translation Service (Client Adapter)
 * 
 * Proxies all translation requests through the secure server-side endpoint (/api/translate).
 * - ZERO client-side API keys or secrets.
 * - Server-managed multi-tier neural fallback (MyMemory + Google Translate GTX).
 * - Server-side and client-side short-lived caching for high responsiveness.
 * - Agricultural terminology refinement for authentic local Marathi and English terms.
 */

export type LanguageCode = 'en' | 'mr';

// In-memory client-side translation cache (key: "fromLang:toLang:text")
const clientTranslationCache = new Map<string, string>();

/**
 * Translates a single text string from source language to target language via backend proxy.
 * 
 * @param text The input text to translate.
 * @param fromLang Source language ('en' | 'mr').
 * @param toLang Target language ('en' | 'mr').
 * @returns The translated string.
 * @throws Error if translation fails or backend service is unreachable.
 */
export async function translateText(
  text: string,
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (fromLang === toLang) return trimmed;

  // Support test simulation for failure handling verification
  if (typeof window !== 'undefined' && (window as unknown as { __SIMULATE_TRANSLATION_FAILURE__?: boolean }).__SIMULATE_TRANSLATION_FAILURE__) {
    throw new Error('Simulated translation failure for verification.');
  }

  const cacheKey = `${fromLang}:${toLang}:${trimmed}`;
  if (clientTranslationCache.has(cacheKey)) {
    return clientTranslationCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: trimmed,
        from: fromLang,
        to: toLang,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json() as { success?: boolean; text?: string; errorEn?: string };
      if (data && data.success && typeof data.text === 'string') {
        clientTranslationCache.set(cacheKey, data.text);
        return data.text;
      }
      throw new Error(data.errorEn || 'Translation failed.');
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error((errData as { errorEn?: string }).errorEn || 'Translation service temporarily unavailable.');
  } catch (err: unknown) {
    if (err instanceof Error && err.message) {
      throw err;
    }
    throw new Error('Translation service is temporarily unreachable.');
  }
}

/**
 * Translates an array of strings (e.g. suitable crops, tags) via backend batch proxy.
 */
export async function translateArray(
  items: string[],
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string[]> {
  const filtered = items.map((i) => i.trim()).filter(Boolean);
  if (filtered.length === 0) return [];
  if (fromLang === toLang) return filtered;

  // Support test simulation for failure handling verification
  if (typeof window !== 'undefined' && (window as unknown as { __SIMULATE_TRANSLATION_FAILURE__?: boolean }).__SIMULATE_TRANSLATION_FAILURE__) {
    throw new Error('Simulated translation failure for verification.');
  }

  // Check if all items are already cached locally
  const allCached = filtered.every((item) => clientTranslationCache.has(`${fromLang}:${toLang}:${item}`));
  if (allCached) {
    return filtered.map((item) => clientTranslationCache.get(`${fromLang}:${toLang}:${item}`)!);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: filtered,
        from: fromLang,
        to: toLang,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json() as { success?: boolean; texts?: string[]; errorEn?: string };
      if (data && data.success && Array.isArray(data.texts)) {
        data.texts.forEach((translated, idx) => {
          const original = filtered[idx];
          if (original) {
            clientTranslationCache.set(`${fromLang}:${toLang}:${original}`, translated);
          }
        });
        return data.texts;
      }
    }

    // Fallback to sequential translation if batch format returns unexpected payload
    return await Promise.all(
      filtered.map((item) => translateText(item, fromLang, toLang))
    );
  } catch {
    // Graceful fallback to sequential translation
    return await Promise.all(
      filtered.map((item) => translateText(item, fromLang, toLang))
    );
  }
}

/**
 * Translates multi-line text (e.g. key highlights, bullet points) line by line.
 */
export async function translateMultiLineText(
  text: string,
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';
  if (fromLang === toLang) return text;

  const translatedLines = await translateArray(lines, fromLang, toLang);
  return translatedLines.join('\n');
}

/**
 * Translates a comma-separated list of items (e.g. "Cotton, Soybean, Chilli").
 */
export async function translateCommaSeparated(
  csv: string,
  fromLang: LanguageCode,
  toLang: LanguageCode
): Promise<string> {
  const parts = csv
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return '';
  if (fromLang === toLang) return csv;

  const translated = await translateArray(parts, fromLang, toLang);
  return translated.join(', ');
}
