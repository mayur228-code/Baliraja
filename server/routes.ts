import type { Request, Response } from 'express';
import { Router, json } from 'express';
import crypto from 'node:crypto';
import { serverAuthService } from './authService';
import { serverDb } from './db';

export const authRouter = Router();

authRouter.use(json());

export const SESSION_COOKIE_NAME = 'baliraja_admin_session';
export const CSRF_COOKIE_NAME = 'baliraja_csrf_token';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function isSecureCookie(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.APP_URL?.startsWith('https')) ||
    process.env.COOKIE_SECURE === 'true'
  );
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax' as const,
    maxAge: SESSION_TTL_MS,
    path: '/'
  };
}

function getCsrfCookieOptions() {
  return {
    httpOnly: false, // Must be readable by client JS to attach to X-CSRF-Token header
    secure: isSecureCookie(),
    sameSite: 'lax' as const,
    maxAge: SESSION_TTL_MS,
    path: '/'
  };
}

// Parse Cookie header into key-value map
export function parseCookies(header?: string | string[]): Record<string, string> {
  if (!header) return {};
  const headerStr = Array.isArray(header) ? header.join('; ') : header;
  const cookies: Record<string, string> = {};
  const pairs = headerStr.split(';');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim();
    if (!pair) continue;
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.substring(0, eqIdx).trim();
    let val = pair.substring(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

// Helper to get client IP reliably using Express trust proxy configuration
export function getClientIp(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  return ip.startsWith('::ffff:') ? ip.substring(7) : ip;
}

// Helper to extract session token from HttpOnly cookie or Authorization header fallback
export function getSessionToken(req: Request): string {
  // 1. Express req.cookies if populated
  if ((req as any).cookies && (req as any).cookies[SESSION_COOKIE_NAME]) {
    return String((req as any).cookies[SESSION_COOKIE_NAME]).trim();
  }

  // 2. Primary: HttpOnly Cookie header
  const rawCookieHeader = req.headers['cookie'] || req.headers['Cookie'];
  const cookies = parseCookies(rawCookieHeader);
  if (cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME].trim();
  }

  // 3. Fallback: Authorization header (for backward compatibility / API testing)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const authStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (authStr && typeof authStr === 'string' && authStr.startsWith('Bearer ')) {
    return authStr.slice(7).trim();
  }

  const customToken = req.headers['x-session-token'];
  return (Array.isArray(customToken) ? customToken[0] : (customToken as string)) || '';
}

// Verify Anti-CSRF token for state-changing authenticated requests
function verifyCsrfToken(req: Request, res: Response, sessionToken: string): boolean {
  const session = serverDb.getSession(sessionToken);
  if (!session) {
    res.status(401).json({
      success: false,
      authenticated: false,
      errorEn: 'Session expired or unauthorized. Please sign in again.',
      errorMr: 'सत्र संपले आहे किंवा अनधिकृत आहे. कृपया पुन्हा लॉगिन करा.'
    });
    return false;
  }

  const headerCsrf = ((req.headers['x-csrf-token'] as string) || (req.headers['x-xsrf-token'] as string) || '').trim();

  if (!session.csrfToken || !headerCsrf) {
    res.status(403).json({
      success: false,
      errorEn: 'Security validation failed: CSRF token is missing in x-csrf-token header. Please refresh and try again.',
      errorMr: 'सुरक्षा पडताळणी अयशस्वी: CSRF टोकन गहाळ आहे. कृपया पेज रीफ्रेश करा.'
    });
    return false;
  }

  // Timing-safe comparison to prevent side-channel timing attacks
  const a = Buffer.from(session.csrfToken);
  const b = Buffer.from(headerCsrf);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(403).json({
      success: false,
      errorEn: 'Security validation failed: Invalid CSRF token.',
      errorMr: 'सुरक्षा पडताळणी अयशस्वी: अवैध CSRF टोकन.'
    });
    return false;
  }

  return true;
}

// 1. Status / Public Metadata
authRouter.get('/status', (_req: Request, res: Response) => {
  const status = serverAuthService.getAuthStatus();
  res.json({ success: true, ...status });
});

// 2. Login (Issues HttpOnly session cookie and anti-CSRF token)
authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, passcode, password, email, identifier } = req.body || {};
  const ip = getClientIp(req);
  const user = username || email || identifier || '';
  const pass = passcode || password || '';
  const result = await serverAuthService.login(user, pass, ip);
  
  if (!result.success || !result.sessionToken) {
    res.status(401).json({
      success: false,
      errorEn: result.errorEn,
      errorMr: result.errorMr
    });
    return;
  }

  // Set secure HttpOnly session cookie
  res.cookie(SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieOptions());

  // Set readable anti-CSRF cookie for browser fetch client
  if (result.csrfToken) {
    res.cookie(CSRF_COOKIE_NAME, result.csrfToken, getCsrfCookieOptions());
  }

  // Return user info and csrfToken — NEVER expose session token in body
  res.json({
    success: true,
    user: result.user,
    csrfToken: result.csrfToken
  });
});

// 3. Get Session / Verify Active Login via Cookie
authRouter.get('/session', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = serverDb.getSession(token);
  const user = serverAuthService.getSessionUser(token);

  if (!session || !user) {
    res.status(401).json({
      success: false,
      authenticated: false,
      errorEn: 'No active session',
      errorMr: 'कोणतेही सक्रिय सत्र नाही'
    });
    return;
  }

  // Refresh CSRF cookie if available
  if (session.csrfToken) {
    res.cookie(CSRF_COOKIE_NAME, session.csrfToken, getCsrfCookieOptions());
  }

  res.json({
    success: true,
    authenticated: true,
    user,
    csrfToken: session.csrfToken
  });
});

// 4. Logout (Invalidates session in database and clears cookies)
authRouter.post('/logout', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (token) {
    serverAuthService.logout(token);
  }

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'strict',
    path: '/'
  });

  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: 'strict',
    path: '/'
  });

  res.json({ success: true });
});

// 5. Change Admin Email (Requires HttpOnly cookie + CSRF token + Current Password)
authRouter.post('/change-email', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      errorEn: 'Unauthorized session. Please sign in again.',
      errorMr: 'अनधिकृत सत्र. कृपया पुन्हा लॉगिन करा.'
    });
    return;
  }

  if (!verifyCsrfToken(req, res, token)) {
    return;
  }

  const { currentPassword, currentPasscode, newEmail } = req.body || {};
  const pass = currentPassword || currentPasscode || '';
  const result = await serverAuthService.changeEmail(token, pass, newEmail || '');
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

// 6. Change Password (Requires HttpOnly cookie + CSRF token + Current Password)
authRouter.post('/change-password', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      errorEn: 'Unauthorized session. Please sign in again.',
      errorMr: 'अनधिकृत सत्र. कृपया पुन्हा लॉगिन करा.'
    });
    return;
  }

  if (!verifyCsrfToken(req, res, token)) {
    return;
  }

  const { currentPassword, currentPasscode, newPassword, newPasscode } = req.body || {};
  const curPass = currentPassword || currentPasscode || '';
  const newPass = newPassword || newPasscode || '';
  const result = await serverAuthService.changePassword(token, curPass, newPass);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  // Clear cookie upon password change so user signs in with fresh password
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'strict',
    path: '/'
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: 'strict',
    path: '/'
  });

  res.json(result);
});

// 7. Forgot Password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email, identifier } = req.body || {};
  const ip = getClientIp(req);
  const emailVal = email || identifier || '';
  const result = await serverAuthService.forgotPassword(emailVal, ip);
  const status = result.success ? 200 : (result.providerConfigured === false ? 503 : 400);
  res.status(status).json(result);
});

// 8. Validate Reset Token (Rate limited: 15 checks per 10 minutes per IP)
authRouter.post('/validate-reset-token', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const isAllowed = serverDb.checkRateLimit(`validate_token_${ip}`, 15, 10 * 60 * 1000);
  if (!isAllowed) {
    res.status(429).json({
      valid: false,
      errorEn: 'Too many reset token verification attempts. Please wait 10 minutes before trying again.',
      errorMr: 'टोकन पडताळणीचे अनेक अयशस्वी प्रयत्न झाले आहेत. कृपया १० मिनिटे प्रतीक्षा करा.'
    });
    return;
  }

  const { token } = req.body || {};
  const result = serverAuthService.validateResetToken(token || '');
  if (!result.valid) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

// 9. Reset Password with Token
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword, newPasscode } = req.body || {};
  const newPass = newPassword || newPasscode || '';
  const result = await serverAuthService.resetPasswordWithToken(token || '', newPass);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});
