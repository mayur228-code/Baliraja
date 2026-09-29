import type { Request, Response } from 'express';
import { Router } from 'express';
import { serverTranslationService, type LanguageCode } from './translationService';
import { getClientIp } from './routes';

export const translationRouter = Router();

// Rate limiter storage for translation endpoint: IP -> { count, windowStart }
const translationRateLimits: Record<string, { count: number; windowStart: number }> = {};
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute per IP

function checkTranslationRateLimit(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = translationRateLimits[ip];

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    translationRateLimits[ip] = { count: 1, windowStart: now };
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetMs: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetMs = RATE_LIMIT_WINDOW_MS - (now - record.windowStart);
    return { allowed: false, remaining: 0, resetMs };
  }

  record.count += 1;
  const remaining = MAX_REQUESTS_PER_WINDOW - record.count;
  const resetMs = RATE_LIMIT_WINDOW_MS - (now - record.windowStart);
  return { allowed: true, remaining, resetMs };
}

// Validation helper for language code
function isValidLanguage(lang: unknown): lang is LanguageCode {
  return lang === 'en' || lang === 'mr';
}

/**
 * POST /api/translate
 * Body options:
 * 1) { text: string, from?: 'en' | 'mr', to?: 'en' | 'mr' }
 * 2) { texts: string[], from?: 'en' | 'mr', to?: 'en' | 'mr' }
 */
translationRouter.post('/', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const rateLimit = checkTranslationRateLimit(clientIp);

  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetMs / 1000)));

  if (!rateLimit.allowed) {
    res.status(429).json({
      success: false,
      errorEn: 'Too many translation requests. Please slow down.',
      errorMr: 'अनुवाद विनंत्यांची मर्यादा ओलांडली. कृपया थोडा वेळ थांबून पुन्हा प्रयत्न करा.'
    });
    return;
  }

  const { text, texts, from = 'en', to = 'mr' } = req.body || {};

  // 1. Language validation
  if (!isValidLanguage(from) || !isValidLanguage(to)) {
    res.status(400).json({
      success: false,
      errorEn: "Invalid language parameters. Supported languages are 'en' and 'mr'.",
      errorMr: 'अवैध भाषा पर्याय. फक्त इंग्रजी (en) व मराठी (mr) समर्थित आहेत.'
    });
    return;
  }

  // 2. Single text translation
  if (typeof text === 'string') {
    if (text.length > 5000) {
      res.status(400).json({
        success: false,
        errorEn: 'Text too large. Maximum length is 5,000 characters per request.',
        errorMr: 'मजकूर खूप मोठा आहे. कमाल मर्यादा ५,००० अक्षरे आहे.'
      });
      return;
    }

    try {
      const result = await serverTranslationService.translateText(text, from, to);
      res.setHeader('X-Cache', result.cached ? 'HIT' : 'MISS');
      res.json({
        success: true,
        text: result.text,
        cached: result.cached
      });
      return;
    } catch {
      res.status(503).json({
        success: false,
        errorEn: 'Translation service is temporarily unreachable.',
        errorMr: 'अनुवाद सेवा सध्या उपलब्ध नाही. कृपया काही वेळाने पुन्हा प्रयत्न करा.'
      });
      return;
    }
  }

  // 3. Batch texts translation
  if (Array.isArray(texts)) {
    if (texts.length > 50) {
      res.status(400).json({
        success: false,
        errorEn: 'Batch limit exceeded. Maximum 50 items allowed per batch.',
        errorMr: 'तुकड्यांची मर्यादा ओलांडली. एकाच वेळी जास्तीत जास्त ५० आयटम समर्थित आहेत.'
      });
      return;
    }

    for (let i = 0; i < texts.length; i++) {
      if (typeof texts[i] !== 'string' || texts[i].length > 2000) {
        res.status(400).json({
          success: false,
          errorEn: `Invalid text item at index ${i}. Each item must be a string under 2,000 characters.`,
          errorMr: 'अवैध मजकूर आयटम आढळला.'
        });
        return;
      }
    }

    try {
      const result = await serverTranslationService.translateBatch(texts, from, to);
      res.setHeader('X-Cache', result.allCached ? 'HIT' : 'MISS');
      res.json({
        success: true,
        texts: result.texts,
        allCached: result.allCached
      });
      return;
    } catch {
      res.status(503).json({
        success: false,
        errorEn: 'Translation service is temporarily unreachable.',
        errorMr: 'अनुवाद सेवा सध्या उपलब्ध नाही. कृपया काही वेळाने पुन्हा प्रयत्न करा.'
      });
      return;
    }
  }

  // If neither text nor texts provided
  res.status(400).json({
    success: false,
    errorEn: "Missing 'text' or 'texts' in request body.",
    errorMr: 'अनुवादासाठी मजकूर आवश्यक आहे.'
  });
});

/**
 * GET /api/translate/health
 * Public health & cache status check
 */
translationRouter.get('/health', (_req: Request, res: Response) => {
  const metrics = serverTranslationService.getCacheMetrics();
  res.json({
    success: true,
    service: 'baliraja-translation-proxy',
    status: 'operational',
    supportedLanguages: ['en', 'mr'],
    cache: metrics
  });
});
