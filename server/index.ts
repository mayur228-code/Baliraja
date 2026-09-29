import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes.ts';
import { contentRouter } from './contentRoutes.ts';
import { translationRouter } from './translationRoutes.ts';
import { serverAuthService } from './authService.ts';
import { UPLOADS_DIR } from './storageService.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// 1. Proxy trust configuration (only trust upstream proxy if explicitly declared)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
} else if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY);
}

// 2. Baseline Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'", // Permitted for bundler dev builds
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://unpkg.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'data:',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
          'http:',
        ],
        mediaSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
        ],
        connectSrc: [
          "'self'",
          'http://localhost:*',
          'http://127.0.0.1:*',
          'ws://localhost:*',
          'ws://127.0.0.1:*',
          'https://*.supabase.co',
          'https://*.supabase.in',
          'https://api.mymemory.translated.net',
          'https://translate.googleapis.com',
          'https://*.tile.openstreetmap.fr',
          'https://*.openstreetmap.fr',
          'https://*.basemaps.cartocdn.com',
          'https://basemaps.cartocdn.com',
          'https://*.cartocdn.com',
        ],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProd && process.env.APP_URL?.startsWith('https') ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProd && (process.env.APP_URL?.startsWith('https') || process.env.ENABLE_HSTS === 'true')
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// 3. Restricted CORS Configuration (Allow only authorized origins)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  process.env.APP_URL,
  process.env.VITE_APP_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : [])
].filter((url): url is string => Boolean(url && typeof url === 'string' && url.trim()));

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / server-to-server / tools without Origin header
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (typeof origin === 'string' && origin.endsWith('.vercel.app'))
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token', 'x-csrf-token', 'x-xsrf-token']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Mount API routes (supports both /api/* and /* for full Vercel serverless / Express runtime compatibility)
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/content', '/content'], contentRouter);
app.use(['/api/translate', '/translate'], translationRouter);

// Health check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Dedicated Secure Read-Only Image Serving Route with Path Traversal Protection
app.get(['/uploads/:filename', '/api/uploads/:filename'], (req, res) => {
  const rawParam = req.params.filename;
  const filename = path.basename(Array.isArray(rawParam) ? rawParam[0] : (rawParam || ''));
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!path.resolve(filePath).startsWith(UPLOADS_DIR)) {
    res.status(403).json({ error: 'Access denied: Path traversal attempt detected.' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Image not found.' });
    return;
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
  res.sendFile(filePath);
});

// Global Express Error Handler (Catches any unhandled router errors safely)
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error(`[SERVER_GLOBAL_ERROR] Method: ${req.method} | URL: ${req.originalUrl || req.url} | Error: ${errMsg}`);
  if (err instanceof Error && err.stack) {
    console.error(`[SERVER_GLOBAL_ERROR_STACK]`, err.stack);
  }
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      errorEn: 'An unexpected internal server error occurred.',
      errorMr: 'सर्व्हरवर अनपेक्षित त्रुटी आली.'
    });
  }
});

const isDirectExecution = process.argv[1]?.replace(/\\/g, '/').endsWith('server/index.ts') || process.env.RUN_SERVER === 'true';

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const status = serverAuthService.getAuthStatus();
    console.log(`====================================================`);
    console.log(`🚀 Baliraja Admin Auth Backend Server running on port ${PORT}`);
    console.log(`   Admin ID: ${status.adminId}`);
    console.log(`   Registered Email: ${status.email}`);
    console.log(`   Email Provider Configured: ${status.emailProviderConfigured ? 'YES' : 'NO'}`);
    console.log(`====================================================`);
  });
}

export default app;
