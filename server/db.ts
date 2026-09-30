import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { ServerAuthDatabase, ServerAdminUser, ServerResetToken, ServerSession } from './types';

const DB_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE = path.join(DB_DIR, 'admin_auth.json');

// Derive a stable, high-entropy server signing secret for stateless session tokens
function getSessionSigningKey(): string {
  const envKey = (
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();

  if (envKey.length >= 16) {
    return envKey;
  }

  const fallbackSeed = (
    process.env.INITIAL_ADMIN_PASSWORD ||
    process.env.INITIAL_ADMIN_EMAIL ||
    'baliraja_admin_session_key_secret_2026'
  ).trim();

  return crypto.createHash('sha256').update(`baliraja_salt_${fallbackSeed}`).digest('hex');
}

interface SignedTokenPayload {
  uid: string;
  csrf: string;
  iat: number;
  exp: number;
  rnd: string;
}

export function signSessionToken(userId: string, csrfToken: string, ttlMs: number): string {
  const now = Date.now();
  const payload: SignedTokenPayload = {
    uid: userId,
    csrf: csrfToken,
    iat: now,
    exp: now + ttlMs,
    rnd: crypto.randomBytes(16).toString('hex')
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSigningKey()).update(payloadB64).digest('base64url');
  return `baliraja_adm_${payloadB64}.${sig}`;
}

export function verifySignedSessionToken(token: string): ServerSession | null {
  if (!token || typeof token !== 'string') return null;
  if (!token.startsWith('baliraja_adm_')) return null;

  const raw = token.slice('baliraja_adm_'.length);
  const dotIdx = raw.indexOf('.');
  if (dotIdx === -1) return null;

  const payloadB64 = raw.substring(0, dotIdx);
  const sig = raw.substring(dotIdx + 1);

  if (!payloadB64 || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', getSessionSigningKey()).update(payloadB64).digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr) as Partial<SignedTokenPayload>;

    if (!payload || !payload.uid || !payload.exp || !payload.csrf) {
      return null;
    }

    const now = Date.now();
    if (now >= payload.exp) {
      return null;
    }

    return {
      sessionToken: token,
      csrfToken: payload.csrf,
      userId: payload.uid,
      createdAt: payload.iat || now,
      expiresAt: payload.exp
    };
  } catch {
    return null;
  }
}

// Initial administrative credentials provisioning (used only if database file does not exist)
function initDefaultDb(): ServerAuthDatabase {
  const initialEmail = (process.env.INITIAL_ADMIN_EMAIL || 'balirajaksk.kaij@gmail.com').trim().toLowerCase();
  const initialPass = (process.env.INITIAL_ADMIN_PASSWORD || 'baliraja_admin_1234').trim();

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(initialPass, salt);

  const defaultAdmin: ServerAdminUser = {
    id: 'admin-01',
    username: 'admin',
    email: initialEmail,
    passwordHash,
    name: 'Baliraja Administrator',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    admin: defaultAdmin,
    resetTokens: [],
    sessions: [],
    rateLimits: {},
    version: 1
  };
}

class ServerDatabase {
  private db: ServerAuthDatabase;
  private revokedTokens: Set<string> = new Set();
  private revokeAllBefore: number = 0;

  constructor() {
    this.ensureDirectory();
    this.db = this.loadDatabase();
  }

  private ensureDirectory(): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[SERVER_DB] Database directory is read-only or not writable (operating in-memory / cloud mode):', err instanceof Error ? err.message : String(err));
    }
  }

  public loadDatabase(): ServerAuthDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as ServerAuthDatabase;
        if (parsed && parsed.admin && parsed.admin.id === 'admin-01') {
          // Clean up expired sessions and expired reset tokens older than 24h
          const now = Date.now();
          parsed.sessions = (parsed.sessions || []).filter((s) => s.expiresAt > now);
          parsed.resetTokens = (parsed.resetTokens || []).filter(
            (t) => t.expiresAt > now - 24 * 60 * 60 * 1000
          );
          this.db = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[SERVER_DB] Error loading database file:', err instanceof Error ? err.message : String(err));
    }

    if (this.db && this.db.admin) {
      return this.db;
    }

    const initial = initDefaultDb();
    try {
      this.saveDatabaseSync(initial);
    } catch {
      // Expected in serverless read-only environment
    }
    this.db = initial;
    return initial;
  }

  private saveDatabaseSync(data: ServerAuthDatabase): void {
    try {
      this.ensureDirectory();
      const tmpFile = `${DB_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch {
      // In serverless / read-only environment, in-memory + signed tokens handle sessions
    }
  }

  private persist(): void {
    this.saveDatabaseSync(this.db);
  }

  // --- Admin Queries and Mutations ---
  public getAdmin(): ServerAdminUser {
    this.loadDatabase();
    return { ...this.db.admin };
  }

  public updateAdminEmail(newEmail: string): ServerAdminUser {
    this.loadDatabase();
    const trimmed = newEmail.trim().toLowerCase();
    this.db.admin.email = trimmed;
    this.db.admin.updatedAt = new Date().toISOString();
    this.persist();
    return { ...this.db.admin };
  }

  public updateAdminPasswordHash(newHash: string): void {
    this.db.admin.passwordHash = newHash;
    this.db.admin.updatedAt = new Date().toISOString();
    this.db.sessions = [];
    this.revokeAllBefore = Date.now();
    this.persist();
  }

  public updateLastLogin(): void {
    this.db.admin.lastLoginAt = new Date().toISOString();
    this.persist();
  }

  // --- Sessions (Serverless & Stateful Hybrid) ---
  public createSession(sessionTokenOrEmpty: string, userId: string, ttlMs: number, csrfToken?: string): ServerSession {
    this.loadDatabase();
    const actualCsrf = csrfToken || crypto.randomBytes(32).toString('hex');
    const token = sessionTokenOrEmpty && sessionTokenOrEmpty.startsWith('baliraja_adm_') && sessionTokenOrEmpty.includes('.')
      ? sessionTokenOrEmpty
      : signSessionToken(userId, actualCsrf, ttlMs);

    const now = Date.now();
    const session: ServerSession = {
      sessionToken: token,
      csrfToken: actualCsrf,
      userId,
      createdAt: now,
      expiresAt: now + ttlMs
    };

    // Keep session cached in local memory
    this.db.sessions = (this.db.sessions || []).filter((s) => s.expiresAt > now);
    this.db.sessions.push(session);
    this.persist();
    return session;
  }

  public getSession(sessionToken: string): ServerSession | null {
    if (!sessionToken) return null;

    if (this.revokedTokens.has(sessionToken)) {
      return null;
    }

    // 1. Primary: Cryptographically verified signed stateless token (Reliable on all serverless instances)
    const verified = verifySignedSessionToken(sessionToken);
    if (verified) {
      if (verified.createdAt < this.revokeAllBefore) {
        return null;
      }
      return verified;
    }

    // 2. Fallback: In-memory session check
    this.loadDatabase();
    const now = Date.now();
    const session = (this.db.sessions || []).find(
      (s) => s.sessionToken === sessionToken && s.expiresAt > now && s.createdAt >= this.revokeAllBefore
    );
    return session || null;
  }

  public deleteSession(sessionToken: string): void {
    if (!sessionToken) return;
    this.revokedTokens.add(sessionToken);
    this.db.sessions = (this.db.sessions || []).filter((s) => s.sessionToken !== sessionToken);
    this.persist();
  }

  public deleteAllSessions(): void {
    this.revokeAllBefore = Date.now();
    this.db.sessions = [];
    this.persist();
  }

  // --- Password Reset Tokens ---
  public saveResetToken(record: ServerResetToken): void {
    const now = Date.now();
    this.db.resetTokens = this.db.resetTokens.filter(
      (t) => t.email !== record.email || (!t.used && t.expiresAt > now)
    );
    this.db.resetTokens.push(record);
    this.persist();
  }

  public getResetToken(token: string): ServerResetToken | null {
    const record = this.db.resetTokens.find((t) => t.token === token);
    if (!record) return null;
    return { ...record };
  }

  public markResetTokenUsed(token: string): boolean {
    const record = this.db.resetTokens.find((t) => t.token === token);
    if (record) {
      record.used = true;
      this.persist();
      return true;
    }
    return false;
  }

  // --- Rate Limiting ---
  public checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    if (!this.db.rateLimits) this.db.rateLimits = {};
    const timestamps = (this.db.rateLimits[key] || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      return false;
    }
    timestamps.push(now);
    this.db.rateLimits[key] = timestamps;
    this.persist();
    return true;
  }
}

export const serverDb = new ServerDatabase();
