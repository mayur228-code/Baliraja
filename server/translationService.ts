/**
 * BALIRAJA KRISHI SEVA KENDRA — Server Translation Service (Phase 3)
 * 
 * Secure backend translation engine with:
 * - Multi-tier upstream fallbacks (Primary: MyMemory, Secondary: Google Translate GTX)
 * - Server-only API key support via process.env.TRANSLATION_API_KEY / process.env.MYMEMORY_KEY
 * - Fast in-memory LRU/TTL caching
 * - Domain-specific agricultural terminology refinement for Marathi and English
 * - Timeout handling and strict validation
 */

export type LanguageCode = 'en' | 'mr';

export interface CacheEntry {
  translated: string;
  createdAt: number;
}

export class ServerTranslationService {
  // In-memory cache: key -> { translated, createdAt }
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize: number = 5000;
  private readonly ttlMs: number = 24 * 60 * 60 * 1000; // 24 hours

  // HTML entity decoder
  private decodeHtmlEntities(str: string): string {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&nbsp;/g, ' ');
  }

  // Agricultural terminology refinement for natural local phrasing
  public refineAgriculturalTranslation(text: string, targetLang: LanguageCode): string {
    let refined = this.decodeHtmlEntities(text);

    if (targetLang === 'mr') {
      // Standardize Marathi agricultural terminology
      refined = refined
        .replace(/पाणी\s*-\s*विद्रव्य/gi, 'विद्राव्य')
        .replace(/पाणी\s*विद्रव्य/gi, 'विद्राव्य')
        .replace(/पाण्यात\s*विद्रव्य/gi, 'विद्राव्य')
        .replace(/विद्रव्य/g, 'विद्राव्य')
        .replace(/कीडनाशक/g, 'कीटकनाशक')
        .replace(/बुरशी\s*नाशक/g, 'बुरशीनाशक')
        .replace(/तण\s*नाशक/g, 'तणनाशक')
        .replace(/बीज\s*उपचार/g, 'बीजप्रक्रिया')
        .replace(/कंद\s*सड/g, 'कंदकुज')
        .replace(/कंद\s*कुज/g, 'कंदकुज')
        .replace(/ठिबक\s*ग्रेड/gi, 'ठिबक दर्जा');
    } else {
      // English cleanup: fix formula spacing like "19: 19:19" -> "19:19:19"
      refined = refined
        .replace(/(\d+)\s*:\s*(\d+)\s*:\s*(\d+)/g, '$1:$2:$3')
        .replace(/\s+([.,;:!?])/g, '$1');
    }

    return refined.trim();
  }

  private getCacheKey(from: LanguageCode, to: LanguageCode, text: string): string {
    return `${from}:${to}:${text.trim()}`;
  }

  public getFromCache(from: LanguageCode, to: LanguageCode, text: string): string | null {
    const key = this.getCacheKey(from, to, text);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL expiration
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.translated;
  }

  public setInCache(from: LanguageCode, to: LanguageCode, text: string, translated: string): void {
    const key = this.getCacheKey(from, to, text);

    // Evict oldest if cache exceeds max size
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      translated,
      createdAt: Date.now()
    });
  }

  public getCacheMetrics(): { size: number; maxSize: number; ttlHours: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      ttlHours: this.ttlMs / (60 * 60 * 1000)
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // Tier 1: MyMemory Translation API
  private async fetchMyMemory(text: string, from: LanguageCode, to: LanguageCode): Promise<string | null> {
    try {
      const apiKey = process.env.TRANSLATION_API_KEY || process.env.MYMEMORY_KEY || '';
      const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
      const emailParam = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
      const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}${keyParam}${emailParam}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Baliraja-Krishi-Translation-Proxy/1.0'
        }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json() as any;
        if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
          const raw = data.responseData.translatedText;
          if (typeof raw === 'string' && !raw.startsWith('MYMEMORY WARNING:')) {
            return this.refineAgriculturalTranslation(raw, to);
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Tier 2: Google Translate GTX Fallback
  private async fetchGoogleFallback(text: string, from: LanguageCode, to: LanguageCode): Promise<string | null> {
    try {
      const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeout);

      if (!res.ok) return null;
      const data = await res.json() as any;
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((chunk: unknown) => (Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : ''))
          .join('');
        const trimmed = translated.trim();
        return trimmed ? this.refineAgriculturalTranslation(trimmed, to) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Translate single string
   */
  public async translateText(
    text: string,
    from: LanguageCode = 'en',
    to: LanguageCode = 'mr'
  ): Promise<{ text: string; cached: boolean }> {
    const trimmed = text.trim();
    if (!trimmed) {
      return { text: '', cached: false };
    }
    if (from === to) {
      return { text: trimmed, cached: false };
    }

    // 1. Check Server Cache
    const cached = this.getFromCache(from, to, trimmed);
    if (cached !== null) {
      return { text: cached, cached: true };
    }

    // 2. Primary: MyMemory
    const tier1 = await this.fetchMyMemory(trimmed, from, to);
    if (tier1) {
      this.setInCache(from, to, trimmed, tier1);
      return { text: tier1, cached: false };
    }

    // 3. Secondary: Google Fallback
    const tier2 = await this.fetchGoogleFallback(trimmed, from, to);
    if (tier2) {
      this.setInCache(from, to, trimmed, tier2);
      return { text: tier2, cached: false };
    }

    // If both upstream providers are unavailable on network, return trimmed text or error
    throw new Error('Translation upstream providers unavailable.');
  }

  /**
   * Translate array of strings (batch) with individual fallback resilience
   */
  public async translateBatch(
    texts: string[],
    from: LanguageCode = 'en',
    to: LanguageCode = 'mr'
  ): Promise<{ texts: string[]; allCached: boolean }> {
    let allCached = true;
    const results: string[] = [];

    for (const t of texts) {
      const trimmed = t.trim();
      if (!trimmed || from === to) {
        results.push(trimmed);
        continue;
      }

      // Check cache first
      const cached = this.getFromCache(from, to, trimmed);
      if (cached !== null) {
        results.push(cached);
        continue;
      }

      allCached = false;
      try {
        const res = await this.translateText(trimmed, from, to);
        results.push(res.text);
      } catch {
        // Fallback to original text if upstream is unreachable
        results.push(trimmed);
      }
    }

    return { texts: results, allCached };
  }
}

export const serverTranslationService = new ServerTranslationService();
