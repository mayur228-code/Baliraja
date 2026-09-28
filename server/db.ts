import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { ServerAuthDatabase, ServerAdminUser, ServerResetToken, ServerSession } from './types.ts';

const DB_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE = path.join(DB_DIR, 'admin_auth.json');

// Initial administrative credentials provisioning (used only if database file does not exist)
function initDefaultDb(): ServerAuthDatabase {
  const initialEmail = (process.env.INITIAL_ADMIN_EMAIL || 'shinde.krishi.director@baliraja.in').trim().toLowerCase();
  const initialPass = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(12).toString('hex');
  
  if (!process.env.INITIAL_ADMIN_PASSWORD) {
    console.warn(`[SERVER_DB] Initializing fresh database. Generated random temporary initial admin password: ${initialPass}`);
    console.warn(`[SERVER_DB] Please update this password immediately or configure INITIAL_ADMIN_PASSWORD in server environment (.env).`);
  }

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

  constructor() {
    this.ensureDirectory();
    this.db = this.loadDatabase();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
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
      console.error('[SERVER_DB] Error loading database, initializing fresh:', err);
    }

    const initial = initDefaultDb();
    this.saveDatabaseSync(initial);
    this.db = initial;
    return initial;
  }

  private saveDatabaseSync(data: ServerAuthDatabase): void {
    try {
      this.ensureDirectory();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[SERVER_DB] Failed to save database file:', err);
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
    // Invalidate all existing sessions on password change
    this.db.sessions = [];
    this.persist();
  }

  public updateLastLogin(): void {
    this.db.admin.lastLoginAt = new Date().toISOString();
    this.persist();
  }

  // --- Sessions ---
  public createSession(sessionToken: string, userId: string, ttlMs: number, csrfToken?: string): ServerSession {
    this.loadDatabase();
    const now = Date.now();
    const session: ServerSession = {
      sessionToken,
      csrfToken,
      userId,
      createdAt: now,
      expiresAt: now + ttlMs
    };
    // Purge expired sessions
    this.db.sessions = (this.db.sessions || []).filter((s) => s.expiresAt > now);
    this.db.sessions.push(session);
    this.persist();
    return session;
  }

  public getSession(sessionToken: string): ServerSession | null {
    if (!sessionToken) return null;
    this.loadDatabase();
    const now = Date.now();
    const session = (this.db.sessions || []).find((s) => s.sessionToken === sessionToken && s.expiresAt > now);
    return session || null;
  }

  public deleteSession(sessionToken: string): void {
    this.db.sessions = this.db.sessions.filter((s) => s.sessionToken !== sessionToken);
    this.persist();
  }

  public deleteAllSessions(): void {
    this.db.sessions = [];
    this.persist();
  }

  // --- Password Reset Tokens ---
  public saveResetToken(record: ServerResetToken): void {
    const now = Date.now();
    // Clean old tokens for the same email
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
