// server/index.ts
import fs4 from "node:fs";
import path4 from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv2 from "dotenv";

// server/routes.ts
import { Router, json } from "express";
import crypto3 from "node:crypto";

// server/authService.ts
import crypto2 from "node:crypto";
import bcrypt2 from "bcryptjs";

// server/db.ts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
var DB_DIR = path.resolve(process.cwd(), "server/data");
var DB_FILE = path.join(DB_DIR, "admin_auth.json");
function getSessionSigningKey() {
  const envKey = (process.env.SESSION_SECRET || process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (envKey.length >= 16) {
    return envKey;
  }
  const fallbackSeed = (process.env.INITIAL_ADMIN_PASSWORD || process.env.INITIAL_ADMIN_EMAIL || "baliraja_admin_session_key_secret_2026").trim();
  return crypto.createHash("sha256").update(`baliraja_salt_${fallbackSeed}`).digest("hex");
}
function signSessionToken(userId, csrfToken, ttlMs) {
  const now = Date.now();
  const payload = {
    uid: userId,
    csrf: csrfToken,
    iat: now,
    exp: now + ttlMs,
    rnd: crypto.randomBytes(16).toString("hex")
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSessionSigningKey()).update(payloadB64).digest("base64url");
  return `baliraja_adm_${payloadB64}.${sig}`;
}
function verifySignedSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  if (!token.startsWith("baliraja_adm_")) return null;
  const raw = token.slice("baliraja_adm_".length);
  const dotIdx = raw.indexOf(".");
  if (dotIdx === -1) return null;
  const payloadB64 = raw.substring(0, dotIdx);
  const sig = raw.substring(dotIdx + 1);
  if (!payloadB64 || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", getSessionSigningKey()).update(payloadB64).digest("base64url");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(jsonStr);
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
function initDefaultDb() {
  const initialEmail = (process.env.INITIAL_ADMIN_EMAIL || "balirajaksk.kaij@gmail.com").trim().toLowerCase();
  const initialPass = (process.env.INITIAL_ADMIN_PASSWORD || "baliraja_admin_1234").trim();
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(initialPass, salt);
  const defaultAdmin = {
    id: "admin-01",
    username: "admin",
    email: initialEmail,
    passwordHash,
    name: "Baliraja Administrator",
    role: "admin",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return {
    admin: defaultAdmin,
    resetTokens: [],
    sessions: [],
    rateLimits: {},
    version: 1
  };
}
var ServerDatabase = class {
  db;
  revokedTokens = /* @__PURE__ */ new Set();
  revokeAllBefore = 0;
  constructor() {
    this.ensureDirectory();
    this.db = this.loadDatabase();
  }
  ensureDirectory() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn("[SERVER_DB] Database directory is read-only or not writable (operating in-memory / cloud mode):", err instanceof Error ? err.message : String(err));
    }
  }
  loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.admin && parsed.admin.id === "admin-01") {
          const now = Date.now();
          parsed.sessions = (parsed.sessions || []).filter((s) => s.expiresAt > now);
          parsed.resetTokens = (parsed.resetTokens || []).filter(
            (t) => t.expiresAt > now - 24 * 60 * 60 * 1e3
          );
          this.db = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[SERVER_DB] Error loading database file:", err instanceof Error ? err.message : String(err));
    }
    if (this.db && this.db.admin) {
      return this.db;
    }
    const initial = initDefaultDb();
    try {
      this.saveDatabaseSync(initial);
    } catch {
    }
    this.db = initial;
    return initial;
  }
  saveDatabaseSync(data) {
    try {
      this.ensureDirectory();
      const tmpFile = `${DB_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tmpFile, DB_FILE);
    } catch {
    }
  }
  persist() {
    this.saveDatabaseSync(this.db);
  }
  // --- Admin Queries and Mutations ---
  getAdmin() {
    this.loadDatabase();
    return { ...this.db.admin };
  }
  updateAdminEmail(newEmail) {
    this.loadDatabase();
    const trimmed = newEmail.trim().toLowerCase();
    this.db.admin.email = trimmed;
    this.db.admin.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.persist();
    return { ...this.db.admin };
  }
  updateAdminPasswordHash(newHash) {
    this.db.admin.passwordHash = newHash;
    this.db.admin.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.sessions = [];
    this.revokeAllBefore = Date.now();
    this.persist();
  }
  updateLastLogin() {
    this.db.admin.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
    this.persist();
  }
  // --- Sessions (Serverless & Stateful Hybrid) ---
  createSession(sessionTokenOrEmpty, userId, ttlMs, csrfToken) {
    this.loadDatabase();
    const actualCsrf = csrfToken || crypto.randomBytes(32).toString("hex");
    const token = sessionTokenOrEmpty && sessionTokenOrEmpty.startsWith("baliraja_adm_") && sessionTokenOrEmpty.includes(".") ? sessionTokenOrEmpty : signSessionToken(userId, actualCsrf, ttlMs);
    const now = Date.now();
    const session = {
      sessionToken: token,
      csrfToken: actualCsrf,
      userId,
      createdAt: now,
      expiresAt: now + ttlMs
    };
    this.db.sessions = (this.db.sessions || []).filter((s) => s.expiresAt > now);
    this.db.sessions.push(session);
    this.persist();
    return session;
  }
  getSession(sessionToken) {
    if (!sessionToken) return null;
    if (this.revokedTokens.has(sessionToken)) {
      return null;
    }
    const verified = verifySignedSessionToken(sessionToken);
    if (verified) {
      if (verified.createdAt < this.revokeAllBefore) {
        return null;
      }
      return verified;
    }
    this.loadDatabase();
    const now = Date.now();
    const session = (this.db.sessions || []).find(
      (s) => s.sessionToken === sessionToken && s.expiresAt > now && s.createdAt >= this.revokeAllBefore
    );
    return session || null;
  }
  deleteSession(sessionToken) {
    if (!sessionToken) return;
    this.revokedTokens.add(sessionToken);
    this.db.sessions = (this.db.sessions || []).filter((s) => s.sessionToken !== sessionToken);
    this.persist();
  }
  deleteAllSessions() {
    this.revokeAllBefore = Date.now();
    this.db.sessions = [];
    this.persist();
  }
  // --- Password Reset Tokens ---
  saveResetToken(record) {
    const now = Date.now();
    this.db.resetTokens = this.db.resetTokens.filter(
      (t) => t.email !== record.email || !t.used && t.expiresAt > now
    );
    this.db.resetTokens.push(record);
    this.persist();
  }
  getResetToken(token) {
    const record = this.db.resetTokens.find((t) => t.token === token);
    if (!record) return null;
    return { ...record };
  }
  markResetTokenUsed(token) {
    const record = this.db.resetTokens.find((t) => t.token === token);
    if (record) {
      record.used = true;
      this.persist();
      return true;
    }
    return false;
  }
  // --- Rate Limiting ---
  checkRateLimit(key, maxRequests, windowMs) {
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
};
var serverDb = new ServerDatabase();

// server/email.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
function isEmailProviderConfigured() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(host && user && pass);
}
function getAppUrl() {
  const envUrl = process.env.APP_URL || process.env.VITE_APP_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return "http://localhost:5173";
}
function getAssetUrl(assetPath) {
  const cleanPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  if (process.env.ASSET_BASE_URL && process.env.ASSET_BASE_URL.trim()) {
    return `${process.env.ASSET_BASE_URL.replace(/\/+$/, "")}${cleanPath}`;
  }
  if (process.env.PUBLIC_ASSET_URL && process.env.PUBLIC_ASSET_URL.trim()) {
    return `${process.env.PUBLIC_ASSET_URL.replace(/\/+$/, "")}${cleanPath}`;
  }
  const appUrl = getAppUrl();
  if (appUrl.startsWith("https://")) {
    return `${appUrl}${cleanPath}`;
  }
  return `https://baliraja.in${cleanPath}`;
}
async function sendPasswordResetEmail(recipientEmail, resetToken) {
  const appUrl = getAppUrl();
  const resetLink = `${appUrl}/admin?resetToken=${encodeURIComponent(resetToken)}`;
  const logoUrl = getAssetUrl("/assets/logo.png");
  const brandNameUrl = getAssetUrl("/assets/brand_name.png");
  if (!isEmailProviderConfigured()) {
    console.warn(
      `[EMAIL_SERVICE] SMTP is NOT configured in environment. Generated password reset token for: ${recipientEmail}. To deliver live emails to this inbox, please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in your .env file.`
    );
    return {
      sent: false,
      providerConfigured: false,
      error: "SMTP email provider is not configured. Please configure SMTP credentials in server environment variables (.env)."
    };
  }
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Baliraja Krishi Seva Kendra" <${user}>`;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
  const htmlContent = `
<!DOCTYPE html>
<html lang="mr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  
  <!-- Open Graph & Social Preview Metadata -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Baliraja Krishi Seva Kendra" />
  <meta property="og:title" content="Baliraja Krishi Seva Kendra - Admin Password Reset" />
  <meta property="og:description" content="Administrative security verification link for Baliraja Krishi Seva Kendra, Kaij." />
  <meta property="og:image" content="${logoUrl}" />
  <meta property="og:image:alt" content="Baliraja Krishi Seva Kendra" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Baliraja Krishi Seva Kendra - Admin Password Reset" />
  <meta name="twitter:description" content="Administrative security verification link for Baliraja Krishi Seva Kendra." />
  <meta name="twitter:image" content="${logoUrl}" />
  
  <title>Baliraja Krishi Seva Kendra - Admin Password Reset</title>
  
  <style>
    /* Reset & Base Styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #1c1917;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    a {
      text-decoration: none;
    }
    
    /* Responsive overrides */
    @media only screen and (max-width: 620px) {
      .email-wrapper {
        padding: 12px !important;
      }
      .email-card {
        padding: 24px 18px !important;
        border-radius: 18px !important;
      }
      .brand-logo {
        width: 72px !important;
        height: 72px !important;
      }
      .brand-name {
        width: 200px !important;
        max-width: 90% !important;
      }
      .cta-button {
        display: block !important;
        padding: 14px 20px !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f0;">
  <!-- Preheader text (Invisible in body, visible in inbox list preview) -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0932\u093F\u0902\u0915 \u2022 Baliraja Krishi Seva Kendra Admin Password Reset verification link (Valid for 15 minutes).
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper" style="background-color: #f4f6f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container (Max 560px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px;">
          
          <!-- Card Container -->
          <tr>
            <td class="email-card" style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 24px; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);">
              
              <!-- 1. Header: Two Separate Clickable Brand Assets (Logo PNG + Brand Name PNG, NO HTML text) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #f5f5f4; padding-bottom: 24px; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    
                    <!-- Asset 1: Brand Logo PNG (Circular, no square/rectangular container) -->
                    <a href="${appUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; text-decoration: none; border: 0; outline: none; margin-bottom: 14px;" title="Baliraja Krishi Seva Kendra">
                      <img 
                        src="${logoUrl}" 
                        alt="Baliraja Logo" 
                        width="80" 
                        height="80"
                        class="brand-logo"
                        style="display: block; width: 80px; height: 80px; max-width: 80px; max-height: 80px; border-radius: 50%; -webkit-border-radius: 50%; object-fit: cover; border: 0; outline: none; margin: 0 auto;" 
                      />
                    </a>
                    
                    <!-- Asset 2: Brand Name PNG (Underneath logo, natural proportions, NO HTML text) -->
                    <a href="${appUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; border: 0; outline: none;" title="Baliraja Krishi Seva Kendra">
                      <img 
                        src="${brandNameUrl}" 
                        alt="\u092C\u0933\u0940\u0930\u093E\u091C\u093E \u0915\u0943\u0937\u0940 \u0938\u0947\u0935\u093E \u0915\u0947\u0902\u0926\u094D\u0930" 
                        width="240" 
                        class="brand-name"
                        style="display: block; width: 240px; max-width: 100%; height: auto; border: 0; outline: none; margin: 0 auto;" 
                      />
                    </a>

                  </td>
                </tr>
              </table>

              <!-- 2. Message Body -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1c1917; line-height: 1.4;">
                      \u0928\u092E\u0938\u094D\u0915\u093E\u0930 / Hello Administrator,
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #292524;">
                      \u0906\u092E\u094D\u0939\u093E\u0932\u093E \u0906\u092A\u0932\u094D\u092F\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u0916\u093E\u0924\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u0930\u0923\u094D\u092F\u093E\u091A\u0940 \u0935\u093F\u0928\u0902\u0924\u0940 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u091D\u093E\u0932\u0940 \u0906\u0939\u0947.
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 13.5px; line-height: 1.6; color: #57534e;">
                      We received a request to securely reset the password for your administrator account. Click the button below to configure a new password.
                    </p>

                    <!-- 3. Primary CTA Button -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                      <tr>
                        <td align="center">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="border-radius: 12px; background-color: #047857; box-shadow: 0 4px 14px rgba(4, 120, 87, 0.28);">
                                <a 
                                  href="${resetLink}" 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  class="cta-button"
                                  style="display: inline-block; background-color: #047857; color: #ffffff !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 12px; letter-spacing: 0.2px;"
                                >
                                  \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u0930\u093E \u2022 Reset Password
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- 4. Fallback Raw URL Box -->
                    <div style="margin: 24px 0 20px 0;">
                      <p style="margin: 0 0 6px 0; font-size: 12px; color: #78716c; line-height: 1.5;">
                        \u092C\u091F\u0923 \u0915\u093E\u092E \u0915\u0930\u0924 \u0928\u0938\u0932\u094D\u092F\u093E\u0938 \u0916\u093E\u0932\u0940\u0932 \u0932\u093F\u0902\u0915 \u0925\u0947\u091F \u092C\u094D\u0930\u093E\u090A\u091D\u0930\u092E\u0927\u094D\u092F\u0947 \u0909\u0918\u0921\u093E / If the button does not work, copy and open this link:
                      </p>
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11.5px; color: #047857; line-height: 1.4;">
                        <a href="${resetLink}" style="color: #047857; text-decoration: underline;">${resetLink}</a>
                      </div>
                    </div>

                    <!-- 5. Concise Security & Expiry Notice -->
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 14px 16px; margin-top: 24px;">
                      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #92400e;">
                        \u26A0\uFE0F \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0938\u0942\u091A\u0928\u093E / Security Notice:
                      </p>
                      <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #78350f;">
                        <li>\u0939\u0940 \u0932\u093F\u0902\u0915 \u092A\u0941\u0922\u0940\u0932 <strong>\u0967\u096B \u092E\u093F\u0928\u093F\u091F\u093E\u0902\u0938\u093E\u0920\u0940</strong> \u0935\u0948\u0927 \u0906\u0939\u0947 / Valid for <strong>15 minutes</strong> only.</li>
                        <li>\u0939\u0940 \u0938\u093F\u0902\u0917\u0932-\u092F\u0941\u091D \u0932\u093F\u0902\u0915 \u0905\u0938\u0942\u0928 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092C\u0926\u0932\u0932\u094D\u092F\u093E\u0928\u0902\u0924\u0930 \u0932\u0917\u0947\u091A \u0905\u0935\u0948\u0927 \u0939\u094B\u0908\u0932 / Single-use only. Token expires upon password update.</li>
                        <li>\u0939\u0940 \u0935\u093F\u0928\u0902\u0924\u0940 \u0906\u092A\u0923 \u0915\u0947\u0932\u0940 \u0928\u0938\u0932\u094D\u092F\u093E\u0938 \u092F\u093E \u0908\u092E\u0947\u0932\u0915\u0921\u0947 \u0926\u0941\u0930\u094D\u0932\u0915\u094D\u0937 \u0915\u0930\u093E. \u0906\u092A\u0932\u093E \u0938\u0927\u094D\u092F\u093E\u091A\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0930\u093E\u0939\u0940\u0932 / If you did not make this request, please disregard this email.</li>
                      </ul>
                    </div>

                  </td>
                </tr>
              </table>

              <!-- 6. Footer Information (Preserved correct existing business address) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f5f5f4; margin-top: 28px; padding-top: 20px;">
                <tr>
                  <td align="center" style="font-size: 11px; line-height: 1.6; color: #a8a29e;">
                    <p style="margin: 0 0 3px 0; color: #78716c;">
                      Mangalwar Peth, Kaij, Dist. Beed, Maharashtra - 431123
                    </p>
                    <p style="margin: 0; color: #a8a29e;">
                      Confidential Security Dispatch \u2022 Please do not reply directly to this automated email
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
  const textContent = `
Baliraja Krishi Seva Kendra (\u092C\u0933\u0940\u0930\u093E\u091C\u093E \u0915\u0943\u0937\u0940 \u0938\u0947\u0935\u093E \u0915\u0947\u0902\u0926\u094D\u0930) - Admin Password Reset

\u0928\u092E\u0938\u094D\u0915\u093E\u0930 / Hello Administrator,

\u0906\u092E\u094D\u0939\u093E\u0932\u093E \u0906\u092A\u0932\u094D\u092F\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u0916\u093E\u0924\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u0930\u0923\u094D\u092F\u093E\u091A\u0940 \u0935\u093F\u0928\u0902\u0924\u0940 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u091D\u093E\u0932\u0940 \u0906\u0939\u0947.
We received a request to securely reset the password for your administrator account.

\u0916\u093E\u0932\u0940\u0932 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0932\u093F\u0902\u0915 \u0935\u093E\u092A\u0930\u0942\u0928 \u0906\u092A\u0932\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u0930\u093E (Link valid for 15 minutes):
${resetLink}

\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0938\u0942\u091A\u0928\u093E / Security Notice:
- \u0939\u0940 \u0932\u093F\u0902\u0915 \u092A\u0941\u0922\u0940\u0932 \u0967\u096B \u092E\u093F\u0928\u093F\u091F\u093E\u0902\u0938\u093E\u0920\u0940 \u0935\u0948\u0927 \u0906\u0939\u0947 (Valid for 15 minutes only).
- \u0939\u0940 \u0938\u093F\u0902\u0917\u0932-\u092F\u0941\u091D \u0932\u093F\u0902\u0915 \u0905\u0938\u0942\u0928 \u090F\u0915\u0926\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092C\u0926\u0932\u0932\u094D\u092F\u093E\u0928\u0902\u0924\u0930 \u0932\u0917\u0947\u091A \u0905\u0935\u0948\u0927 \u0939\u094B\u0924\u0947 (Single-use token).
- \u0939\u0940 \u0935\u093F\u0928\u0902\u0924\u0940 \u0906\u092A\u0923 \u0915\u0947\u0932\u0940 \u0928\u0938\u0932\u094D\u092F\u093E\u0938 \u092F\u093E \u0908\u092E\u0947\u0932\u0915\u0921\u0947 \u0926\u0941\u0930\u094D\u0932\u0915\u094D\u0937 \u0915\u0930\u093E (If you did not request this, please disregard).

Baliraja Krishi Seva Kendra
Mangalwar Peth, Kaij, Dist. Beed, Maharashtra - 431123
  `.trim();
  try {
    const info = await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: "Baliraja Krishi Seva Kendra - Admin Password Reset",
      text: textContent,
      html: htmlContent
    });
    console.log(`[EMAIL_SERVICE] Password reset email sent to ${recipientEmail}. MessageId: ${info.messageId}`);
    return {
      sent: true,
      providerConfigured: true,
      messageId: info.messageId
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EMAIL_SERVICE] Failed to send email via SMTP:`, msg);
    return {
      sent: false,
      providerConfigured: true,
      error: `Failed to deliver email via SMTP: ${msg}`
    };
  }
}

// server/authService.ts
var SESSION_TTL_MS = 2 * 60 * 60 * 1e3;
var RESET_TOKEN_TTL_MS = 15 * 60 * 1e3;
var ServerAuthService = class {
  /**
   * Authenticate admin credentials on the server using bcrypt.
   */
  async login(usernameOrEmail, passcode, clientIp = "127.0.0.1") {
    const trimmedUser = usernameOrEmail.trim().toLowerCase();
    const trimmedPass = passcode.trim();
    if (!trimmedUser || !trimmedPass) {
      return {
        success: false,
        errorEn: "Please enter both username/email and administrative passcode.",
        errorMr: "\u0915\u0943\u092A\u092F\u093E \u0935\u093E\u092A\u0930\u0915\u0930\u094D\u0924\u093E \u0928\u093E\u0935/\u0908\u092E\u0947\u0932 \u0906\u0923\u093F \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u0938\u0902\u0915\u0947\u0924\u093E\u0902\u0915 \u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F \u0915\u0930\u093E."
      };
    }
    const isAllowed = serverDb.checkRateLimit(`login_${clientIp}`, 10, 10 * 60 * 1e3);
    if (!isAllowed) {
      return {
        success: false,
        errorEn: "Too many login attempts. Please wait 10 minutes before trying again.",
        errorMr: "\u092A\u094D\u0930\u0935\u0947\u0936 \u0915\u0930\u0923\u094D\u092F\u093E\u091A\u0947 \u0905\u0928\u0947\u0915 \u0905\u092F\u0936\u0938\u094D\u0935\u0940 \u092A\u094D\u0930\u092F\u0924\u094D\u0928 \u091D\u093E\u0932\u0947 \u0906\u0939\u0947\u0924. \u0915\u0943\u092A\u092F\u093E \u0967\u0966 \u092E\u093F\u0928\u093F\u091F\u0947 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u093E."
      };
    }
    const admin = serverDb.getAdmin();
    const isUserMatch = trimmedUser === admin.username.toLowerCase() || trimmedUser === admin.email.toLowerCase();
    if (!isUserMatch) {
      return {
        success: false,
        errorEn: "Unable to sign in. Please check your credentials and try again.",
        errorMr: "\u092A\u094D\u0930\u0935\u0947\u0936 \u0915\u0930\u0924\u093E \u0906\u0932\u093E \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u0906\u092A\u0932\u0940 \u092E\u093E\u0939\u093F\u0924\u0940 \u0924\u092A\u093E\u0938\u093E \u0906\u0923\u093F \u092A\u0941\u0928\u094D\u0939\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928 \u0915\u0930\u093E."
      };
    }
    const isPassMatch = await bcrypt2.compare(trimmedPass, admin.passwordHash);
    if (!isPassMatch) {
      return {
        success: false,
        errorEn: "Unable to sign in. Please check your credentials and try again.",
        errorMr: "\u092A\u094D\u0930\u0935\u0947\u0936 \u0915\u0930\u0924\u093E \u0906\u0932\u093E \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u0906\u092A\u0932\u0940 \u092E\u093E\u0939\u093F\u0924\u0940 \u0924\u092A\u093E\u0938\u093E \u0906\u0923\u093F \u092A\u0941\u0928\u094D\u0939\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928 \u0915\u0930\u093E."
      };
    }
    serverDb.updateLastLogin();
    const csrfToken = crypto2.randomBytes(32).toString("hex");
    const session = serverDb.createSession("", admin.id, SESSION_TTL_MS, csrfToken);
    const sessionToken = session.sessionToken;
    return {
      success: true,
      sessionToken,
      csrfToken,
      token: sessionToken,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLoginAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  /**
   * Retrieve active session object from database.
   */
  getSession(token) {
    if (!token) return null;
    return serverDb.getSession(token);
  }
  /**
   * Validate session token from Authorization header or cookie.
   */
  getSessionUser(token) {
    if (!token) return null;
    const session = serverDb.getSession(token);
    if (!session) return null;
    const admin = serverDb.getAdmin();
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt
    };
  }
  /**
   * Terminate active session.
   */
  logout(token) {
    if (!token) return false;
    serverDb.deleteSession(token);
    return true;
  }
  /**
   * Change administrator registered email. Requires valid session + current password.
   */
  async changeEmail(sessionToken, currentPasscode, newEmail) {
    const user = this.getSessionUser(sessionToken);
    if (!user) {
      return {
        success: false,
        errorEn: "Unauthorized session. Please sign in again.",
        errorMr: "\u0905\u0928\u0927\u093F\u0915\u0943\u0924 \u0938\u0924\u094D\u0930. \u0915\u0943\u092A\u092F\u093E \u092A\u0941\u0928\u094D\u0939\u093E \u0932\u0949\u0917\u093F\u0928 \u0915\u0930\u093E."
      };
    }
    const trimmedPass = currentPasscode.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedPass) {
      return {
        success: false,
        errorEn: "Please enter your current administrator password.",
        errorMr: "\u0915\u0943\u092A\u092F\u093E \u0906\u092A\u0932\u093E \u0938\u0927\u094D\u092F\u093E\u091A\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F \u0915\u0930\u093E."
      };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return {
        success: false,
        errorEn: "Please enter a valid email address (e.g. name@example.com).",
        errorMr: "\u0915\u0943\u092A\u092F\u093E \u0935\u0948\u0927 \u0908\u092E\u0947\u0932 \u092A\u0924\u094D\u0924\u093E \u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F \u0915\u0930\u093E (\u0909\u0926\u093E. name@example.com)."
      };
    }
    const admin = serverDb.getAdmin();
    if (trimmedEmail === admin.email.toLowerCase()) {
      return {
        success: false,
        errorEn: "New email cannot be identical to your current registered email.",
        errorMr: "\u0928\u0935\u0940\u0928 \u0908\u092E\u0947\u0932 \u0938\u0927\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u0928\u094B\u0902\u0926\u0923\u0940\u0915\u0943\u0924 \u0908\u092E\u0947\u0932\u0938\u093E\u0930\u0916\u093E\u091A \u0905\u0938\u0942 \u0936\u0915\u0924 \u0928\u093E\u0939\u0940."
      };
    }
    const isPassMatch = await bcrypt2.compare(trimmedPass, admin.passwordHash);
    if (!isPassMatch) {
      return {
        success: false,
        errorEn: "Current administrator password is incorrect.",
        errorMr: "\u0938\u0927\u094D\u092F\u093E\u091A\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u091A\u0941\u0915\u0940\u091A\u093E \u0906\u0939\u0947."
      };
    }
    const updatedAdmin = serverDb.updateAdminEmail(trimmedEmail);
    console.log(`[SERVER_AUTH] Admin email updated to: ${updatedAdmin.email}`);
    return {
      success: true,
      email: updatedAdmin.email
    };
  }
  /**
   * Change administrator password. Requires valid session + current password.
   */
  async changePassword(sessionToken, currentPasscode, newPasscode) {
    const user = this.getSessionUser(sessionToken);
    if (!user) {
      return {
        success: false,
        errorEn: "Unauthorized session. Please sign in again.",
        errorMr: "\u0905\u0928\u0927\u093F\u0915\u0943\u0924 \u0938\u0924\u094D\u0930. \u0915\u0943\u092A\u092F\u093E \u092A\u0941\u0928\u094D\u0939\u093E \u0932\u0949\u0917\u093F\u0928 \u0915\u0930\u093E."
      };
    }
    const trimmedCurrent = currentPasscode.trim();
    const trimmedNew = newPasscode.trim();
    if (!trimmedCurrent) {
      return {
        success: false,
        errorEn: "Please enter your current password.",
        errorMr: "\u0915\u0943\u092A\u092F\u093E \u0906\u092A\u0932\u093E \u0938\u0927\u094D\u092F\u093E\u091A\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F \u0915\u0930\u093E."
      };
    }
    if (trimmedNew.length < 12) {
      return {
        success: false,
        errorEn: "New password must be at least 12 characters long.",
        errorMr: "\u0928\u0935\u0940\u0928 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0915\u093F\u092E\u093E\u0928 \u0967\u0968 \u0905\u0915\u094D\u0937\u0930\u093E\u0902\u091A\u093E \u0905\u0938\u093E\u0935\u093E."
      };
    }
    if (trimmedCurrent === trimmedNew) {
      return {
        success: false,
        errorEn: "New password cannot be the same as your current password.",
        errorMr: "\u0928\u0935\u0940\u0928 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0938\u0927\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921\u0938\u093E\u0930\u0916\u093E\u091A \u0905\u0938\u0942 \u0936\u0915\u0924 \u0928\u093E\u0939\u0940."
      };
    }
    const admin = serverDb.getAdmin();
    const isPassMatch = await bcrypt2.compare(trimmedCurrent, admin.passwordHash);
    if (!isPassMatch) {
      return {
        success: false,
        errorEn: "Current administrator password is incorrect.",
        errorMr: "\u0938\u0927\u094D\u092F\u093E\u091A\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u091A\u0941\u0915\u0940\u091A\u093E \u0906\u0939\u0947."
      };
    }
    const salt = bcrypt2.genSaltSync(10);
    const newHash = bcrypt2.hashSync(trimmedNew, salt);
    serverDb.updateAdminPasswordHash(newHash);
    console.log(`[SERVER_AUTH] Admin password updated successfully.`);
    return { success: true };
  }
  /**
   * Request password reset token. Rate limited, generates crypto token, sends email.
   */
  async forgotPassword(identifier, clientIp = "127.0.0.1") {
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      return {
        success: false,
        messageEn: "Please enter your registered email address.",
        messageMr: "\u0915\u0943\u092A\u092F\u093E \u0906\u092A\u0932\u093E \u0928\u094B\u0902\u0926\u0923\u0940\u0915\u0943\u0924 \u0908\u092E\u0947\u0932 \u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F \u0915\u0930\u093E.",
        emailSent: false,
        providerConfigured: isEmailProviderConfigured(),
        errorEn: "Please enter your registered email address.",
        errorMr: "\u0915\u0943\u092A\u092F\u093E \u0906\u092A\u0932\u093E \u0928\u094B\u0902\u0926\u0923\u0940\u0915\u0943\u0924 \u0908\u092E\u0947\u0932 \u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F \u0915\u0930\u093E."
      };
    }
    const isAllowed = serverDb.checkRateLimit(`forgot_${clientIp}`, 5, 15 * 60 * 1e3);
    if (!isAllowed) {
      return {
        success: false,
        messageEn: "Too many reset requests. Please wait 15 minutes before trying again.",
        messageMr: "\u0935\u093E\u0930\u0902\u0935\u093E\u0930 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0935\u093F\u0928\u0902\u0924\u094D\u092F\u093E \u0906\u0932\u094D\u092F\u093E \u0906\u0939\u0947\u0924. \u0915\u0943\u092A\u092F\u093E \u0967\u096B \u092E\u093F\u0928\u093F\u091F\u0947 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u093E.",
        emailSent: false,
        providerConfigured: isEmailProviderConfigured(),
        errorEn: "Too many password reset requests. Please wait a few minutes.",
        errorMr: "\u0935\u093E\u0930\u0902\u0935\u093E\u0930 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0935\u093F\u0928\u0902\u0924\u094D\u092F\u093E \u0906\u0932\u094D\u092F\u093E \u0906\u0939\u0947\u0924. \u0915\u0943\u092A\u092F\u093E \u0915\u093E\u0939\u0940 \u092E\u093F\u0928\u093F\u091F\u0947 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u093E."
      };
    }
    if (!isEmailProviderConfigured()) {
      console.warn(`[SERVER_AUTH] Password reset requested for ${trimmed}, but SMTP is not configured in .env.`);
      return {
        success: false,
        messageEn: "Password reset email service is not configured. Please contact the administrator.",
        messageMr: "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0908\u092E\u0947\u0932 \u0938\u0947\u0935\u093E \u0915\u0949\u0928\u094D\u092B\u093F\u0917\u0930 \u0915\u0947\u0932\u0947\u0932\u0940 \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u093E\u0936\u0940 \u0938\u0902\u092A\u0930\u094D\u0915 \u0938\u093E\u0927\u093E.",
        providerConfigured: false,
        emailSent: false,
        errorEn: "Password reset email service is not configured. Please contact the administrator.",
        errorMr: "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0908\u092E\u0947\u0932 \u0938\u0947\u0935\u093E \u0915\u0949\u0928\u094D\u092B\u093F\u0917\u0930 \u0915\u0947\u0932\u0947\u0932\u0940 \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u093E\u0936\u0940 \u0938\u0902\u092A\u0930\u094D\u0915 \u0938\u093E\u0927\u093E."
      };
    }
    const admin = serverDb.getAdmin();
    const isMatch = trimmed === admin.email.toLowerCase() || trimmed === admin.username.toLowerCase();
    if (!isMatch) {
      return {
        success: true,
        messageEn: "If this email is associated with the administrative account, password reset instructions have been sent to your inbox.",
        messageMr: "\u0939\u093E \u0908\u092E\u0947\u0932 \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u0916\u093E\u0924\u094D\u092F\u093E\u0936\u0940 \u091C\u094B\u0921\u0932\u0947\u0932\u093E \u0905\u0938\u0932\u094D\u092F\u093E\u0938, \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0932\u093F\u0902\u0915 \u0906\u092A\u0932\u094D\u092F\u093E \u0907\u0928\u092C\u0949\u0915\u094D\u0938\u092E\u0927\u094D\u092F\u0947 \u092A\u093E\u0920\u0935\u0932\u0940 \u0917\u0947\u0932\u0940 \u0906\u0939\u0947.",
        emailSent: true,
        providerConfigured: true
      };
    }
    const token = crypto2.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
    serverDb.saveResetToken({
      token,
      email: admin.email,
      expiresAt,
      used: false,
      createdAt: Date.now(),
      ip: clientIp
    });
    console.log(`[SERVER_AUTH] Generated single-use password reset token for ${admin.email}`);
    const emailResult = await sendPasswordResetEmail(admin.email, token);
    if (!emailResult.sent) {
      console.error(`[SERVER_AUTH] Failed to dispatch password reset email to ${admin.email}:`, emailResult.error);
      return {
        success: false,
        messageEn: "Failed to deliver password reset email. Please check server SMTP configuration.",
        messageMr: "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0908\u092E\u0947\u0932 \u092A\u093E\u0920\u0935\u0924\u093E \u0906\u0932\u093E \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u0938\u0930\u094D\u0935\u094D\u0939\u0930 SMTP \u0915\u0949\u0928\u094D\u092B\u093F\u0917\u0930\u0947\u0936\u0928 \u0924\u092A\u093E\u0938\u093E.",
        emailSent: false,
        providerConfigured: true,
        errorEn: "Failed to deliver password reset email. Please check server SMTP configuration.",
        errorMr: "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0908\u092E\u0947\u0932 \u092A\u093E\u0920\u0935\u0924\u093E \u0906\u0932\u093E \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u0938\u0930\u094D\u0935\u094D\u0939\u0930 SMTP \u0915\u0949\u0928\u094D\u092B\u093F\u0917\u0930\u0947\u0936\u0928 \u0924\u092A\u093E\u0938\u093E."
      };
    }
    return {
      success: true,
      messageEn: "A password reset link has been dispatched to your registered email address.",
      messageMr: "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0932\u093F\u0902\u0915 \u0906\u092A\u0932\u094D\u092F\u093E \u0928\u094B\u0902\u0926\u0923\u0940\u0915\u0943\u0924 \u0908\u092E\u0947\u0932\u0935\u0930 \u092A\u093E\u0920\u0935\u0932\u0940 \u0917\u0947\u0932\u0940 \u0906\u0939\u0947.",
      emailSent: true,
      providerConfigured: true
    };
  }
  /**
   * Validate password reset token without consuming it.
   */
  validateResetToken(token) {
    const trimmed = (token || "").trim();
    if (!trimmed) {
      return {
        valid: false,
        errorEn: "Please provide a valid reset token.",
        errorMr: "\u0915\u0943\u092A\u092F\u093E \u0935\u0948\u0927 \u0930\u0940\u0938\u0947\u091F \u091F\u094B\u0915\u0928 \u0926\u094D\u092F\u093E."
      };
    }
    const record = serverDb.getResetToken(trimmed);
    if (!record) {
      return {
        valid: false,
        errorEn: "Invalid or unrecognized password reset token.",
        errorMr: "\u0905\u0935\u0948\u0927 \u0915\u093F\u0902\u0935\u093E \u0905\u0928\u094B\u0933\u0916\u0940 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u091F\u094B\u0915\u0928."
      };
    }
    if (record.used) {
      return {
        valid: false,
        errorEn: "This password reset link has already been used. Please request a new one.",
        errorMr: "\u0939\u0940 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0932\u093F\u0902\u0915 \u0906\u0927\u0940\u091A \u0935\u093E\u092A\u0930\u0932\u0940 \u0917\u0947\u0932\u0940 \u0906\u0939\u0947. \u0915\u0943\u092A\u092F\u093E \u0928\u0935\u0940\u0928 \u0932\u093F\u0902\u0915\u091A\u0940 \u0935\u093F\u0928\u0902\u0924\u0940 \u0915\u0930\u093E."
      };
    }
    if (record.expiresAt <= Date.now()) {
      return {
        valid: false,
        errorEn: "This password reset link has expired (15-minute validity). Please request a new one.",
        errorMr: "\u092F\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0932\u093F\u0902\u0915\u091A\u0940 \u092E\u0941\u0926\u0924 \u0938\u0902\u092A\u0932\u0940 \u0906\u0939\u0947 (\u0967\u096B \u092E\u093F\u0928\u093F\u091F\u0947). \u0915\u0943\u092A\u092F\u093E \u0928\u0935\u0940\u0928 \u0932\u093F\u0902\u0915\u091A\u0940 \u0935\u093F\u0928\u0902\u0924\u0940 \u0915\u0930\u093E."
      };
    }
    return { valid: true };
  }
  /**
   * Consume reset token and set new password.
   */
  async resetPasswordWithToken(token, newPasscode) {
    const validation = this.validateResetToken(token);
    if (!validation.valid) {
      return {
        success: false,
        errorEn: validation.errorEn,
        errorMr: validation.errorMr
      };
    }
    const trimmedPass = newPasscode.trim();
    if (trimmedPass.length < 12) {
      return {
        success: false,
        errorEn: "New password must be at least 12 characters long.",
        errorMr: "\u0928\u0935\u0940\u0928 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0915\u093F\u092E\u093E\u0928 \u0967\u0968 \u0905\u0915\u094D\u0937\u0930\u093E\u0902\u091A\u093E \u0905\u0938\u093E\u0935\u093E."
      };
    }
    const salt = bcrypt2.genSaltSync(10);
    const newHash = bcrypt2.hashSync(trimmedPass, salt);
    serverDb.updateAdminPasswordHash(newHash);
    serverDb.markResetTokenUsed(token.trim());
    console.log(`[SERVER_AUTH] Admin password successfully reset with single-use token.`);
    return { success: true };
  }
  /**
   * Get public server authentication metadata.
   */
  getAuthStatus() {
    const admin = serverDb.getAdmin();
    return {
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
      emailProviderConfigured: isEmailProviderConfigured()
    };
  }
};
var serverAuthService = new ServerAuthService();

// server/routes.ts
var authRouter = Router();
authRouter.use(json());
var SESSION_COOKIE_NAME = "baliraja_admin_session";
var CSRF_COOKIE_NAME = "baliraja_csrf_token";
var SESSION_TTL_MS2 = 2 * 60 * 60 * 1e3;
function isSecureCookie() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || Boolean(process.env.APP_URL?.startsWith("https")) || process.env.COOKIE_SECURE === "true";
}
function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    maxAge: SESSION_TTL_MS2,
    path: "/"
  };
}
function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    // Must be readable by client JS to attach to X-CSRF-Token header
    secure: isSecureCookie(),
    sameSite: "lax",
    maxAge: SESSION_TTL_MS2,
    path: "/"
  };
}
function parseCookies(header) {
  if (!header) return {};
  const headerStr = Array.isArray(header) ? header.join("; ") : header;
  const cookies = {};
  const pairs = headerStr.split(";");
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].trim();
    if (!pair) continue;
    const eqIdx = pair.indexOf("=");
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
function getClientIp(req) {
  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
}
function getSessionToken(req) {
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    return String(req.cookies[SESSION_COOKIE_NAME]).trim();
  }
  const rawCookieHeader = req.headers["cookie"] || req.headers["Cookie"];
  const cookies = parseCookies(rawCookieHeader);
  if (cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME].trim();
  }
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const authStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (authStr && typeof authStr === "string" && authStr.startsWith("Bearer ")) {
    return authStr.slice(7).trim();
  }
  const customToken = req.headers["x-session-token"];
  return (Array.isArray(customToken) ? customToken[0] : customToken) || "";
}
function verifyCsrfToken(req, res, sessionToken) {
  const session = serverDb.getSession(sessionToken);
  if (!session) {
    res.status(401).json({
      success: false,
      authenticated: false,
      errorEn: "Session expired or unauthorized. Please sign in again.",
      errorMr: "\u0938\u0924\u094D\u0930 \u0938\u0902\u092A\u0932\u0947 \u0906\u0939\u0947 \u0915\u093F\u0902\u0935\u093E \u0905\u0928\u0927\u093F\u0915\u0943\u0924 \u0906\u0939\u0947. \u0915\u0943\u092A\u092F\u093E \u092A\u0941\u0928\u094D\u0939\u093E \u0932\u0949\u0917\u093F\u0928 \u0915\u0930\u093E."
    });
    return false;
  }
  const headerCsrf = (req.headers["x-csrf-token"] || req.headers["x-xsrf-token"] || "").trim();
  if (!session.csrfToken || !headerCsrf) {
    res.status(403).json({
      success: false,
      errorEn: "Security validation failed: CSRF token is missing in x-csrf-token header. Please refresh and try again.",
      errorMr: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u0921\u0924\u093E\u0933\u0923\u0940 \u0905\u092F\u0936\u0938\u094D\u0935\u0940: CSRF \u091F\u094B\u0915\u0928 \u0917\u0939\u093E\u0933 \u0906\u0939\u0947. \u0915\u0943\u092A\u092F\u093E \u092A\u0947\u091C \u0930\u0940\u092B\u094D\u0930\u0947\u0936 \u0915\u0930\u093E."
    });
    return false;
  }
  const a = Buffer.from(session.csrfToken);
  const b = Buffer.from(headerCsrf);
  if (a.length !== b.length || !crypto3.timingSafeEqual(a, b)) {
    res.status(403).json({
      success: false,
      errorEn: "Security validation failed: Invalid CSRF token.",
      errorMr: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u0921\u0924\u093E\u0933\u0923\u0940 \u0905\u092F\u0936\u0938\u094D\u0935\u0940: \u0905\u0935\u0948\u0927 CSRF \u091F\u094B\u0915\u0928."
    });
    return false;
  }
  return true;
}
authRouter.get("/status", (_req, res) => {
  const status = serverAuthService.getAuthStatus();
  res.json({ success: true, ...status });
});
authRouter.post("/login", async (req, res) => {
  const { username, passcode, password, email, identifier } = req.body || {};
  const ip = getClientIp(req);
  const user = username || email || identifier || "";
  const pass = passcode || password || "";
  const result = await serverAuthService.login(user, pass, ip);
  if (!result.success || !result.sessionToken) {
    res.status(401).json({
      success: false,
      errorEn: result.errorEn,
      errorMr: result.errorMr
    });
    return;
  }
  res.cookie(SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieOptions());
  if (result.csrfToken) {
    res.cookie(CSRF_COOKIE_NAME, result.csrfToken, getCsrfCookieOptions());
  }
  res.json({
    success: true,
    user: result.user,
    csrfToken: result.csrfToken
  });
});
authRouter.get("/session", (req, res) => {
  const token = getSessionToken(req);
  const session = serverDb.getSession(token);
  const user = serverAuthService.getSessionUser(token);
  if (!session || !user) {
    res.status(401).json({
      success: false,
      authenticated: false,
      errorEn: "No active session",
      errorMr: "\u0915\u094B\u0923\u0924\u0947\u0939\u0940 \u0938\u0915\u094D\u0930\u093F\u092F \u0938\u0924\u094D\u0930 \u0928\u093E\u0939\u0940"
    });
    return;
  }
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
authRouter.post("/logout", (req, res) => {
  const token = getSessionToken(req);
  if (token) {
    serverAuthService.logout(token);
  }
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/"
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/"
  });
  res.json({ success: true });
});
authRouter.post("/change-email", async (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      errorEn: "Unauthorized session. Please sign in again.",
      errorMr: "\u0905\u0928\u0927\u093F\u0915\u0943\u0924 \u0938\u0924\u094D\u0930. \u0915\u0943\u092A\u092F\u093E \u092A\u0941\u0928\u094D\u0939\u093E \u0932\u0949\u0917\u093F\u0928 \u0915\u0930\u093E."
    });
    return;
  }
  if (!verifyCsrfToken(req, res, token)) {
    return;
  }
  const { currentPassword, currentPasscode, newEmail } = req.body || {};
  const pass = currentPassword || currentPasscode || "";
  const result = await serverAuthService.changeEmail(token, pass, newEmail || "");
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});
authRouter.post("/change-password", async (req, res) => {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      errorEn: "Unauthorized session. Please sign in again.",
      errorMr: "\u0905\u0928\u0927\u093F\u0915\u0943\u0924 \u0938\u0924\u094D\u0930. \u0915\u0943\u092A\u092F\u093E \u092A\u0941\u0928\u094D\u0939\u093E \u0932\u0949\u0917\u093F\u0928 \u0915\u0930\u093E."
    });
    return;
  }
  if (!verifyCsrfToken(req, res, token)) {
    return;
  }
  const { currentPassword, currentPasscode, newPassword, newPasscode } = req.body || {};
  const curPass = currentPassword || currentPasscode || "";
  const newPass = newPassword || newPasscode || "";
  const result = await serverAuthService.changePassword(token, curPass, newPass);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/"
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/"
  });
  res.json(result);
});
authRouter.post("/forgot-password", async (req, res) => {
  const { email, identifier } = req.body || {};
  const ip = getClientIp(req);
  const emailVal = email || identifier || "";
  const result = await serverAuthService.forgotPassword(emailVal, ip);
  const status = result.success ? 200 : result.providerConfigured === false ? 503 : 400;
  res.status(status).json(result);
});
authRouter.post("/validate-reset-token", (req, res) => {
  const ip = getClientIp(req);
  const isAllowed = serverDb.checkRateLimit(`validate_token_${ip}`, 15, 10 * 60 * 1e3);
  if (!isAllowed) {
    res.status(429).json({
      valid: false,
      errorEn: "Too many reset token verification attempts. Please wait 10 minutes before trying again.",
      errorMr: "\u091F\u094B\u0915\u0928 \u092A\u0921\u0924\u093E\u0933\u0923\u0940\u091A\u0947 \u0905\u0928\u0947\u0915 \u0905\u092F\u0936\u0938\u094D\u0935\u0940 \u092A\u094D\u0930\u092F\u0924\u094D\u0928 \u091D\u093E\u0932\u0947 \u0906\u0939\u0947\u0924. \u0915\u0943\u092A\u092F\u093E \u0967\u0966 \u092E\u093F\u0928\u093F\u091F\u0947 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u093E."
    });
    return;
  }
  const { token } = req.body || {};
  const result = serverAuthService.validateResetToken(token || "");
  if (!result.valid) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});
authRouter.post("/reset-password", async (req, res) => {
  const { token, newPassword, newPasscode } = req.body || {};
  const newPass = newPassword || newPasscode || "";
  const result = await serverAuthService.resetPasswordWithToken(token || "", newPass);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

// server/contentRoutes.ts
import { Router as Router2 } from "express";
import crypto5 from "node:crypto";

// server/contentDb.ts
import fs3 from "node:fs";
import path3 from "node:path";

// src/data/productData.ts
var sampleProducts = [
  // ── SEEDS (assets/products/seeds/) ──────────────────────────────────────
  {
    id: "prod-seed-01",
    slug: "katyayani-imd-70",
    nameEnglish: "Katyayani IMD-70 (Imidacloprid 70% WG)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0906\u092F\u090F\u092E\u0921\u0940-\u096D\u0966 (\u0907\u092E\u093F\u0921\u093E\u0915\u094D\u0932\u094B\u092A\u094D\u0930\u093F\u0921 \u096D\u0966% \u0921\u092C\u094D\u0932\u094D\u092F\u0942\u091C\u0940)",
    categoryId: "seeds",
    subcategoryId: "field-crops",
    descriptionEnglish: "Systemic seed treatment and seedling crop protector formulation with Imidacloprid 70% WG.",
    descriptionMarathi: "\u0907\u092E\u093F\u0921\u093E\u0915\u094D\u0932\u094B\u092A\u094D\u0930\u093F\u0921 \u096D\u0966% \u0921\u092C\u094D\u0932\u094D\u092F\u0942\u091C\u0940 \u0905\u0938\u0932\u0947\u0932\u0947 \u0909\u091A\u094D\u091A \u0915\u093E\u0930\u094D\u092F\u0915\u094D\u0937\u092E \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915 \u0935 \u092C\u0940\u091C\u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0918\u091F\u0915.",
    image: "/assets/products/seeds/seed_1.png",
    price: 420,
    availability: "available",
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      "Early stage protection against sucking pests",
      "Protects young seedlings from soil & foliar insects",
      "High active ingredient systemic formulation"
    ],
    keyPointsMarathi: [
      "\u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u0935\u093F\u0930\u0941\u0926\u094D\u0927 \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u091A\u0947 \u0938\u0902\u0930\u0915\u094D\u0937\u0923",
      "\u0924\u0930\u0941\u0923 \u0930\u094B\u092A\u093E\u0902\u091A\u0947 \u091C\u092E\u093F\u0928\u0940\u0924\u0940\u0932 \u0935 \u092A\u093E\u0928\u093E\u0902\u0935\u0930\u0940\u0932 \u0915\u093F\u0921\u0940\u0902\u092A\u093E\u0938\u0942\u0928 \u0930\u0915\u094D\u0937\u0923",
      "\u0909\u091A\u094D\u091A \u092A\u094D\u0930\u092D\u093E\u0935\u0940 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0918\u091F\u0915"
    ],
    suitableCropsEnglish: ["Cotton", "Soybean", "Chilli", "Vegetables"],
    suitableCropsMarathi: ["\u0915\u093E\u092A\u0942\u0938", "\u0938\u094B\u092F\u093E\u092C\u0940\u0928", "\u092E\u093F\u0930\u091A\u0940", "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E"]
  },
  {
    id: "prod-seed-02",
    slug: "katyayani-nashak",
    nameEnglish: "Katyayani Nashak (Fipronil 40% + Imidacloprid 40% WG)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0928\u093E\u0936\u0915 (\u092B\u093F\u092A\u094D\u0930\u094B\u0928\u093F\u0932 \u096A\u0966% + \u0907\u092E\u093F\u0921\u093E\u0915\u094D\u0932\u094B\u092A\u094D\u0930\u093F\u0921 \u096A\u0966% \u0921\u092C\u094D\u0932\u094D\u092F\u0942\u091C\u0940)",
    categoryId: "seeds",
    subcategoryId: "field-crops",
    descriptionEnglish: "Dual active contact and systemic protection formulation for robust seedling establishment.",
    descriptionMarathi: "\u0930\u094B\u092A\u0935\u093E\u091F\u093F\u0915\u093E \u0935 \u0909\u0917\u0935\u0923 \u0938\u0902\u0930\u0915\u094D\u0937\u0923\u093E\u0938\u093E\u0920\u0940 \u0926\u0941\u0939\u0947\u0930\u0940 \u0915\u093E\u0930\u094D\u092F\u0915\u094D\u0937\u092E \u0938\u0902\u092A\u0930\u094D\u0915 \u0935 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915.",
    image: "/assets/products/seeds/seed_2.png",
    price: 680,
    availability: "available",
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      "Combined dual action chemistry",
      "Fast root uptake and quick knockdown",
      "Extends protection across vegetative stages"
    ],
    keyPointsMarathi: [
      "\u0926\u0941\u0939\u0947\u0930\u0940 \u0930\u093E\u0938\u093E\u092F\u0928\u093F\u0915 \u0918\u091F\u0915\u093E\u0902\u091A\u0940 \u091C\u094B\u0921",
      "\u092E\u0941\u0933\u093E\u0902\u0935\u093E\u091F\u0947 \u0924\u094D\u0935\u0930\u093F\u0924 \u0936\u094B\u0937\u0923 \u0935 \u091C\u0932\u0926 \u092A\u0930\u093F\u0923\u093E\u092E",
      "\u0936\u093E\u0915\u0940\u092F \u0935\u093E\u0922\u0940\u0926\u0930\u092E\u094D\u092F\u093E\u0928 \u0926\u0940\u0930\u094D\u0918\u0915\u093E\u0933 \u0938\u0902\u0930\u0915\u094D\u0937\u0923"
    ],
    suitableCropsEnglish: ["Sugarcane", "Cotton", "Groundnut"],
    suitableCropsMarathi: ["\u090A\u0938", "\u0915\u093E\u092A\u0942\u0938", "\u092D\u0941\u0908\u092E\u0942\u0917"]
  },
  {
    id: "prod-seed-03",
    slug: "katyayani-joker",
    nameEnglish: "Katyayani Joker (Fipronil 80% WDG)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u091C\u094B\u0915\u0930 (\u092B\u093F\u092A\u094D\u0930\u094B\u0928\u093F\u0932 \u096E\u0966% \u0921\u092C\u094D\u0932\u094D\u092F\u0942\u0921\u0940\u091C\u0940)",
    categoryId: "seeds",
    subcategoryId: "field-crops",
    descriptionEnglish: "Advanced water dispersible granule insecticide for broad spectrum root and foliar protection.",
    descriptionMarathi: "\u092E\u0941\u0933\u093E\u0902\u091A\u0947 \u0935 \u092A\u093F\u0915\u093E\u0902\u091A\u0947 \u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u092A\u093E\u0938\u0942\u0928 \u0938\u0902\u0930\u0915\u094D\u0937\u0923\u093E\u0938\u093E\u0920\u0940 \u0906\u0927\u0941\u0928\u093F\u0915 \u0921\u092C\u094D\u0932\u094D\u092F\u0942\u0921\u0940\u091C\u0940 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915.",
    image: "/assets/products/seeds/seed_3.png",
    price: 550,
    availability: "available",
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      "Broad spectrum pest control",
      "Concentrated 80% WDG formulation",
      "Fosters healthy tillering and foliage"
    ],
    keyPointsMarathi: [
      "\u0935\u093F\u0935\u093F\u0927 \u0915\u093F\u0921\u0940\u0902\u0935\u0930 \u0935\u094D\u092F\u093E\u092A\u0915 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923",
      "\u096E\u0966% \u090F\u0915\u093E\u0917\u094D\u0930 \u0926\u093E\u0923\u0947\u0926\u093E\u0930 \u0938\u094D\u0935\u0930\u0942\u092A",
      "\u091C\u094B\u092E\u0926\u093E\u0930 \u092B\u0941\u091F\u0935\u0947 \u0935 \u0928\u093F\u0930\u094B\u0917\u0940 \u092A\u093E\u0928\u093E\u0902\u0938\u093E\u0920\u0940 \u0909\u092A\u092F\u0941\u0915\u094D\u0924"
    ],
    suitableCropsEnglish: ["Paddy", "Chilli", "Vegetables"],
    suitableCropsMarathi: ["\u092D\u093E\u0924", "\u092E\u093F\u0930\u091A\u0940", "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E"]
  },
  {
    id: "prod-seed-04",
    slug: "katyayani-fantastic",
    nameEnglish: "Katyayani Fantastic (Chlorantraniliprole 0.4% GR)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u092B\u0945\u0928\u094D\u091F\u0945\u0938\u094D\u091F\u093F\u0915 (\u0915\u094D\u0932\u094B\u0930\u0972\u0928\u094D\u091F\u094D\u0930\u093E\u0928\u093F\u0932\u0940\u092A\u094D\u0930\u094B\u0932 \u0966.\u096A% \u091C\u0940\u0906\u0930)",
    categoryId: "seeds",
    subcategoryId: "field-crops",
    descriptionEnglish: "Granular soil application insecticide for long-lasting root zone security and stem borer management.",
    descriptionMarathi: "\u0916\u094B\u0921\u0915\u093F\u0921\u093E \u0935 \u091C\u092E\u093F\u0928\u0940\u0924\u0940\u0932 \u0915\u093F\u0921\u0940\u0902\u091A\u094D\u092F\u093E \u0926\u0940\u0930\u094D\u0918\u0915\u093E\u0932\u0940\u0928 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923\u093E\u0938\u093E\u0920\u0940 \u0926\u093E\u0923\u0947\u0926\u093E\u0930 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915.",
    image: "/assets/products/seeds/seed_4.png",
    price: 720,
    availability: "available",
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      "Extended residual control against borers",
      "Easy soil application granules",
      "Promotes deep root proliferation"
    ],
    keyPointsMarathi: [
      "\u0916\u094B\u0921\u0915\u093F\u0921\u0940\u0935\u093F\u0930\u0941\u0926\u094D\u0927 \u0926\u0940\u0930\u094D\u0918\u0915\u093E\u0933 \u091F\u093F\u0915\u093E\u090A \u092A\u0930\u093F\u0923\u093E\u092E",
      "\u091C\u092E\u093F\u0928\u0940\u0924 \u091F\u093E\u0915\u0923\u094D\u092F\u093E\u0938 \u0938\u094B\u092A\u0947 \u0926\u093E\u0923\u0947\u0926\u093E\u0930 \u0938\u094D\u0935\u0930\u0942\u092A",
      "\u092E\u0941\u0933\u093E\u0902\u091A\u094D\u092F\u093E \u0916\u094B\u0932\u0935\u0930 \u0935\u093E\u0922\u0940\u0938 \u092A\u0942\u0930\u0915"
    ],
    suitableCropsEnglish: ["Paddy", "Sugarcane", "Maize"],
    suitableCropsMarathi: ["\u092D\u093E\u0924", "\u090A\u0938", "\u092E\u0915\u093E"]
  },
  // ── FERTILIZERS (assets/products/fertilizers/) ──────────────────────────
  {
    id: "prod-fert-01",
    slug: "katyayani-pro-grow",
    nameEnglish: "Katyayani PRO Grow (Gibberellic Acid 0.001% L)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u092A\u094D\u0930\u094B \u0917\u094D\u0930\u094B (\u091C\u093F\u092C\u0930\u0947\u0932\u093F\u0915 \u0972\u0938\u093F\u0921 \u0966.\u0966\u0966\u0967% \u090F\u0932)",
    categoryId: "fertilizers",
    subcategoryId: "soil-conditioners",
    descriptionEnglish: "Plant growth regulator liquid promoting cell elongation, tillering, and vigorous vegetative development.",
    descriptionMarathi: "\u092A\u093F\u0915\u093E\u0902\u091A\u0940 \u0936\u093E\u0915\u0940\u092F \u0935\u093E\u0922, \u092B\u0941\u091F\u0935\u0947 \u0906\u0923\u093F \u091C\u094B\u092E\u0926\u093E\u0930 \u0935\u093E\u0922\u0940\u0938 \u091A\u093E\u0932\u0928\u093E \u0926\u0947\u0923\u093E\u0930\u0947 \u0935\u0928\u0938\u094D\u092A\u0924\u0940 \u0935\u093E\u0922 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0915.",
    image: "/assets/products/fertilizers/fertilizer_1.png",
    price: 380,
    availability: "available",
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      "Accelerates natural cell division & growth",
      "Enhances photosynthetic canopy efficiency",
      "Improves produce size and market appeal"
    ],
    keyPointsMarathi: [
      "\u0928\u0948\u0938\u0930\u094D\u0917\u093F\u0915 \u092A\u0947\u0936\u0940 \u0935\u093F\u092D\u093E\u091C\u0928 \u0935 \u0935\u093E\u0922\u0940\u0938 \u0917\u0924\u0940",
      "\u092A\u093E\u0928\u093E\u0902\u092E\u0927\u0940\u0932 \u092A\u094D\u0930\u0915\u093E\u0936\u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u094D\u0937\u092E\u0924\u093E \u0935\u093E\u0922\u0935\u0924\u0947",
      "\u0909\u0924\u094D\u092A\u093E\u0926\u0928\u093E\u091A\u093E \u0906\u0915\u093E\u0930 \u0935 \u091A\u092E\u0915 \u0938\u0941\u0927\u093E\u0930\u0924\u0947"
    ],
    suitableCropsEnglish: ["Ginger", "Grapes", "Vegetables", "Field Crops"],
    suitableCropsMarathi: ["\u0906\u0932\u0947", "\u0926\u094D\u0930\u093E\u0915\u094D\u0937\u0947", "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E", "\u0936\u0947\u0924\u0940 \u092A\u093F\u0915\u0947"]
  },
  {
    id: "prod-fert-02",
    slug: "katyayani-bhannaat",
    nameEnglish: "Katyayani Bhannaat Biostimulant",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u092D\u0928\u094D\u0928\u093E\u091F \u092C\u093E\u092F\u094B\u0938\u094D\u091F\u093F\u092E\u094D\u092F\u0941\u0932\u0902\u091F",
    categoryId: "fertilizers",
    subcategoryId: "organic-bio",
    descriptionEnglish: "Premium natural biostimulant formulation boosting metabolic rate, flower retention, and yield quality.",
    descriptionMarathi: "\u092B\u0941\u0932\u0917\u0933 \u0930\u094B\u0916\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940, \u092B\u0941\u0932\u094B\u0930\u093E \u0935\u093E\u0922\u0935\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0935 \u0917\u0941\u0923\u0935\u0924\u094D\u0924\u093E\u092A\u0942\u0930\u094D\u0923 \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u093E\u0938\u093E\u0920\u0940 \u092A\u094D\u0930\u0940\u092E\u093F\u092F\u092E \u092C\u093E\u092F\u094B\u0938\u094D\u091F\u093F\u092E\u094D\u092F\u0941\u0932\u0902\u091F.",
    image: "/assets/products/fertilizers/fertilizer_2.png",
    price: 650,
    availability: "available",
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      "Reduces flower and young fruit drop",
      "Enhances nutrient uptake and plant vigor",
      "Improves crop stress tolerance"
    ],
    keyPointsMarathi: [
      "\u092B\u0941\u0932\u0917\u0933 \u0935 \u092B\u0933\u0917\u0933 \u0915\u092E\u0940 \u0915\u0930\u0923\u094D\u092F\u093E\u0938 \u092E\u0926\u0924",
      "\u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F \u0936\u094B\u0937\u0923 \u0935 \u092A\u093F\u0915\u093E\u091A\u0940 \u0924\u093E\u0915\u0926 \u0935\u093E\u0922\u0935\u0924\u0947",
      "\u092A\u094D\u0930\u0924\u093F\u0915\u0942\u0932 \u0939\u0935\u093E\u092E\u093E\u0928\u093E\u0924 \u092A\u093F\u0915\u093E\u091A\u0947 \u0930\u0915\u094D\u0937\u0923"
    ],
    suitableCropsEnglish: ["Cotton", "Soybean", "Chilli", "Ginger"],
    suitableCropsMarathi: ["\u0915\u093E\u092A\u0942\u0938", "\u0938\u094B\u092F\u093E\u092C\u0940\u0928", "\u092E\u093F\u0930\u091A\u0940", "\u0906\u0932\u0947"]
  },
  {
    id: "prod-fert-03",
    slug: "katyayani-mix-micronutrient-super",
    nameEnglish: "Katyayani Mix Micronutrient-Super (100% Water Soluble)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u092E\u093F\u0915\u094D\u0938 \u092E\u093E\u092F\u0915\u094D\u0930\u094B\u0928\u094D\u092F\u0941\u091F\u094D\u0930\u093F\u090F\u0902\u091F-\u0938\u0941\u092A\u0930 (\u0967\u0966\u0966% \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F)",
    categoryId: "fertilizers",
    subcategoryId: "micronutrients",
    descriptionEnglish: "Multi-element chelated trace mineral mixture for extensive controlled growth and deficiency correction.",
    descriptionMarathi: "\u092A\u093F\u0915\u093E\u0902\u092E\u0927\u0940\u0932 \u0938\u0930\u094D\u0935 \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u0940 \u0915\u092E\u0924\u0930\u0924\u093E \u092D\u0930\u0942\u0928 \u0915\u093E\u0922\u0923\u093E\u0930\u0947 \u0967\u0966\u0966% \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u092E\u093E\u092F\u0915\u094D\u0930\u094B\u0928\u094D\u092F\u0941\u091F\u094D\u0930\u093F\u090F\u0902\u091F.",
    image: "/assets/products/fertilizers/fertilizer_3.png",
    price: 490,
    availability: "available",
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      "100% drip and foliar soluble composition",
      "Corrects multiple trace mineral deficiencies",
      "Restores lush green foliage and vitality"
    ],
    keyPointsMarathi: [
      "\u0920\u093F\u092C\u0915 \u0935 \u092B\u0935\u093E\u0930\u0923\u0940\u0938\u093E\u0920\u0940 \u0967\u0966\u0966% \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u092E\u093F\u0936\u094D\u0930\u0923",
      "\u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u0940 \u0915\u092E\u0924\u0930\u0924\u093E \u0924\u094D\u0935\u0930\u093F\u0924 \u0926\u0942\u0930 \u0915\u0930\u0924\u0947",
      "\u092A\u093F\u0915\u093E\u0932\u093E \u0939\u093F\u0930\u0935\u0947\u0917\u093E\u0930 \u0935 \u091F\u0935\u091F\u0935\u0940\u0924 \u0920\u0947\u0935\u0924\u0947"
    ],
    suitableCropsEnglish: ["All Field Crops", "Horticulture", "Vegetables"],
    suitableCropsMarathi: ["\u0938\u0930\u094D\u0935 \u0936\u0947\u0924\u0940 \u092A\u093F\u0915\u0947", "\u092B\u0933\u092C\u093E\u0917\u093E", "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E"]
  },
  {
    id: "prod-fert-04",
    slug: "katyayani-zinc-sulphate-monohydrate",
    nameEnglish: "Katyayani Zinc Sulphate Monohydrate 33%",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u091D\u093F\u0902\u0915 \u0938\u0932\u094D\u092B\u0947\u091F \u092E\u094B\u0928\u094B\u0939\u093E\u092F\u0921\u094D\u0930\u0947\u091F \u0969\u0969%",
    categoryId: "fertilizers",
    subcategoryId: "micronutrients",
    descriptionEnglish: "High purity concentrated Zinc 33% formulation for healthy green foliage and enzymatic enzyme activation.",
    descriptionMarathi: "\u0915\u094D\u0932\u094B\u0930\u094B\u092B\u093F\u0932 \u0928\u093F\u0930\u094D\u092E\u093F\u0924\u0940 \u0935 \u092A\u093F\u0915\u093E\u0902\u091A\u094D\u092F\u093E \u0928\u093F\u0930\u094B\u0917\u0940 \u0935\u093E\u0922\u0940\u0938\u093E\u0920\u0940 \u0909\u091A\u094D\u091A \u0926\u0930\u094D\u091C\u093E\u091A\u0947 \u0969\u0969% \u091D\u093F\u0902\u0915 \u0938\u0932\u094D\u092B\u0947\u091F \u0916\u0924.",
    image: "/assets/products/fertilizers/fertilizer_4.png",
    price: 260,
    availability: "available",
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      "High concentrated Zinc (Zn 33%) + Sulphur (S 15%)",
      "Prevents yellowing and stunted internodes",
      "Essential for enzyme systems & chlorophyll"
    ],
    keyPointsMarathi: [
      "\u0909\u091A\u094D\u091A \u091D\u093F\u0902\u0915 (\u0969\u0969%) \u0935 \u0917\u0902\u0927\u0915 (\u0967\u096B%) \u092A\u094D\u0930\u092E\u093E\u0923",
      "\u092A\u093E\u0928\u0947 \u092A\u093F\u0935\u0933\u0940 \u092A\u0921\u0923\u0947 \u0935 \u0916\u0941\u0902\u091F\u0932\u0947\u0932\u0940 \u0935\u093E\u0922 \u0930\u094B\u0916\u0924\u0947",
      "\u0939\u0930\u093F\u0924\u0926\u094D\u0930\u0935\u094D\u092F \u0935 \u0938\u0902\u091C\u0940\u0935\u0915 \u0928\u093F\u0930\u094D\u092E\u093F\u0924\u0940\u0938\u093E\u0920\u0940 \u0905\u0924\u094D\u092F\u093E\u0935\u0936\u094D\u092F\u0915"
    ],
    suitableCropsEnglish: ["Paddy", "Maize", "Wheat", "Ginger"],
    suitableCropsMarathi: ["\u092D\u093E\u0924", "\u092E\u0915\u093E", "\u0917\u0939\u0942", "\u0906\u0932\u0947"]
  },
  // ── PESTICIDES / CROP PROTECTION (assets/products/crop_protection/) ──────
  {
    id: "prod-pest-01",
    slug: "katyayani-garuda",
    nameEnglish: "Katyayani Garuda (Bispyribac Sodium 10% SC)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0917\u0930\u0941\u0921\u093E (\u092C\u093F\u0938\u094D\u092A\u0930\u093F\u092C\u0945\u0915 \u0938\u094B\u0921\u093F\u092F\u092E \u0967\u0966% \u090F\u0938\u0938\u0940)",
    categoryId: "crop-protection",
    subcategoryId: "herbicides",
    descriptionEnglish: "Broad spectrum post-emergence systemic herbicide targeting major grasses and broadleaf weeds.",
    descriptionMarathi: "\u0909\u0917\u0935\u0923\u0940\u0928\u0902\u0924\u0930 \u0917\u0935\u0924\u093E\u0933 \u0935 \u0930\u0941\u0902\u0926 \u092A\u093E\u0928\u093E\u0902\u091A\u094D\u092F\u093E \u0924\u0923\u093E\u0902\u091A\u0947 \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0928\u093F\u0930\u094D\u092E\u0942\u0932\u0928 \u0915\u0930\u0923\u093E\u0930\u0947 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0924\u0923\u0928\u093E\u0936\u0915.",
    image: "/assets/products/crop_protection/crop_protection1.png",
    price: 580,
    availability: "available",
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      "Selective post-emergence weed solution",
      "Fast systemic translocation to roots & foliage",
      "Safe on recommended crop stages"
    ],
    keyPointsMarathi: [
      "\u0909\u0917\u0935\u0923\u0940\u0928\u0902\u0924\u0930 \u0935\u093E\u092A\u0930\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0928\u093F\u0935\u0921\u0915 \u0924\u0923\u0928\u093E\u0936\u0915",
      "\u092E\u0941\u0933\u093E\u0902\u092A\u0930\u094D\u092F\u0902\u0924 \u091C\u0932\u0926 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0938\u0902\u091A\u0932\u0928",
      "\u0936\u093F\u092B\u093E\u0930\u0938 \u0915\u0947\u0932\u0947\u0932\u094D\u092F\u093E \u092A\u0940\u0915 \u091F\u092A\u094D\u092A\u094D\u092F\u093E\u0902\u0935\u0930 \u092A\u0942\u0930\u094D\u0923\u092A\u0923\u0947 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924"
    ],
    suitableCropsEnglish: ["Paddy (Rice)", "Nurseries"],
    suitableCropsMarathi: ["\u092D\u093E\u0924 (\u0927\u093E\u0928)", "\u0930\u094B\u092A\u0935\u093E\u091F\u093F\u0915\u093E"]
  },
  {
    id: "prod-pest-02",
    slug: "katyayani-weed-killer",
    nameEnglish: "Katyayani Weed Killer (Non-Selective Herbicide)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0935\u0940\u0921 \u0915\u093F\u0932\u0930 (\u092C\u093F\u0928\u0928\u093F\u0935\u0921\u0915 \u0924\u0923\u0928\u093E\u0936\u0915)",
    categoryId: "crop-protection",
    subcategoryId: "herbicides",
    descriptionEnglish: "Fast-acting non-selective herbicide concentrate for bunds, orchards, and non-crop areas.",
    descriptionMarathi: "\u092C\u093E\u0902\u0927\u093E\u0935\u0930\u0940\u0932 \u0935 \u092C\u093E\u0917\u0947\u0924\u0940\u0932 \u0938\u0930\u094D\u0935 \u092A\u094D\u0930\u0915\u093E\u0930\u091A\u094D\u092F\u093E \u0915\u0920\u0940\u0923 \u0924\u0923\u093E\u0902\u091A\u094D\u092F\u093E \u0924\u094D\u0935\u0930\u093F\u0924 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923\u093E\u0938\u093E\u0920\u0940 \u092C\u093F\u0928\u0928\u093F\u0935\u0921\u0915 \u0924\u0923\u0928\u093E\u0936\u0915.",
    image: "/assets/products/crop_protection/crop_protection2.png",
    price: 340,
    availability: "available",
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      "Controls annual & perennial stubborn weeds",
      "Ideal for farm borders, bunds & prep tillage",
      "Complete foliage and root desiccation"
    ],
    keyPointsMarathi: [
      "\u0915\u0920\u0940\u0923 \u0935 \u092C\u0939\u0941\u0935\u0930\u094D\u0937\u0940\u092F \u0924\u0923\u093E\u0902\u0935\u0930 \u0930\u093E\u092E\u092C\u093E\u0923 \u0909\u092A\u093E\u092F",
      "\u0936\u0947\u0924\u093E\u091A\u0947 \u092C\u093E\u0902\u0927, \u092A\u0921\u0940\u0915 \u091C\u092E\u0940\u0928 \u0935 \u092A\u0942\u0930\u094D\u0935\u092E\u0936\u093E\u0917\u0924\u0940\u0938\u093E\u0920\u0940 \u092F\u094B\u0917\u094D\u092F",
      "\u0924\u0923\u093E\u0902\u091A\u0940 \u092A\u093E\u0928\u0947 \u0935 \u092E\u0941\u0933\u0947 \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0938\u0941\u0915\u0942\u0928 \u0928\u0937\u094D\u091F \u0939\u094B\u0924\u093E\u0924"
    ],
    suitableCropsEnglish: ["Orchards", "Field Bunds", "Fallow Land"],
    suitableCropsMarathi: ["\u092B\u0933\u092C\u093E\u0917\u093E", "\u0936\u0947\u0924\u093E\u091A\u0947 \u092C\u093E\u0902\u0927", "\u092A\u0921\u0940\u0915 \u091C\u092E\u0940\u0928"]
  },
  {
    id: "prod-pest-03",
    slug: "katyayani-clearance",
    nameEnglish: "Katyayani Clearance (Paraquat Dichloride 24% SL)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0915\u094D\u0932\u093F\u0905\u0930\u0928\u094D\u0938 (\u092A\u0945\u0930\u093E\u0915\u094D\u0935\u0949\u091F \u0921\u093E\u092F\u0915\u094D\u0932\u094B\u0930\u093E\u0908\u0921 \u0968\u096A% \u090F\u0938\u090F\u0932)",
    categoryId: "crop-protection",
    subcategoryId: "herbicides",
    descriptionEnglish: "Quick knockdown contact herbicide destroying all sprayed green foliage within hours.",
    descriptionMarathi: "\u0938\u0902\u092A\u0930\u094D\u0915\u093E\u0924 \u092F\u0947\u0923\u093E\u0931\u094D\u092F\u093E \u0939\u093F\u0930\u0935\u094D\u092F\u093E \u092A\u093E\u0928\u093E\u0902\u091A\u093E \u0915\u093E\u0939\u0940 \u0924\u093E\u0938\u093E\u0902\u0924 \u0928\u093E\u092F\u0928\u093E\u091F \u0915\u0930\u0923\u093E\u0930\u0947 \u0924\u094D\u0935\u0930\u093F\u0924 \u092A\u0930\u093F\u0923\u093E\u092E\u0915\u093E\u0930\u0915 \u0924\u0923\u0928\u093E\u0936\u0915.",
    image: "/assets/products/crop_protection/crop_protection3.png",
    price: 410,
    availability: "available",
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      "Ultra-fast contact burn down action",
      "Rainfast within 30 minutes of application",
      "Inactivated immediately upon soil contact"
    ],
    keyPointsMarathi: [
      "\u0915\u093E\u0939\u0940 \u0924\u093E\u0938\u093E\u0902\u0924 \u0924\u0923 \u091C\u093E\u0933\u0923\u094D\u092F\u093E\u091A\u0940 \u0905\u0924\u094D\u092F\u0902\u0924 \u0935\u0947\u0917\u0935\u093E\u0928 \u0915\u094D\u0937\u092E\u0924\u093E",
      "\u092B\u0935\u093E\u0930\u0923\u0940\u0928\u0902\u0924\u0930 \u0969\u0966 \u092E\u093F\u0928\u093F\u091F\u093E\u0902\u0924 \u092A\u093E\u0935\u0938\u093E\u091A\u093E \u092A\u0930\u093F\u0923\u093E\u092E \u0928\u093E\u0939\u0940",
      "\u092E\u093E\u0924\u0940\u0924 \u092A\u0921\u0924\u093E\u091A \u0928\u093F\u0937\u094D\u0915\u094D\u0930\u093F\u092F \u0939\u094B\u0923\u093E\u0930\u0947 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0924\u0902\u0924\u094D\u0930\u091C\u094D\u091E\u093E\u0928"
    ],
    suitableCropsEnglish: ["Tea", "Coffee", "Orchards", "Non-Crop Bunds"],
    suitableCropsMarathi: ["\u092B\u0933\u092C\u093E\u0917\u093E", "\u0924\u0923 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923", "\u0936\u0947\u0924\u0940 \u092C\u093E\u0902\u0927"]
  },
  {
    id: "prod-pest-04",
    slug: "katyayani-lemar-surfactant",
    nameEnglish: "Katyayani Lemar + Surfactant (Tembotrione 34.4% SC)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0932\u0947\u092E\u093E\u0930 + \u0938\u0930\u092B\u0945\u0915\u094D\u091F\u0902\u091F (\u091F\u0947\u092E\u094D\u092C\u094B\u091F\u094D\u0930\u093F\u0913\u0928 \u0969\u096A.\u096A% \u090F\u0938\u0938\u0940)",
    categoryId: "crop-protection",
    subcategoryId: "herbicides",
    descriptionEnglish: "Advanced selective maize weed control combo pack with dedicated penetration surfactant.",
    descriptionMarathi: "\u092E\u0915\u093E \u092A\u093F\u0915\u093E\u0938\u093E\u0920\u0940 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0935 \u0938\u0930\u094D\u0935 \u0924\u0923\u093E\u0902\u091A\u093E \u0916\u093E\u0924\u094D\u0930\u0940\u0936\u0940\u0930 \u092C\u0902\u0926\u094B\u092C\u0938\u094D\u0924 \u0915\u0930\u0923\u093E\u0930\u093E \u0935\u093F\u0936\u0947\u0937 \u0915\u0949\u092E\u094D\u092C\u094B \u092A\u0945\u0915.",
    image: "/assets/products/crop_protection/crop_protection4.png",
    price: 950,
    availability: "out_of_stock",
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      "Selective herbicide specifically for maize",
      "Dedicated surfactant enhances leaf penetration",
      "Destroys broadleaf & grassy weeds simultaneously"
    ],
    keyPointsMarathi: [
      "\u092E\u0915\u093E \u092A\u093F\u0915\u093E\u0938\u093E\u0920\u0940 \u0935\u093F\u0936\u0947\u0937 \u0928\u093F\u0935\u0921\u0915 \u0924\u0923\u0928\u093E\u0936\u0915",
      "\u0938\u0930\u092B\u0945\u0915\u094D\u091F\u0902\u091F\u092E\u0941\u0933\u0947 \u0924\u0923\u093E\u0902\u091A\u094D\u092F\u093E \u092A\u093E\u0928\u093E\u0902\u092E\u0927\u094D\u092F\u0947 \u091C\u0932\u0926 \u0936\u094B\u0937\u0923",
      "\u0930\u0941\u0902\u0926 \u0935 \u0905\u0930\u0941\u0902\u0926 \u0926\u094B\u0928\u094D\u0939\u0940 \u092A\u094D\u0930\u0915\u093E\u0930\u091A\u094D\u092F\u093E \u0924\u0923\u093E\u0902\u0935\u0930 \u092A\u094D\u0930\u092D\u093E\u0935\u0940"
    ],
    suitableCropsEnglish: ["Maize (Corn)"],
    suitableCropsMarathi: ["\u092E\u0915\u093E"]
  },
  // ── COMBO KITS (assets/products/combokits/) ──────────────────────────────
  {
    id: "prod-combo-01",
    slug: "paddy-trishul-combo",
    nameEnglish: "Paddy Trishul Combo (Insecticide + Humic + Zinc)",
    nameMarathi: "\u092D\u093E\u0924 \u0924\u094D\u0930\u093F\u0936\u0942\u0933 \u0935\u093F\u0936\u0947\u0937 \u0915\u0949\u092E\u094D\u092C\u094B (\u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915 + \u0939\u094D\u092F\u0941\u092E\u093F\u0915 + \u091D\u093F\u0902\u0915)",
    categoryId: "combos",
    subcategoryId: "ginger-rhizome-treatment",
    descriptionEnglish: "Complete 3-way protection & nutrition package for healthy tillering, pest defense, and root proliferation in paddy.",
    descriptionMarathi: "\u092D\u093E\u0924 \u092A\u093F\u0915\u093E\u0924\u0940\u0932 \u092B\u0941\u091F\u0935\u0947 \u0935\u093E\u0922, \u0915\u093F\u0921\u0940\u0902\u092A\u093E\u0938\u0942\u0928 \u0938\u0902\u0930\u0915\u094D\u0937\u0923 \u0935 \u092E\u0941\u0933\u093E\u0902\u091A\u094D\u092F\u093E \u091C\u094B\u092E\u0926\u093E\u0930 \u0935\u093E\u0922\u0940\u0938\u093E\u0920\u0940 \u0924\u094D\u0930\u093F\u0938\u0942\u0924\u094D\u0930\u0940 \u0915\u0949\u092E\u094D\u092C\u094B \u092A\u0945\u0915.",
    image: "/assets/products/combokits/combokit_1.png",
    price: 1450,
    availability: "available",
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      "3-in-1 synergy: Insect defense + Humic root growth + Zinc nutrition",
      "Specially balanced for high-yield paddy fields",
      "Protects young tillers and promotes uniform stand"
    ],
    keyPointsMarathi: [
      "\u0969-\u0907\u0928-\u0967 \u0924\u094D\u0930\u093F\u0938\u0942\u0924\u094D\u0930\u0940: \u0915\u0940\u0921 \u0938\u0902\u0930\u0915\u094D\u0937\u0923 + \u0939\u094D\u092F\u0941\u092E\u093F\u0915 \u092E\u0941\u0933\u0935\u093E\u0922 + \u091D\u093F\u0902\u0915 \u092A\u094B\u0937\u0923",
      "\u092D\u093E\u0924 \u0936\u0947\u0924\u0940\u0924 \u0935\u093F\u0915\u094D\u0930\u092E\u0940 \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u093E\u0938\u093E\u0920\u0940 \u0938\u0902\u0924\u0941\u0932\u093F\u0924 \u0938\u0902\u092F\u094B\u091C\u0928",
      "\u0928\u0935\u0940\u0928 \u092B\u0941\u091F\u0935\u094D\u092F\u093E\u0902\u091A\u0947 \u0930\u0915\u094D\u0937\u0923 \u0915\u0930\u0942\u0928 \u090F\u0915\u0938\u093E\u0930\u0916\u0940 \u0935\u093E\u0922 \u0926\u0947\u0924\u0947"
    ],
    suitableCropsEnglish: ["Paddy (Rice)"],
    suitableCropsMarathi: ["\u092D\u093E\u0924 (\u0927\u093E\u0928)"]
  },
  {
    id: "prod-combo-02",
    slug: "katyayani-soybean-all-in-one-combo",
    nameEnglish: "Katyayani Soybean All In One Combo",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0938\u094B\u092F\u093E\u092C\u0940\u0928 \u0911\u0932 \u0907\u0928 \u0935\u0928 \u0915\u0949\u092E\u094D\u092C\u094B",
    categoryId: "combos",
    subcategoryId: "tillering-yield-booster",
    descriptionEnglish: "Comprehensive seasonal package covering nutrition, disease defense, flower booster, and pod development.",
    descriptionMarathi: "\u0938\u094B\u092F\u093E\u092C\u0940\u0928 \u092A\u093F\u0915\u093E\u091A\u0947 \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u092A\u094B\u0937\u0923, \u0930\u094B\u0917 \u092A\u094D\u0930\u0924\u093F\u092C\u0902\u0927, \u092B\u0941\u0932\u094B\u0930\u093E \u0935\u093E\u0922 \u0935 \u0926\u093E\u0923\u0947 \u092D\u0930\u0923\u0940\u0938\u093E\u0920\u0940 \u092A\u0930\u093F\u092A\u0942\u0930\u094D\u0923 \u092A\u0945\u0915\u0947\u091C.",
    image: "/assets/products/combokits/combokit_2.png",
    price: 2100,
    availability: "available",
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      "All-in-one complete soybean crop protection & nourishment",
      "Contains Bloom Booster, Humic 98%, Fungicide & Water Soluble NPK",
      "Maximizes pod formation and test grain weight"
    ],
    keyPointsMarathi: [
      "\u0938\u094B\u092F\u093E\u092C\u0940\u0928\u0938\u093E\u0920\u0940 \u0938\u0930\u094D\u0935\u0938\u092E\u093E\u0935\u0947\u0936\u0915 \u092A\u0940\u0915 \u0938\u0902\u0930\u0915\u094D\u0937\u0923 \u0935 \u092A\u094B\u0937\u0923 \u0915\u093F\u091F",
      "\u092C\u094D\u0932\u0942\u092E \u092C\u0942\u0938\u094D\u091F\u0930, \u0939\u094D\u092F\u0941\u092E\u093F\u0915 \u096F\u096E%, \u092C\u0941\u0930\u0936\u0940\u0928\u093E\u0936\u0915 \u0935 \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0916\u0924\u093E\u0902\u091A\u093E \u0938\u092E\u093E\u0935\u0947\u0936",
      "\u0936\u0947\u0902\u0917\u093E\u0902\u091A\u0940 \u0938\u0902\u0916\u094D\u092F\u093E \u0935 \u0926\u093E\u0923\u094D\u092F\u093E\u0902\u091A\u0947 \u0935\u091C\u0928 \u0935\u093E\u0922\u0935\u0923\u094D\u092F\u093E\u0938 \u092E\u0926\u0924"
    ],
    suitableCropsEnglish: ["Soybean"],
    suitableCropsMarathi: ["\u0938\u094B\u092F\u093E\u092C\u0940\u0928"]
  },
  {
    id: "prod-combo-03",
    slug: "katyayani-cotton-1st-spray-combo",
    nameEnglish: "Katyayani Cotton 1st Spray Combo (15-25 Days)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0915\u093E\u092A\u0942\u0938 \u092A\u0939\u093F\u0932\u0940 \u092B\u0935\u093E\u0930\u0923\u0940 \u0915\u0949\u092E\u094D\u092C\u094B (\u0967\u096B-\u0968\u096B \u0926\u093F\u0935\u0938)",
    categoryId: "combos",
    subcategoryId: "tillering-yield-booster",
    descriptionEnglish: "Early stage cotton management package defending young foliage from sucking pests with bio-stimulants.",
    descriptionMarathi: "\u0915\u093E\u092A\u0938\u093E\u091A\u094D\u092F\u093E \u0967\u096B \u0924\u0947 \u0968\u096B \u0926\u093F\u0935\u0938\u093E\u0902\u091A\u094D\u092F\u093E \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u091A\u094D\u092F\u093E \u0915\u093E\u0933\u093E\u0924 \u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u091A\u0947 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0935 \u091C\u094B\u092E\u0926\u093E\u0930 \u0936\u093E\u0915\u0940\u092F \u0935\u093E\u0922\u0940\u0938\u093E\u0920\u0940 \u0915\u093F\u091F.",
    image: "/assets/products/combokits/combokit_3.png",
    price: 1250,
    availability: "available",
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      "Formulated specifically for 15-25 day young cotton crop",
      "Protects from thrips, jassids, aphids and whiteflies",
      "Seaweed extract + Spreader for rapid vegetative growth"
    ],
    keyPointsMarathi: [
      "\u0967\u096B \u0924\u0947 \u0968\u096B \u0926\u093F\u0935\u0938\u093E\u0902\u091A\u094D\u092F\u093E \u0915\u094B\u0935\u0933\u094D\u092F\u093E \u0915\u092A\u093E\u0936\u0940\u0938\u093E\u0920\u0940 \u0916\u093E\u0938 \u0924\u092F\u093E\u0930 \u0915\u0947\u0932\u0947\u0932\u0940 \u0915\u093F\u091F",
      "\u0925\u094D\u0930\u093F\u092A\u094D\u0938, \u092E\u093E\u0935\u093E, \u0924\u0941\u0921\u0924\u0941\u0921\u0947 \u0935 \u092A\u093E\u0902\u0922\u0930\u0940 \u092E\u093E\u0936\u0940\u092A\u093E\u0938\u0942\u0928 \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0930\u0915\u094D\u0937\u0923",
      "\u0938\u0940\u0935\u0940\u0921 \u0905\u0930\u094D\u0915 \u0935 \u0938\u094D\u092A\u094D\u0930\u0947\u0921\u0930\u092E\u0941\u0933\u0947 \u092A\u093E\u0928\u093E\u0902\u091A\u0940 \u091C\u094B\u092E\u0926\u093E\u0930 \u0935\u093E\u0922"
    ],
    suitableCropsEnglish: ["Cotton"],
    suitableCropsMarathi: ["\u0915\u093E\u092A\u0942\u0938"]
  },
  {
    id: "prod-combo-04",
    slug: "katyayani-paddy-1st-spray-combo",
    nameEnglish: "Katyayani Paddy 1st Spray Combo (12-20 Days)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u092D\u093E\u0924 \u092A\u0939\u093F\u0932\u0940 \u092B\u0935\u093E\u0930\u0923\u0940 \u0915\u0949\u092E\u094D\u092C\u094B (\u0967\u0968-\u0968\u0966 \u0926\u093F\u0935\u0938)",
    categoryId: "combos",
    subcategoryId: "ginger-rot-management",
    descriptionEnglish: "Early vegetative paddy booster bundle providing rapid root anchoring, NPK 19:19:19, and fungal protection.",
    descriptionMarathi: "\u092D\u093E\u0924 \u0930\u094B\u092A\u093E\u0902\u091A\u094D\u092F\u093E \u092A\u0941\u0928\u0930\u094D\u0932\u093E\u0917\u0935\u0921\u0940\u0928\u0902\u0924\u0930 \u092E\u0941\u0933\u093E\u0902\u091A\u0940 \u0918\u091F\u094D\u091F \u092A\u0915\u0921, \u092B\u0941\u091F\u0935\u094D\u092F\u093E\u0902\u091A\u0940 \u0938\u0902\u0916\u094D\u092F\u093E \u0906\u0923\u093F \u092A\u094B\u0937\u0923 \u0926\u0947\u0923\u093E\u0930\u093E \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u091A\u093E \u0915\u0949\u092E\u094D\u092C\u094B.",
    image: "/assets/products/combokits/combokit_4.png",
    price: 1350,
    availability: "available",
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      "12-20 days transplantation recovery and fast rooting kit",
      "Includes NPK 19:19:19, Biostimulant, Systemic Fungicide & Spreader",
      "Boosts tiller count and prevents early blast"
    ],
    keyPointsMarathi: [
      "\u092A\u0941\u0928\u0930\u094D\u0932\u093E\u0917\u0935\u0921\u0940\u0928\u0902\u0924\u0930 \u0967\u0968 \u0924\u0947 \u0968\u0966 \u0926\u093F\u0935\u0938\u093E\u0902\u0924 \u092E\u0941\u0933\u0947 \u0930\u0941\u091C\u0935\u0923\u093E\u0930\u0940 \u0935\u093F\u0936\u0947\u0937 \u0915\u093F\u091F",
      "\u0967\u096F:\u0967\u096F:\u0967\u096F \u0916\u0924, \u092C\u093E\u092F\u094B\u0938\u094D\u091F\u093F\u092E\u094D\u092F\u0941\u0932\u0902\u091F, \u092C\u0941\u0930\u0936\u0940\u0928\u093E\u0936\u0915 \u0935 \u0938\u094D\u092A\u094D\u0930\u0947\u0921\u0930\u091A\u093E \u0938\u092E\u093E\u0935\u0947\u0936",
      "\u092B\u0941\u091F\u0935\u0947 \u0935\u093E\u0922\u0935\u0942\u0928 \u0915\u0930\u092A\u093E \u0930\u094B\u0917\u093E\u092A\u093E\u0938\u0942\u0928 \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u091A\u0947 \u0938\u0902\u0930\u0915\u094D\u0937\u0923"
    ],
    suitableCropsEnglish: ["Paddy"],
    suitableCropsMarathi: ["\u092D\u093E\u0924"]
  },
  // ── BESTSELLER PRODUCTS (assets/products/best_seller/) ───────────────────
  {
    id: "prod-best-01",
    slug: "katyayani-anti-virus",
    nameEnglish: "Katyayani Anti Virus (Broad Spectrum Organic Viricide)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0905\u0901\u091F\u0940 \u0935\u094D\u0939\u093E\u092F\u0930\u0938 (\u0938\u0947\u0902\u0926\u094D\u0930\u093F\u092F \u0935\u093F\u0937\u093E\u0923\u0942\u0928\u093E\u0936\u0915)",
    categoryId: "crop-protection",
    subcategoryId: "bio-pesticides",
    descriptionEnglish: "Broad spectrum organic viricide formulation preventing and curing viral infections like mosaic and leaf curl.",
    descriptionMarathi: "\u092A\u093F\u0915\u093E\u0902\u0935\u0930\u0940\u0932 \u092E\u094B\u091D\u0945\u0915, \u091A\u0941\u0930\u0921\u093E-\u092E\u0941\u0930\u0921\u093E \u0935 \u0935\u093F\u0937\u093E\u0923\u0942\u091C\u0928\u094D\u092F \u0930\u094B\u0917\u093E\u0902\u091A\u0947 \u092A\u094D\u0930\u092D\u093E\u0935\u0940 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0930\u0923\u093E\u0930\u0947 \u0938\u0947\u0902\u0926\u094D\u0930\u093F\u092F \u0914\u0937\u0927.",
    image: "/assets/products/best_seller/AntiVirus_75248f94-8de8-47c9-9592-a7aa49e36eeb.webp",
    price: 680,
    availability: "available",
    featured: true,
    isBestseller: true,
    popularity: 98,
    displayOrder: 101,
    isSample: false,
    keyPointsEnglish: [
      "Certified organic plant viricide",
      "Stops viral multiplication and leaf curl damage",
      "Restores active growth in infected shoots"
    ],
    keyPointsMarathi: [
      "\u092A\u094D\u0930\u092E\u093E\u0923\u093F\u0924 \u0938\u0947\u0902\u0926\u094D\u0930\u093F\u092F \u0935\u093F\u0937\u093E\u0923\u0942 \u092A\u094D\u0930\u0924\u093F\u092C\u0902\u0927\u0915",
      "\u0935\u094D\u0939\u093E\u092F\u0930\u0938\u091A\u093E \u092A\u094D\u0930\u0938\u093E\u0930 \u0935 \u092A\u093E\u0928\u093E\u0902\u091A\u093E \u091A\u0941\u0930\u0921\u093E-\u092E\u0941\u0930\u0921\u093E \u0930\u094B\u0916\u0924\u0947",
      "\u092C\u093E\u0927\u093F\u0924 \u0936\u0947\u0902\u0921\u094D\u092F\u093E\u0902\u092E\u0927\u094D\u092F\u0947 \u0928\u0935\u0940\u0928 \u0928\u093F\u0930\u094B\u0917\u0940 \u092B\u0942\u091F \u0906\u0923\u0924\u0947"
    ],
    suitableCropsEnglish: ["Chilli", "Papaya", "Tomato", "Soybean", "Okra"],
    suitableCropsMarathi: ["\u092E\u093F\u0930\u091A\u0940", "\u092A\u092A\u0908", "\u091F\u094B\u092E\u0945\u091F\u094B", "\u0938\u094B\u092F\u093E\u092C\u0940\u0928", "\u092D\u0947\u0902\u0921\u0940"]
  },
  {
    id: "prod-best-02",
    slug: "katyayani-chakraveer",
    nameEnglish: "Katyayani Chakraveer (Chlorantraniliprole 18.5% SC)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u091A\u0915\u094D\u0930\u0935\u0940\u0930 (\u0915\u094D\u0932\u094B\u0930\u0972\u0928\u094D\u091F\u094D\u0930\u093E\u0928\u093F\u0932\u0940\u092A\u094D\u0930\u094B\u0932 \u0967\u096E.\u096B% \u090F\u0938\u0938\u0940)",
    categoryId: "crop-protection",
    subcategoryId: "insecticides",
    descriptionEnglish: "Premium broad spectrum insecticide delivering long-lasting protection against caterpillars, bollworms and borers.",
    descriptionMarathi: "\u092C\u094B\u0902\u0921\u0905\u0933\u0940, \u0916\u094B\u0921\u0915\u093F\u0921\u093E \u0935 \u0938\u0930\u094D\u0935 \u092A\u094D\u0930\u0915\u093E\u0930\u091A\u094D\u092F\u093E \u0905\u0933\u094D\u092F\u093E\u0902\u0935\u0930 \u0926\u0940\u0930\u094D\u0918\u0915\u093E\u0933 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0926\u0947\u0923\u093E\u0930\u0947 \u0906\u0927\u0941\u0928\u093F\u0915 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915.",
    image: "/assets/products/best_seller/ChakraveerNewMockup.webp",
    price: 850,
    availability: "available",
    featured: true,
    isBestseller: true,
    popularity: 95,
    displayOrder: 102,
    isSample: false,
    keyPointsEnglish: [
      "Advanced ryanodine receptor activator",
      "Extremely low dosage with rainfast performance",
      "Safe for beneficial natural predators"
    ],
    keyPointsMarathi: [
      "\u0906\u0927\u0941\u0928\u093F\u0915 \u0924\u0902\u0924\u094D\u0930\u091C\u094D\u091E\u093E\u0928\u093E\u0935\u0930 \u0906\u0927\u093E\u0930\u093F\u0924 \u0905\u0933\u0940\u0928\u093E\u0936\u0915",
      "\u0915\u092E\u0940 \u092A\u094D\u0930\u092E\u093E\u0923\u093E\u0924 \u0926\u0940\u0930\u094D\u0918\u0915\u093E\u0933 \u092A\u0930\u093F\u0923\u093E\u092E\u0915\u093E\u0930\u0915",
      "\u092B\u0935\u093E\u0930\u0923\u0940\u0928\u0902\u0924\u0930 \u092A\u093E\u090A\u0938 \u0906\u0932\u093E \u0924\u0930\u0940 \u0927\u0941\u0935\u0942\u0928 \u091C\u093E\u0924 \u0928\u093E\u0939\u0940"
    ],
    suitableCropsEnglish: ["Cotton", "Paddy", "Sugarcane", "Soybean", "Vegetables"],
    suitableCropsMarathi: ["\u0915\u093E\u092A\u0942\u0938", "\u092D\u093E\u0924", "\u090A\u0938", "\u0938\u094B\u092F\u093E\u092C\u0940\u0928", "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E"]
  },
  {
    id: "prod-best-03",
    slug: "katyayani-chakrawarti",
    nameEnglish: "Katyayani Chakrawarti (Thiamethoxam 12.6% + Lambda 9.5% ZC)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u091A\u0915\u094D\u0930\u0935\u0930\u094D\u0924\u0940 (\u0925\u093E\u092F\u092E\u0947\u0925\u094B\u0915\u094D\u0938\u092E \u0967\u0968.\u096C% + \u0932\u0945\u092E\u094D\u092C\u0921\u093E \u096F.\u096B% \u091D\u0947\u0921\u0938\u0940)",
    categoryId: "crop-protection",
    subcategoryId: "insecticides",
    descriptionEnglish: "Synergistic systemic and contact insecticide effectively controlling sucking pests and chewing insects.",
    descriptionMarathi: "\u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940 \u0935 \u0905\u0933\u094D\u092F\u093E\u0902\u0935\u0930 \u0926\u0941\u0939\u0947\u0930\u0940 \u0935\u093E\u0930 \u0915\u0930\u0923\u093E\u0930\u0947 \u0936\u0915\u094D\u0924\u093F\u0936\u093E\u0932\u0940 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0935 \u0938\u094D\u092A\u0930\u094D\u0936\u091C\u0928\u094D\u092F \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915.",
    image: "/assets/products/best_seller/chakrawarti_7.webp",
    price: 760,
    availability: "available",
    featured: true,
    isBestseller: true,
    popularity: 92,
    displayOrder: 103,
    isSample: false,
    keyPointsEnglish: [
      "Dual-mode ZC capsule suspension technology",
      "Knockdown contact + long residual systemic defense",
      "Effective against jassids, aphids, thrips and bollworms"
    ],
    keyPointsMarathi: [
      "\u0915\u0945\u092A\u094D\u0938\u0942\u0932 \u0938\u0938\u094D\u092A\u0947\u0928\u094D\u0936\u0928 (\u091D\u0947\u0921\u0938\u0940) \u092A\u094D\u0930\u0917\u0924 \u0924\u0902\u0924\u094D\u0930\u091C\u094D\u091E\u093E\u0928",
      "\u0924\u094D\u0935\u0930\u093F\u0924 \u0938\u094D\u092A\u0930\u094D\u0936\u091C\u0928\u094D\u092F \u092A\u0930\u093F\u0923\u093E\u092E \u0935 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u091F\u093F\u0915\u093E\u090A\u092A\u0923\u093E",
      "\u0924\u0941\u0921\u0924\u0941\u0921\u0947, \u092E\u093E\u0935\u093E, \u0925\u094D\u0930\u093F\u092A\u094D\u0938 \u0935 \u092C\u094B\u0902\u0921\u0905\u0933\u0940\u0935\u0930 \u090F\u0915\u093E\u091A \u0935\u0947\u0933\u0940 \u092A\u094D\u0930\u092D\u093E\u0935\u0940"
    ],
    suitableCropsEnglish: ["Cotton", "Groundnut", "Soybean", "Chilli"],
    suitableCropsMarathi: ["\u0915\u093E\u092A\u0942\u0938", "\u092D\u0941\u0908\u092E\u0942\u0917", "\u0938\u094B\u092F\u093E\u092C\u0940\u0928", "\u092E\u093F\u0930\u091A\u0940"]
  },
  {
    id: "prod-best-04",
    slug: "katyayani-shikaar",
    nameEnglish: "Katyayani Shikaar (Acephate 75% SP)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0936\u093F\u0915\u093E\u0930 (\u0972\u0938\u092B\u0947\u091F \u096D\u096B% \u090F\u0938\u092A\u0940)",
    categoryId: "crop-protection",
    subcategoryId: "insecticides",
    descriptionEnglish: "Rapid action soluble powder insecticide targeting thrips, jassids, aphids and caterpillars.",
    descriptionMarathi: "\u092E\u093E\u0935\u093E, \u0924\u0941\u0921\u0924\u0941\u0921\u0947, \u0925\u094D\u0930\u093F\u092A\u094D\u0938 \u0935 \u0935\u093F\u0935\u093F\u0927 \u0915\u093F\u0921\u0940\u0902\u091A\u093E \u0924\u0924\u094D\u0915\u093E\u0933 \u0916\u093E\u0924\u094D\u092E\u093E \u0915\u0930\u0923\u093E\u0930\u0947 \u092A\u093E\u0923\u094D\u092F\u093E\u0924 \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915.",
    image: "/assets/products/best_seller/katyayani-shikaar-acephate-75-sp.webp",
    price: 480,
    availability: "available",
    featured: true,
    isBestseller: true,
    popularity: 90,
    displayOrder: 104,
    isSample: false,
    keyPointsEnglish: [
      "Proven organophosphate systemic chemistry",
      "Rapid foliar penetration and kill",
      "High compatibility in tank mixes"
    ],
    keyPointsMarathi: [
      "\u0936\u0947\u0924\u0915\u0931\u094D\u092F\u093E\u0902\u091A\u0947 \u0916\u093E\u0924\u094D\u0930\u0940\u0936\u0940\u0930 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915",
      "\u092A\u093E\u0928\u093E\u0902\u092E\u0927\u094D\u092F\u0947 \u091C\u0932\u0926 \u0936\u094B\u0937\u0942\u0928 \u0915\u093F\u0921\u0940\u0902\u091A\u093E \u0928\u093E\u0936",
      "\u0907\u0924\u0930 \u0914\u0937\u0927\u093E\u0902\u0938\u094B\u092C\u0924 \u092E\u093F\u0938\u0933\u0923\u094D\u092F\u093E\u0938 \u0938\u0941\u0932\u092D"
    ],
    suitableCropsEnglish: ["Cotton", "Paddy", "Vegetables"],
    suitableCropsMarathi: ["\u0915\u093E\u092A\u0942\u0938", "\u092D\u093E\u0924", "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E"]
  },
  {
    id: "prod-best-05",
    slug: "soybean-yellow-mosaic-combo",
    nameEnglish: "Katyayani Soybean Yellow Mosaic Virus Control Combo",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0938\u094B\u092F\u093E\u092C\u0940\u0928 \u092A\u093F\u0935\u0933\u093E \u092E\u094B\u091D\u0945\u0915 \u0935\u094D\u0939\u093E\u092F\u0930\u0938 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0949\u092E\u094D\u092C\u094B",
    categoryId: "combos",
    subcategoryId: "tillering-yield-booster",
    descriptionEnglish: "Specialized 3-product kit controlling whiteflies and curing yellow mosaic viral transmission in soybean.",
    descriptionMarathi: "\u0938\u094B\u092F\u093E\u092C\u0940\u0928\u0935\u0930\u0940\u0932 \u092A\u093E\u0902\u0922\u0930\u0940 \u092E\u093E\u0936\u0940 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0935 \u092A\u093F\u0935\u0933\u093E \u092E\u094B\u091D\u0945\u0915 \u0930\u094B\u0917\u093E\u0935\u0930 \u092E\u093E\u0924 \u0915\u0930\u0923\u093E\u0930\u093E \u0969 \u0914\u0937\u0927\u093E\u0902\u091A\u093E \u0935\u093F\u0936\u0947\u0937 \u0915\u0949\u092E\u094D\u092C\u094B \u0938\u0902\u091A.",
    image: "/assets/products/best_seller/SoybeanYellowMosaicVirusControlCombo.webp",
    price: 1850,
    availability: "available",
    featured: true,
    isBestseller: true,
    popularity: 96,
    displayOrder: 105,
    isSample: false,
    keyPointsEnglish: [
      "Combines Anti Virus viricide + Dualfen insecticide + Catalyser spreader",
      "Eradicates whitefly vectors while treating leaf yellowing",
      "Proven recovery in extensive field trials"
    ],
    keyPointsMarathi: [
      "\u0905\u0901\u091F\u0940 \u0935\u094D\u0939\u093E\u092F\u0930\u0938 + \u0921\u094D\u092F\u0941\u090F\u0932\u092B\u0947\u0928 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915 + \u0915\u0945\u091F\u0932\u093E\u092F\u091D\u0930 \u0938\u094D\u092A\u094D\u0930\u0947\u0921\u0930\u091A\u0947 \u0938\u0902\u092F\u094B\u091C\u0928",
      "\u092A\u093E\u0902\u0922\u0931\u094D\u092F\u093E \u092E\u093E\u0936\u0940\u091A\u093E \u092C\u0902\u0926\u094B\u092C\u0938\u094D\u0924 \u0915\u0930\u0942\u0928 \u092A\u093E\u0928\u093E\u0902\u091A\u093E \u092A\u093F\u0935\u0933\u0947\u092A\u0923\u093E \u0925\u093E\u0902\u092C\u0935\u0924\u0947",
      "\u0936\u0947\u0924\u0915\u0931\u094D\u092F\u093E\u0902\u091A\u094D\u092F\u093E \u0936\u0947\u0924\u093E\u0924 \u0916\u093E\u0924\u094D\u0930\u0940\u0936\u0940\u0930 \u0938\u0941\u0927\u093E\u0930\u0923\u093E"
    ],
    suitableCropsEnglish: ["Soybean", "Blackgram (Urad)", "Greengram (Moong)"],
    suitableCropsMarathi: ["\u0938\u094B\u092F\u093E\u092C\u0940\u0928", "\u0909\u0921\u0940\u0926", "\u092E\u0942\u0917"]
  },
  {
    id: "prod-best-06",
    slug: "katyayani-triple-attack",
    nameEnglish: "Katyayani Triple Attack (Bio Insecticide Trio)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u091F\u094D\u0930\u093F\u092A\u0932 \u0905\u091F\u0945\u0915 (\u091C\u0948\u0935\u093F\u0915 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915)",
    categoryId: "crop-protection",
    subcategoryId: "bio-pesticides",
    descriptionEnglish: "High potency consortium of Verticillium, Beauveria, and Metarhizium for biological pest management.",
    descriptionMarathi: "\u0935\u094D\u0939\u0930\u094D\u091F\u093F\u0938\u093F\u0932\u093F\u092F\u092E, \u092C\u093F\u0935\u094D\u0939\u0947\u0930\u093F\u092F\u093E \u0935 \u092E\u0947\u091F\u093E\u0930\u093E\u092F\u091D\u093F\u092F\u092E\u091A\u0947 \u092E\u093F\u0924\u094D\u0930\u092C\u0941\u0930\u0936\u0940 \u092F\u0941\u0915\u094D\u0924 \u0938\u0947\u0902\u0926\u094D\u0930\u093F\u092F \u091C\u0948\u0935\u093F\u0915 \u0915\u0940\u0921 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0915.",
    image: "/assets/products/best_seller/Triple_attack_1_2.webp",
    price: 620,
    availability: "available",
    featured: false,
    isBestseller: true,
    popularity: 88,
    displayOrder: 106,
    isSample: false,
    keyPointsEnglish: [
      "3-in-1 biological fungal formulation with high CFU count",
      "Safe for export crops and residue-free harvesting",
      "Effective against root grubs, thrips, and mealybugs"
    ],
    keyPointsMarathi: [
      "\u0969-\u0907\u0928-\u0967 \u092E\u093F\u0924\u094D\u0930\u092C\u0941\u0930\u0936\u0940\u0902\u091A\u0947 \u0928\u0948\u0938\u0930\u094D\u0917\u093F\u0915 \u091C\u0948\u0935\u093F\u0915 \u092E\u093F\u0936\u094D\u0930\u0923",
      "\u0928\u093F\u0930\u094D\u092F\u093E\u0924\u0915\u094D\u0937\u092E \u0935 \u0905\u0935\u0936\u093F\u0937\u094D\u091F \u0905\u0902\u0936\u092E\u0941\u0915\u094D\u0924 \u0936\u0947\u0924\u0940\u0938\u093E\u0920\u0940 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924",
      "\u0939\u0941\u092E\u0923\u0940, \u0925\u094D\u0930\u093F\u092A\u094D\u0938, \u092E\u093F\u0932\u0940\u092C\u0917 \u0935 \u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u0935\u0930 \u092A\u094D\u0930\u092D\u093E\u0935\u0940"
    ],
    suitableCropsEnglish: ["Sugarcane", "Ginger", "Turmeric", "Pomegranate", "Grapes"],
    suitableCropsMarathi: ["\u090A\u0938", "\u0906\u0932\u0947", "\u0939\u0933\u0926", "\u0921\u093E\u0933\u093F\u0902\u092C", "\u0926\u094D\u0930\u093E\u0915\u094D\u0937\u0947"]
  },
  {
    id: "prod-best-07",
    slug: "katyayani-bhumiraja",
    nameEnglish: "Katyayani Bhumiraja (VAM Bio Fertilizer)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u092D\u0942\u092E\u093F\u0930\u093E\u091C\u093E (\u092E\u093E\u092F\u0915\u094B\u0930\u093E\u092F\u091D\u093E \u091C\u0948\u0935\u093F\u0915 \u0916\u0924)",
    categoryId: "fertilizers",
    subcategoryId: "organic-bio",
    descriptionEnglish: "Root inoculant VAM mycorrhiza bio-fertilizer dramatically increasing nutrient and moisture absorbing root area.",
    descriptionMarathi: "\u092E\u0941\u0933\u093E\u0902\u091A\u0947 \u091C\u093E\u0933\u0947 \u0935 \u0915\u093E\u0930\u094D\u092F\u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0905\u0928\u0947\u0915 \u092A\u091F\u0940\u0902\u0928\u0940 \u0935\u093E\u0922\u0935\u0923\u093E\u0930\u0947 \u092E\u093E\u092F\u0915\u094B\u0930\u093E\u092F\u091D\u093E \u092F\u0941\u0915\u094D\u0924 \u0938\u0947\u0902\u0926\u094D\u0930\u093F\u092F \u091C\u0948\u0935\u093F\u0915 \u0916\u0924.",
    image: "/assets/products/best_seller/kattap_bag_1.webp",
    price: 520,
    availability: "available",
    featured: true,
    isBestseller: true,
    popularity: 94,
    displayOrder: 107,
    isSample: false,
    keyPointsEnglish: [
      "Enriched with Vesicular Arbuscular Mycorrhiza spores",
      "Expands root surface area by up to 10 times",
      "Maximizes phosphorus and micro-element uptake from soil"
    ],
    keyPointsMarathi: [
      "\u0938\u0915\u094D\u0930\u093F\u092F \u092E\u093E\u092F\u0915\u094B\u0930\u093E\u092F\u091D\u093E \u091C\u093F\u0935\u093E\u0923\u0942\u0902\u0928\u0940 \u0938\u092E\u0943\u0926\u094D\u0927",
      "\u092E\u0941\u0933\u093E\u0902\u091A\u0940 \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F \u0936\u094B\u0937\u0923 \u0915\u0915\u094D\u0937\u093E \u0967\u0966 \u092A\u091F\u0940\u0902\u092A\u0930\u094D\u092F\u0902\u0924 \u0935\u093E\u0922\u0935\u0924\u0947",
      "\u091C\u092E\u093F\u0928\u0940\u0924\u0940\u0932 \u0938\u094D\u0925\u093F\u0930 \u092B\u0949\u0938\u094D\u092B\u0930\u0938 \u0935 \u0938\u0942\u0915\u094D\u0937\u094D\u092E\u0926\u094D\u0930\u0935\u094D\u092F\u0947 \u092A\u093F\u0915\u093E\u0932\u093E \u092E\u093F\u0933\u0935\u0942\u0928 \u0926\u0947\u0924\u0947"
    ],
    suitableCropsEnglish: ["Sugarcane", "Ginger", "Cotton", "Soybean", "Vegetables"],
    suitableCropsMarathi: ["\u090A\u0938", "\u0906\u0932\u0947", "\u0915\u093E\u092A\u0942\u0938", "\u0938\u094B\u092F\u093E\u092C\u0940\u0928", "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E"]
  },
  {
    id: "prod-best-08",
    slug: "katyayani-imd-super",
    nameEnglish: "Katyayani IMD Super (Imidacloprid 17.8% SL)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0906\u092F\u090F\u092E\u0921\u0940 \u0938\u0941\u092A\u0930 (\u0907\u092E\u093F\u0921\u093E\u0915\u094D\u0932\u094B\u092A\u094D\u0930\u093F\u0921 \u0967\u096D.\u096E% \u090F\u0938\u090F\u0932)",
    categoryId: "crop-protection",
    subcategoryId: "insecticides",
    descriptionEnglish: "Trusted systemic insecticide for comprehensive protection against aphids, jassids, and sucking insects.",
    descriptionMarathi: "\u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u0935\u0930 \u0926\u0940\u0930\u094D\u0918\u0915\u093E\u0932\u0940\u0928 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0926\u0947\u0923\u093E\u0930\u0947 \u0936\u0947\u0924\u0915\u0931\u094D\u092F\u093E\u0902\u091A\u0947 \u0935\u093F\u0936\u094D\u0935\u093E\u0938\u0942 \u0906\u0902\u0924\u0930\u092A\u094D\u0930\u0935\u093E\u0939\u0940 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915.",
    image: "/assets/products/best_seller/IMD_3__11zon.webp",
    price: 390,
    availability: "available",
    featured: false,
    isBestseller: true,
    popularity: 85,
    displayOrder: 108,
    isSample: false,
    keyPointsEnglish: [
      "Fast systemic uptake through foliar spray",
      "Reliable defense against sucking pest complexes",
      "Economical per-acre treatment cost"
    ],
    keyPointsMarathi: [
      "\u092A\u093E\u0928\u093E\u0902\u0935\u093E\u091F\u0947 \u091C\u0932\u0926 \u0936\u094B\u0937\u0923 \u0935 \u0915\u0940\u0921 \u0928\u093F\u0930\u094D\u092E\u0942\u0932\u0928",
      "\u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u0935\u0930 \u0926\u0940\u0930\u094D\u0918\u0915\u093E\u0932\u0940\u0928 \u0938\u0902\u0930\u0915\u094D\u0937\u0923",
      "\u0915\u093F\u092B\u093E\u092F\u0924\u0936\u0940\u0930 \u0935 \u0936\u0947\u0924\u0915\u0931\u094D\u092F\u093E\u0902\u091A\u094D\u092F\u093E \u092A\u0938\u0902\u0924\u0940\u0938 \u0909\u0924\u0930\u0932\u0947\u0932\u0947"
    ],
    suitableCropsEnglish: ["Cotton", "Paddy", "Chilli", "Okra"],
    suitableCropsMarathi: ["\u0915\u093E\u092A\u0942\u0938", "\u092D\u093E\u0924", "\u092E\u093F\u0930\u091A\u0940", "\u092D\u0947\u0902\u0921\u0940"]
  },
  {
    id: "prod-best-09",
    slug: "katyayani-imida-protect",
    nameEnglish: "Katyayani Imida Protect (Imidacloprid 30.5% SC)",
    nameMarathi: "\u0915\u093E\u0924\u094D\u092F\u093E\u092F\u0928\u0940 \u0907\u092E\u093F\u0921\u093E \u092A\u094D\u0930\u094B\u091F\u0947\u0915\u094D\u091F (\u0907\u092E\u093F\u0921\u093E\u0915\u094D\u0932\u094B\u092A\u094D\u0930\u093F\u0921 \u0969\u0966.\u096B% \u090F\u0938\u0938\u0940)",
    categoryId: "seeds",
    subcategoryId: "field-crops",
    descriptionEnglish: "Suspension concentrate formulation ideal for seed dressing and termite protection.",
    descriptionMarathi: "\u0935\u093E\u0933\u0935\u0940 \u0935 \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u091A\u094D\u092F\u093E \u0915\u093F\u0921\u0940\u0902\u092A\u093E\u0938\u0942\u0928 \u0938\u0902\u0930\u0915\u094D\u0937\u0923\u093E\u0938\u093E\u0920\u0940 \u092A\u094D\u0930\u092E\u093E\u0923\u093F\u0924 \u092C\u093F\u092F\u093E\u0923\u0947 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0935 \u092B\u0935\u093E\u0930\u0923\u0940 \u0914\u0937\u0927.",
    image: "/assets/products/best_seller/IMIDA_4.webp",
    price: 510,
    availability: "available",
    featured: false,
    isBestseller: true,
    popularity: 89,
    displayOrder: 109,
    isSample: false,
    keyPointsEnglish: [
      "Concentrated SC formulation for seed treatment",
      "Shields seedlings against subterranean termites",
      "Ensures uniform and healthy seed emergence"
    ],
    keyPointsMarathi: [
      "\u092C\u0940\u091C\u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u0947\u0938\u093E\u0920\u0940 \u0916\u093E\u0938 \u090F\u0938\u0938\u0940 \u0938\u094D\u0935\u0930\u0942\u092A",
      "\u091C\u092E\u093F\u0928\u0940\u0924\u0940\u0932 \u0935\u093E\u0933\u0935\u0940 \u0935 \u0915\u093F\u0921\u0940\u0902\u092A\u093E\u0938\u0942\u0928 \u0915\u094B\u0935\u0933\u094D\u092F\u093E \u0930\u094B\u092A\u093E\u0902\u091A\u0947 \u0930\u0915\u094D\u0937\u0923",
      "\u0909\u0917\u0935\u0923 \u0915\u094D\u0937\u092E\u0924\u093E \u0935 \u0930\u094B\u092A\u093E\u0902\u091A\u0940 \u0924\u093E\u0915\u0926 \u0935\u093E\u0922\u0935\u0924\u0947"
    ],
    suitableCropsEnglish: ["Sugarcane", "Cotton", "Wheat", "Soybean"],
    suitableCropsMarathi: ["\u090A\u0938", "\u0915\u093E\u092A\u0942\u0938", "\u0917\u0939\u0942", "\u0938\u094B\u092F\u093E\u092C\u0940\u0928"]
  }
];

// src/data/navigationData.ts
var defaultCategories = [
  {
    id: "seeds",
    slug: "seeds",
    name: "Seeds",
    nameMr: "\u092C\u093F\u092F\u093E\u0923\u0947",
    image: "/assets/categories/seeds.png",
    icon: "Sprout",
    shortDesc: "Certified high-germination seed varieties",
    shortDescMr: "\u092A\u094D\u0930\u092E\u093E\u0923\u093F\u0924 \u0935 \u0909\u091A\u094D\u091A \u0909\u0917\u0935\u0923\u0915\u094D\u0937\u092E\u0924\u093E \u0905\u0938\u0932\u0947\u0932\u0940 \u0926\u0930\u094D\u091C\u0947\u0926\u093E\u0930 \u092C\u093F\u092F\u093E\u0923\u0947",
    highlight: false,
    featured: false,
    order: 1,
    active: true,
    subcategories: [
      {
        id: "field-crops",
        name: "Field Crop Seeds",
        nameMr: "\u0936\u0947\u0924\u0940 \u092A\u093F\u0915\u0947 \u092C\u093F\u092F\u093E\u0923\u0947 (\u0938\u094B\u092F\u093E\u092C\u0940\u0928, \u0915\u093E\u092A\u0942\u0938, \u0917\u0939\u0942)",
        description: "Certified seeds for major seasonal crops",
        descriptionMr: "\u0939\u0902\u0917\u093E\u092E\u0940 \u092E\u0941\u0916\u094D\u092F \u092A\u093F\u0915\u093E\u0902\u0938\u093E\u0920\u0940 \u0905\u0927\u093F\u0915\u0943\u0924 \u092C\u093F\u092F\u093E\u0923\u0947"
      },
      {
        id: "vegetable-seeds",
        name: "Vegetable & Hybrid Seeds",
        nameMr: "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E \u0935 \u0939\u093E\u092F\u092C\u094D\u0930\u093F\u0921 \u092C\u093F\u092F\u093E\u0923\u0947 (\u0915\u093E\u0902\u0926\u093E, \u091F\u094B\u092E\u0945\u091F\u094B)",
        description: "High-yield commercial vegetable cultivars",
        descriptionMr: "\u0909\u0924\u094D\u0915\u0943\u0937\u094D\u091F \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u093E\u0938\u093E\u0920\u0940 \u092A\u094D\u0930\u092E\u093E\u0923\u093F\u0924 \u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E \u092C\u093F\u092F\u093E\u0923\u0947"
      },
      {
        id: "forage-green-manure",
        name: "Forage & Green Manure",
        nameMr: "\u091A\u093E\u0930\u093E \u0935 \u0939\u093F\u0930\u0935\u0933\u0940\u091A\u0947 \u0916\u0924 \u092C\u093F\u092F\u093E\u0923\u0947 (\u0924\u093E\u0917, \u0927\u0948\u0902\u091A\u093E)",
        description: "Nutritious fodder and soil reviving green crops",
        descriptionMr: "\u092A\u0936\u0941\u0927\u0928\u093E\u0938\u093E\u0920\u0940 \u092A\u094C\u0937\u094D\u091F\u093F\u0915 \u091A\u093E\u0930\u093E \u0935 \u0939\u093F\u0930\u0935\u0933\u0940\u091A\u094D\u092F\u093E \u0916\u0924\u093E\u091A\u0947 \u092C\u093F\u092F\u093E\u0923\u0947"
      }
    ]
  },
  {
    id: "fertilizers",
    slug: "fertilizers",
    name: "Fertilizers",
    nameMr: "\u0930\u093E\u0938\u093E\u092F\u0928\u093F\u0915 \u0916\u0924\u0947 \u0935 \u092A\u094B\u0937\u0923",
    image: "/assets/categories/fertilizers.png",
    icon: "Wheat",
    shortDesc: "Complete crop nutrition & water-soluble nutrients",
    shortDescMr: "\u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u092A\u0940\u0915 \u092A\u094B\u0937\u0923, \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0916\u0924\u0947 \u0935 \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u0947",
    highlight: false,
    featured: false,
    order: 2,
    active: true,
    subcategories: [
      {
        id: "water-soluble",
        name: "Water Soluble Fertilizers",
        nameMr: "\u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0916\u0924\u0947 (19:19:19, 0:52:34)",
        description: "Drip grade NPK fertilizers for fast uptake",
        descriptionMr: "\u0920\u093F\u092C\u0915\u0926\u094D\u0935\u093E\u0930\u0947 \u0926\u094D\u092F\u093E\u0935\u092F\u093E\u091A\u0940 \u0967\u0966\u0966% \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0916\u0924\u0947"
      },
      {
        id: "micronutrients",
        name: "Micronutrients & Chelated Minerals",
        nameMr: "\u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u0947 (\u091D\u093F\u0902\u0915, \u092C\u094B\u0930\u0949\u0928, \u092B\u0947\u0930\u0938)",
        description: "Essential trace minerals for deficiency correction",
        descriptionMr: "\u092A\u093F\u0915\u093E\u0902\u092E\u0927\u0940\u0932 \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u0940 \u0915\u092E\u0924\u0930\u0924\u093E \u092D\u0930\u0942\u0928 \u0915\u093E\u0922\u0923\u093E\u0930\u0940 \u0916\u0924\u0947"
      },
      {
        id: "organic-bio",
        name: "Organic & Bio-Fertilizers",
        nameMr: "\u0938\u0947\u0902\u0926\u094D\u0930\u093F\u092F \u0935 \u091C\u0948\u0935\u093F\u0915 \u0916\u0924\u0947",
        description: "Eco-friendly soil enrichment inputs",
        descriptionMr: "\u091C\u092E\u093F\u0928\u0940\u091A\u0940 \u0938\u0941\u092A\u0940\u0915\u0924\u093E \u0935\u093E\u0922\u0935\u0923\u093E\u0930\u0940 \u091C\u0948\u0935\u093F\u0915 \u0916\u0924\u0947"
      },
      {
        id: "soil-conditioners",
        name: "Soil Conditioners & Humic Extracts",
        nameMr: "\u091C\u092E\u0940\u0928 \u0938\u0941\u0927\u093E\u0930\u0915 \u0935 \u0939\u094D\u092F\u0941\u092E\u093F\u0915 \u0972\u0938\u093F\u0921",
        description: "Root stimulants and soil structure improvers",
        descriptionMr: "\u092E\u0941\u0933\u093E\u0902\u091A\u094D\u092F\u093E \u091C\u094B\u092E\u0926\u093E\u0930 \u0935\u093E\u0922\u0940\u0938\u093E\u0920\u0940 \u0935 \u091C\u092E\u093F\u0928\u0940\u091A\u094D\u092F\u093E \u0938\u0941\u0927\u093E\u0930\u0923\u0947\u0938\u093E\u0920\u0940"
      }
    ]
  },
  {
    id: "crop-protection",
    slug: "crop-protection",
    name: "Crop Protection",
    nameMr: "\u092A\u0940\u0915 \u0938\u0902\u0930\u0915\u094D\u0937\u0923 (\u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915\u0947)",
    image: "/assets/categories/crop-protection.png",
    icon: "ShieldCheck",
    shortDesc: "Targeted pest, disease and weed control",
    shortDescMr: "\u0915\u0940\u0921, \u092C\u0941\u0930\u0936\u0940 \u0935 \u0924\u0923\u093E\u0902\u091A\u0947 \u0916\u093E\u0924\u094D\u0930\u0940\u0936\u0940\u0930 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923",
    highlight: false,
    featured: false,
    order: 3,
    active: true,
    subcategories: [
      {
        id: "insecticides",
        name: "Insecticides",
        nameMr: "\u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915\u0947",
        description: "Sucking pest and caterpillar management",
        descriptionMr: "\u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u0940\u0921 \u0935 \u0905\u0933\u0940 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923\u093E\u0938\u093E\u0920\u0940"
      },
      {
        id: "fungicides",
        name: "Fungicides & Bactericides",
        nameMr: "\u092C\u0941\u0930\u0936\u0940\u0928\u093E\u0936\u0915\u0947 \u0935 \u091C\u093F\u0935\u093E\u0923\u0942\u0928\u093E\u0936\u0915\u0947",
        description: "Preventive and curative disease remedies",
        descriptionMr: "\u0915\u0930\u092A\u093E, \u092D\u0941\u0930\u0940 \u0935 \u092C\u0941\u0930\u0936\u0940\u091C\u0928\u094D\u092F \u0930\u094B\u0917\u093E\u0902\u091A\u0947 \u0928\u093F\u0935\u093E\u0930\u0923"
      },
      {
        id: "herbicides",
        name: "Herbicides & Weedicides",
        nameMr: "\u0924\u0923\u0928\u093E\u0936\u0915\u0947",
        description: "Pre and post-emergence weed solutions",
        descriptionMr: "\u0909\u0917\u0935\u0923\u0940\u092A\u0942\u0930\u094D\u0935\u0940 \u0935 \u0909\u0917\u0935\u0923\u0940\u0928\u0902\u0924\u0930 \u0924\u0923 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923\u093E\u0938\u093E\u0920\u0940"
      },
      {
        id: "bio-pesticides",
        name: "Bio-Pesticides & Traps",
        nameMr: "\u091C\u0948\u0935\u093F\u0915 \u0915\u0940\u0921 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0915 \u0935 \u0938\u093E\u092A\u0933\u0947",
        description: "Eco-friendly integrated pest management",
        descriptionMr: "\u0915\u093E\u092E\u0917\u0902\u0927 \u0938\u093E\u092A\u0933\u0947, \u091A\u093F\u0915\u091F \u0938\u093E\u092A\u0933\u0947 \u0935 \u092E\u093F\u0924\u094D\u0930\u092C\u0941\u0930\u0936\u0940"
      }
    ]
  },
  {
    id: "combos",
    slug: "combos",
    name: "Special Combos & Ginger Care",
    nameMr: "\u0935\u093F\u0936\u0947\u0937 \u0915\u093F\u091F\u094D\u0938 \u0935 \u0906\u0932\u0947 \u092A\u0940\u0915",
    image: "/assets/categories/combos.png",
    icon: "Sparkles",
    shortDesc: "Field-tested kits & ginger cultivation packages",
    shortDescMr: "\u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0936\u0947\u0924\u0940 \u0905\u0928\u0941\u092D\u0935\u093E\u0935\u0930 \u0906\u0927\u093E\u0930\u093F\u0924 \u0935\u093F\u0936\u0947\u0937 \u0906\u0932\u0947 \u092A\u0940\u0915 \u092A\u0945\u0915\u0947\u091C\u0947\u0938",
    highlight: true,
    featured: true,
    order: 4,
    active: true,
    subcategories: [
      {
        id: "ginger-rhizome-treatment",
        name: "Ginger Sowing & Rhizome Kit",
        nameMr: "\u0906\u0932\u0947 \u092C\u0947\u0923\u0947\u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0935 \u0932\u093E\u0917\u0935\u0921 \u0915\u093F\u091F",
        description: "Initial fungal and pest treatment for seed rhizomes",
        descriptionMr: "\u0932\u093E\u0917\u0935\u0921\u0940\u0935\u0947\u0933\u0940 \u0915\u0902\u0926 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0935 \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u091A\u094D\u092F\u093E \u0938\u0902\u0930\u0915\u094D\u0937\u0923\u093E\u0938\u093E\u0920\u0940"
      },
      {
        id: "ginger-rot-management",
        name: "Rhizome Rot & Wilt Solutions",
        nameMr: "\u0906\u0932\u0947 \u0915\u0902\u0926\u0915\u0941\u091C \u0935 \u092E\u0930 \u0930\u094B\u0917 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928",
        description: "Specialized curative packages for ginger root rot",
        descriptionMr: "\u092A\u093E\u0935\u0938\u093E\u0933\u094D\u092F\u093E\u0924\u0940\u0932 \u0915\u0902\u0926\u0915\u0941\u091C \u0935 \u0916\u094B\u0921\u0915\u093F\u0921\u093E \u092A\u094D\u0930\u0924\u093F\u092C\u0902\u0927\u0915 \u0935\u093F\u0936\u0947\u0937 \u0915\u093F\u091F"
      },
      {
        id: "tillering-yield-booster",
        name: "Tillering & Tuber Bulk Boosters",
        nameMr: "\u092B\u0941\u091F\u0935\u0947 \u0938\u0902\u0916\u094D\u092F\u093E \u0935 \u0915\u0902\u0926 \u092B\u0941\u0917\u0935\u0923 \u0915\u093F\u091F",
        description: "Micronutrient and biological growth promoters",
        descriptionMr: "\u0906\u0932\u0947 \u092B\u0941\u091F\u0935\u094D\u092F\u093E\u0902\u091A\u0940 \u0938\u0902\u0916\u094D\u092F\u093E \u0935\u093E\u0922\u0935\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0935 \u0915\u0902\u0926\u093E\u091A\u094D\u092F\u093E \u092B\u0941\u0917\u0935\u0923\u0940\u0938\u093E\u0920\u0940"
      }
    ]
  }
];

// src/data/fieldVisitsData.ts
var fieldVisitItems = [
  {
    id: "visit-1",
    titleEn: "Field Guidance",
    titleMr: "\u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928",
    imageSrc: "/assets/visit/visit1.png",
    altEn: "Founder of Baliraja providing on-field guidance to farmers",
    altMr: "\u092C\u0933\u0940\u0930\u093E\u091C\u093E\u091A\u0947 \u0938\u0902\u0938\u094D\u0925\u093E\u092A\u0915 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0936\u0947\u0924\u093E\u0924 \u0936\u0947\u0924\u0915\u0930\u094D\u200D\u092F\u093E\u0902\u0928\u093E \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928 \u0915\u0930\u0924\u093E\u0928\u093E",
    tagEn: "Field Guidance",
    tagMr: "\u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928"
  },
  {
    id: "visit-2",
    titleEn: "Farmer Interaction",
    titleMr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u0938\u0902\u0935\u093E\u0926 \u0935 \u091A\u0930\u094D\u091A\u093E",
    imageSrc: "/assets/visit/visit2.png",
    altEn: "Interactive discussion with local farmers in crop field",
    altMr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935\u093E\u0902\u0936\u0940 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0936\u0947\u0924\u093E\u0924 \u0938\u0902\u0935\u093E\u0926 \u0935 \u0938\u0932\u094D\u0932\u093E",
    tagEn: "Farmer Interaction",
    tagMr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u0938\u0902\u0935\u093E\u0926"
  },
  {
    id: "visit-3",
    titleEn: "Crop Inspection",
    titleMr: "\u092A\u0940\u0915 \u092A\u093E\u0939\u0923\u0940 \u0935 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0923",
    imageSrc: "/assets/visit/visit3.png",
    altEn: "On-site crop inspection and growth assessment",
    altMr: "\u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u092A\u093F\u0915\u093E\u0902\u091A\u0940 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u092A\u093E\u0939\u0923\u0940 \u0935 \u0935\u093E\u0922\u0940\u091A\u0947 \u0938\u0916\u094B\u0932 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0923",
    tagEn: "Crop Visit",
    tagMr: "\u092A\u0940\u0915 \u092A\u093E\u0939\u0923\u0940"
  },
  {
    id: "visit-4",
    titleEn: "Field Visit",
    titleMr: "\u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0936\u0947\u0924 \u092D\u0947\u091F",
    imageSrc: "/assets/visit/visit4.png",
    altEn: "Routine field visit evaluating crop condition",
    altMr: "\u092A\u093F\u0915\u093E\u0902\u091A\u094D\u092F\u093E \u0938\u0941\u0926\u0943\u0922\u0924\u0947\u0938\u093E\u0920\u0940 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0936\u0947\u0924 \u092D\u0947\u091F",
    tagEn: "Field Visit",
    tagMr: "\u0936\u0947\u0924 \u092D\u0947\u091F"
  },
  {
    id: "visit-5",
    titleEn: "Agronomic Advisory",
    titleMr: "\u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u0924\u0902\u0924\u094D\u0930\u091C\u094D\u091E\u093E\u0928 \u0938\u0932\u094D\u0932\u093E",
    imageSrc: "/assets/visit/visit5.png",
    altEn: "Direct agronomic consultation and field-tested advice",
    altMr: "\u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0915\u0943\u0937\u0940 \u0938\u0932\u094D\u0932\u093E \u0935 \u0936\u093E\u0938\u094D\u0924\u094D\u0930\u0936\u0941\u0926\u094D\u0927 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928",
    tagEn: "Field Advisory",
    tagMr: "\u0924\u0902\u0924\u094D\u0930\u091C\u094D\u091E\u093E\u0928 \u0938\u0932\u094D\u0932\u093E"
  }
];

// src/data/fieldExperienceData.ts
var fieldExperiences = [
  {
    id: "fe-ginger-rhizome-drainage",
    cropKey: "ginger",
    cropNameEnglish: "Ginger",
    cropNameMarathi: "\u0906\u0932\u0947 (\u0905\u0926\u094D\u0930\u0915)",
    titleEnglish: "Ginger Rhizome Rot Prevention & Raised-Bed Drainage Practice",
    titleMarathi: "\u0906\u0932\u0947 \u092A\u093F\u0915\u093E\u0924\u0940\u0932 \u0915\u0902\u0926 \u0915\u0941\u091C \u092A\u094D\u0930\u0924\u093F\u092C\u0902\u0927 \u0906\u0923\u093F \u0917\u093E\u0926\u0940\u0935\u093E\u092B\u093E \u0928\u093F\u091A\u0930\u093E \u092A\u0926\u094D\u0927\u0924",
    summaryEnglish: "Field observations on maintaining 12-15 inch raised beds and timely root-zone bio-treatments during heavy monsoon spells to protect active rhizomes.",
    summaryMarathi: "\u0905\u0924\u093F \u092A\u093E\u0935\u0938\u093E\u091A\u094D\u092F\u093E \u0915\u093E\u0933\u093E\u0924 \u092A\u093E\u0923\u094D\u092F\u093E\u091A\u093E \u0928\u093F\u091A\u0930\u093E \u0928 \u0939\u094B\u0923\u093E\u0931\u094D\u092F\u093E \u091C\u092E\u093F\u0928\u0940\u0924 \u0915\u093F\u092E\u093E\u0928 \u0967\u0968-\u0967\u096B \u0907\u0902\u091A \u0917\u093E\u0926\u0940\u0935\u093E\u092B\u093E \u0935 \u091C\u0948\u0935\u093F\u0915 \u0918\u091F\u0915\u093E\u0902\u091A\u0940 \u0935\u0947\u0933\u0947\u0935\u0930 \u0906\u0933\u0935\u0923\u0940 \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u0920\u0930\u0932\u094D\u092F\u093E\u091A\u0947 \u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0923.",
    observationEnglish: "In continuous monsoon showers, stagnant moisture around root-zones creates anaerobic conditions that rapidly accelerate fungal Pythium/Fusarium rhizome rot. Maintaining elevated beds with free-flowing cross trenches dramatically reduces rhizome water-logging.",
    observationMarathi: "\u0938\u0924\u0924\u091A\u094D\u092F\u093E \u092A\u093E\u0935\u0938\u093E\u0924 \u092E\u0941\u0933\u093E\u0902\u092D\u094B\u0935\u0924\u0940 \u092A\u093E\u0923\u0940 \u0938\u093E\u091A\u0942\u0928 \u0930\u093E\u0939\u093F\u0932\u094D\u092F\u093E\u0938 \u0939\u0935\u093E \u0916\u0947\u0933\u0924\u0940 \u0930\u093E\u0939\u0924 \u0928\u093E\u0939\u0940 \u0906\u0923\u093F \u0915\u0902\u0926\u0915\u0941\u091C (Rhizome Rot) \u0935 \u092E\u0930 \u0930\u094B\u0917\u093E\u091A\u094D\u092F\u093E \u092C\u0941\u0930\u0936\u0940\u091A\u093E \u092A\u094D\u0930\u093E\u0926\u0941\u0930\u094D\u092D\u093E\u0935 \u0935\u0947\u0917\u093E\u0928\u0947 \u0935\u093E\u0922\u0924\u094B. \u0967\u0968-\u0967\u096B \u0907\u0902\u091A \u0909\u0902\u091A \u0917\u093E\u0926\u0940\u0935\u093E\u092B\u093E \u0905\u0938\u0932\u094D\u092F\u093E\u0938 \u0905\u0924\u093F\u0930\u093F\u0915\u094D\u0924 \u092A\u093E\u0923\u094D\u092F\u093E\u091A\u093E \u0928\u093F\u091A\u0930\u093E \u0924\u093E\u0924\u0921\u0940\u0928\u0947 \u0939\u094B\u0924\u094B.",
    practiceEnglish: "1. Ensure pre-planting seed rhizome treatment with certified fungicide/bio-agent.\n2. Create drainage channels across slopes before the onset of monsoon.\n3. At the first sign of yellowing or collar softening, drench the root zone with recommended systemic fungicide and bio-fungicides.",
    practiceMarathi: "\u0967. \u0932\u093E\u0917\u0935\u0921\u0940\u092A\u0942\u0930\u094D\u0935\u0940 \u0936\u093F\u092B\u093E\u0930\u0936\u0940\u0924 \u092C\u0941\u0930\u0936\u0940\u0928\u093E\u0936\u0915 \u0935 \u091C\u0948\u0935\u093F\u0915 \u0918\u091F\u0915\u093E\u0902\u0926\u094D\u0935\u093E\u0930\u0947 \u092C\u0947\u0923\u0947\u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E \u0915\u0930\u0923\u0947.\n\u0968. \u092A\u093E\u0935\u0938\u093E\u0933\u093E \u0938\u0941\u0930\u0942 \u0939\u094B\u0923\u094D\u092F\u093E\u092A\u0942\u0930\u094D\u0935\u0940 \u0936\u0947\u0924\u093E\u0924\u0942\u0928 \u092A\u093E\u0923\u0940 \u0935\u093E\u0939\u0942\u0928 \u091C\u093E\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0909\u0924\u093E\u0930\u093E\u0932\u093E \u0938\u092E\u093E\u0902\u0924\u0930 \u0928\u093F\u091A\u0930\u093E \u091A\u0930 \u0915\u093E\u0922\u0923\u0947.\n\u0969. \u092A\u093E\u0928\u093E\u0902\u0935\u0930 \u092A\u093F\u0935\u0933\u0947\u092A\u0923\u093E \u0915\u093F\u0902\u0935\u093E \u0916\u094B\u0921\u093E\u091C\u0935\u0933 \u092E\u090A\u092A\u0923\u093E \u0926\u093F\u0938\u0924\u093E\u091A \u0924\u094D\u0935\u0930\u093F\u0924 \u0915\u0943\u0937\u0940 \u0924\u091C\u094D\u091C\u094D\u091E\u093E\u0902\u091A\u094D\u092F\u093E \u0938\u0932\u094D\u0932\u094D\u092F\u093E\u0928\u0947 \u092E\u0941\u0933\u093E\u0902\u092D\u094B\u0935\u0924\u0940 \u0936\u093F\u092B\u093E\u0930\u0936\u0940\u0924 \u0906\u0933\u0935\u0923\u0940 (Drenching) \u0915\u0930\u0923\u0947.",
    seasonEnglish: "Kharif Season",
    seasonMarathi: "\u0916\u0930\u0940\u092A \u0939\u0902\u0917\u093E\u092E",
    stageEnglish: "Vegetative & Rhizome Formation (60\u2013120 Days)",
    stageMarathi: "\u0936\u093E\u0915\u0940\u092F \u0935\u093E\u0922 \u0935 \u0915\u0902\u0926 \u092B\u0941\u091F\u0935\u0947 \u0905\u0935\u0938\u094D\u0925\u093E (\u096C\u0966 \u0924\u0947 \u0967\u0968\u0966 \u0926\u093F\u0935\u0938)",
    categoryKey: "nutrition-protection",
    isSample: true,
    image: "/assets/videos/hero_poster.jpg",
    relatedProductIds: ["prod-sample-02", "prod-sample-03"],
    keyInsightsEnglish: [
      "Elevated raised beds (12\u201315 inches) ensure healthy aeration",
      "Timely drenching at early symptoms is significantly more effective than late sprays",
      "Balanced potassium and organic matter support rhizome firmness"
    ],
    keyInsightsMarathi: [
      "\u0967\u0968 \u0924\u0947 \u0967\u096B \u0907\u0902\u091A \u0909\u0902\u091A\u0940\u091A\u093E \u0917\u093E\u0926\u0940\u0935\u093E\u092B\u093E \u092E\u0941\u0933\u093E\u0902\u0928\u093E \u0911\u0915\u094D\u0938\u093F\u091C\u0928 \u092E\u093F\u0933\u0935\u0942\u0928 \u0926\u0947\u0923\u094D\u092F\u093E\u0938 \u092E\u0926\u0924 \u0915\u0930\u0924\u094B",
      "\u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915 \u0932\u0915\u094D\u0937\u0923\u0947 \u0926\u093F\u0938\u0924\u093E\u091A \u0915\u0947\u0932\u0947\u0932\u0940 \u0906\u0933\u0935\u0923\u0940 \u0939\u0940 \u0928\u0902\u0924\u0930\u091A\u094D\u092F\u093E \u092B\u0935\u093E\u0930\u0923\u0940\u092A\u0947\u0915\u094D\u0937\u093E \u0905\u0927\u093F\u0915 \u092B\u093E\u092F\u0926\u0947\u0936\u0940\u0930 \u0920\u0930\u0924\u0947",
      "\u0938\u092E\u0924\u094B\u0932 \u092A\u094B\u091F\u0945\u0936 \u0935 \u0938\u0947\u0902\u0926\u094D\u0930\u093F\u092F \u0916\u0924\u093E\u0902\u091A\u093E \u0935\u093E\u092A\u0930 \u0915\u0902\u0926\u093E\u091A\u0940 \u0924\u093E\u0915\u0926 \u0935\u093E\u0922\u0935\u0924\u094B"
    ]
  },
  {
    id: "fe-soybean-pest-scouting",
    cropKey: "soybean",
    cropNameEnglish: "Soybean",
    cropNameMarathi: "\u0938\u094B\u092F\u093E\u092C\u0940\u0928",
    titleEnglish: "Soybean Stem Fly & Girdle Beetle Early Scouting at Flowering",
    titleMarathi: "\u0938\u094B\u092F\u093E\u092C\u0940\u0928\u092E\u0927\u094D\u092F\u0947 \u092B\u0941\u0932\u094B\u0931\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u0905\u0935\u0938\u094D\u0925\u0947\u0924 \u0916\u094B\u0921\u0915\u093F\u0921\u0940 \u0935 \u091A\u0915\u094D\u0930\u0940\u092D\u0941\u0902\u0917\u094D\u092F\u093E\u091A\u0947 \u0935\u0947\u0933\u0947\u0935\u0930 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0923",
    summaryEnglish: "Systematic field scouting during the transition from vegetative to flowering stage to detect girdle beetle girdles and stem fly punctures before economic thresholds are breached.",
    summaryMarathi: "\u092B\u0941\u0932\u094B\u0930\u093E \u0906\u0923\u093F \u0936\u0947\u0902\u0917\u093E \u092D\u0930\u0923\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u091F\u092A\u094D\u092A\u094D\u092F\u093E\u0935\u0930 \u091D\u093E\u0921\u093E\u091A\u094D\u092F\u093E \u092A\u093E\u0928\u093E\u0902\u091A\u0947 \u0935 \u0916\u094B\u0921\u093E\u091A\u0947 \u0928\u093F\u092F\u092E\u093F\u0924 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0923 \u0915\u0930\u0942\u0928 \u091A\u0915\u094D\u0930\u0940\u092D\u0941\u0902\u0917\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u092A\u094D\u0930\u093E\u0926\u0941\u0930\u094D\u092D\u093E\u0935\u093E\u091A\u0947 \u0935\u0947\u0933\u0947\u0935\u0930 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0915\u0930\u0923\u0947.",
    observationEnglish: "Extended rain gaps in July-August create dry spells that favor stem fly and girdle beetle multiplication. In severe cases, girdle beetle ringing prevents sap flow, causing flower drops and stunted pods.",
    observationMarathi: "\u091C\u0941\u0932\u0948-\u0911\u0917\u0938\u094D\u091F \u0926\u0930\u092E\u094D\u092F\u093E\u0928 \u092A\u093E\u0935\u0938\u093E\u091A\u093E \u0916\u0902\u0921 \u092A\u0921\u0932\u094D\u092F\u093E\u0938 \u0915\u094B\u0930\u0921\u094D\u092F\u093E \u0939\u0935\u093E\u092E\u093E\u0928\u093E\u0924 \u0916\u094B\u0921\u0915\u093F\u0921\u0940 \u0935 \u091A\u0915\u094D\u0930\u0940\u092D\u0941\u0902\u0917\u094D\u092F\u093E\u091A\u093E \u092A\u094D\u0930\u093E\u0926\u0941\u0930\u094D\u092D\u093E\u0935 \u0935\u0947\u0917\u093E\u0928\u0947 \u0935\u093E\u0922\u0924\u094B. \u091A\u0915\u094D\u0930\u0940\u092D\u0941\u0902\u0917\u093E \u092A\u093E\u0928\u093E\u0902\u091A\u094D\u092F\u093E \u0926\u0947\u0920\u093E\u0935\u0930 \u0915\u093F\u0902\u0935\u093E \u0916\u094B\u0921\u093E\u0935\u0930 \u092C\u093E\u0902\u0917\u0921\u0940\u0938\u093E\u0930\u0916\u0947 \u0915\u093E\u092A \u0926\u0947\u0924\u094B, \u091C\u094D\u092F\u093E\u092E\u0941\u0933\u0947 \u0905\u0928\u094D\u0928\u0930\u0938 \u0916\u0902\u0921\u093F\u0924 \u0939\u094B\u090A\u0928 \u092B\u0941\u0932\u0947 \u0917\u0933\u0924\u093E\u0924.",
    practiceEnglish: "1. Scout the crop twice a week during early flowering.\n2. Collect and destroy affected wilted twigs showing ring cuts.\n3. Apply authorized selective insecticide only when infestation exceeds the economic threshold level (ETL).",
    practiceMarathi: "\u0967. \u092B\u0941\u0932\u094B\u0931\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u0932\u093E \u0906\u0920\u0935\u0921\u094D\u092F\u093E\u0924\u0942\u0928 \u0915\u093F\u092E\u093E\u0928 \u0926\u094B\u0928 \u0935\u0947\u0933\u093E \u0936\u0947\u0924\u093E\u091A\u0940 \u092A\u093E\u0939\u0923\u0940 \u0915\u0930\u0923\u0947.\n\u0968. \u091A\u0915\u094D\u0930\u0940 \u0915\u093E\u092A\u0932\u0947\u0932\u0940 \u0935 \u0935\u093E\u0933\u0932\u0947\u0932\u0940 \u092A\u093E\u0928\u0947 \u0924\u094B\u0921\u0942\u0928 \u0928\u0937\u094D\u091F \u0915\u0930\u0923\u0947.\n\u0969. \u092A\u094D\u0930\u093E\u0926\u0941\u0930\u094D\u092D\u093E\u0935 \u0906\u0930\u094D\u0925\u093F\u0915 \u0928\u0941\u0915\u0938\u093E\u0928\u0940\u091A\u094D\u092F\u093E \u092A\u093E\u0924\u0933\u0940\u091A\u094D\u092F\u093E (ETL) \u0935\u0930 \u0917\u0947\u0932\u094D\u092F\u093E\u0938\u091A \u0905\u0927\u093F\u0915\u0943\u0924 \u0936\u093F\u092B\u093E\u0930\u0936\u0940\u0924 \u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915\u093E\u091A\u0940 \u0935\u0947\u0933\u0947\u0935\u0930 \u092B\u0935\u093E\u0930\u0923\u0940 \u0915\u0930\u0923\u0947.",
    seasonEnglish: "Kharif Season",
    seasonMarathi: "\u0916\u0930\u0940\u092A \u0939\u0902\u0917\u093E\u092E",
    stageEnglish: "Flowering to Pod Setting (40\u201365 Days)",
    stageMarathi: "\u092B\u0941\u0932\u094B\u0930\u093E \u0935 \u0936\u0947\u0902\u0917\u093E \u0927\u093E\u0930\u0923\u093E \u0905\u0935\u0938\u094D\u0925\u093E (\u096A\u0966 \u0924\u0947 \u096C\u096B \u0926\u093F\u0935\u0938)",
    categoryKey: "crop-protection",
    isSample: true,
    image: "/assets/products/insecticide-sample.png",
    relatedProductIds: ["prod-sample-04"],
    keyInsightsEnglish: [
      "Scout early morning or late afternoon for accurate insect counts",
      "Avoid high-dose nitrogen when pest pressure is active",
      "Follow integrated pest management (IPM) practices"
    ],
    keyInsightsMarathi: [
      "\u0915\u0940\u0921 \u092E\u094B\u091C\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0938\u0915\u093E\u0933\u091A\u094D\u092F\u093E \u0915\u093F\u0902\u0935\u093E \u0938\u0902\u0927\u094D\u092F\u093E\u0915\u093E\u0933\u091A\u094D\u092F\u093E \u0935\u0947\u0933\u0940 \u0936\u0947\u0924\u093E\u091A\u0940 \u092A\u093E\u0939\u0923\u0940 \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u0920\u0930\u0924\u0947",
      "\u0915\u093F\u0921\u0940\u0902\u091A\u093E \u092A\u094D\u0930\u093E\u0926\u0941\u0930\u094D\u092D\u093E\u0935 \u0905\u0938\u0924\u093E\u0928\u093E \u092F\u0941\u0930\u093F\u092F\u093E\u091A\u093E \u092C\u0947\u0938\u0941\u092E\u093E\u0930 \u0935\u093E\u092A\u0930 \u091F\u093E\u0933\u093E\u0935\u093E",
      "\u090F\u0915\u093E\u0924\u094D\u092E\u093F\u0915 \u0915\u0940\u0921 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u092A\u0926\u094D\u0927\u0924\u0940\u091A\u093E \u0905\u0935\u0932\u0902\u092C \u0915\u0930\u093E\u0935\u093E"
    ]
  },
  {
    id: "fe-cotton-square-drop",
    cropKey: "cotton",
    cropNameEnglish: "Cotton",
    cropNameMarathi: "\u0915\u093E\u092A\u0942\u0938",
    titleEnglish: "Cotton Sucking Pest Management & Square Retention Practice",
    titleMarathi: "\u0915\u093E\u092A\u0942\u0938 \u092A\u093F\u0915\u093E\u0924 \u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u091A\u0947 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923 \u0935 \u092A\u093E\u0924\u0947\u0917\u0933 \u092A\u094D\u0930\u0924\u093F\u092C\u0902\u0927\u0915 \u0928\u093F\u092F\u094B\u091C\u0928",
    summaryEnglish: "Field observations on managing jassids and thrips during square initiation, complemented by balanced micronutrient sprays to maximize boll retention.",
    summaryMarathi: "\u092A\u093E\u0924\u0947 \u0932\u093E\u0917\u0935\u0921\u0940\u091A\u094D\u092F\u093E \u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932 \u091F\u092A\u094D\u092A\u094D\u092F\u093E\u0935\u0930 \u092E\u093E\u0935\u093E, \u0924\u0941\u0921\u0924\u0941\u0921\u0947 \u092F\u093E \u0930\u0938\u0936\u094B\u0937\u0915 \u0915\u093F\u0921\u0940\u0902\u091A\u093E \u092C\u0902\u0926\u094B\u092C\u0938\u094D\u0924 \u0906\u0923\u093F \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u093E \u0938\u092E\u0924\u094B\u0932 \u0935\u093E\u092A\u0930 \u0915\u0930\u0942\u0928 \u092A\u093E\u0924\u0947\u0917\u0933 \u0930\u094B\u0916\u0923\u094D\u092F\u093E\u091A\u0947 \u0928\u093F\u092F\u094B\u091C\u0928.",
    observationEnglish: "Heavy cloud cover and high relative humidity trigger spikes in sucking pest populations, which curl leaf margins downwards and starve young squares, leading to substantial square shedding.",
    observationMarathi: "\u0938\u0924\u0924 \u0922\u0917\u093E\u0933 \u0935\u093E\u0924\u093E\u0935\u0930\u0923 \u0906\u0923\u093F \u0926\u092E\u091F \u0939\u0935\u0947\u092E\u0941\u0933\u0947 \u092E\u093E\u0935\u093E \u0935 \u0924\u0941\u0921\u0924\u0941\u0921\u0947 \u092A\u093E\u0928\u093E\u0902\u091A\u094D\u092F\u093E \u0916\u093E\u0932\u0942\u0928 \u0930\u0938 \u0936\u094B\u0937\u0942\u0928 \u0918\u0947\u0924\u093E\u0924. \u092A\u093E\u0928\u0947 \u0935\u093E\u0915\u0921\u0940 \u0939\u094B\u0924\u093E\u0924 \u0906\u0923\u093F \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u093E \u092A\u0941\u0930\u0935\u0920\u093E \u0928 \u091D\u093E\u0932\u094D\u092F\u093E\u092E\u0941\u0933\u0947 \u0915\u094B\u0935\u0933\u0940 \u092A\u093E\u0924\u0947 \u092A\u093F\u0935\u0933\u0940 \u092A\u0921\u0942\u0928 \u0917\u0933\u0924\u093E\u0924.",
    practiceEnglish: "1. Install 8-10 yellow and blue sticky traps per acre.\n2. Ensure balanced basal fertilizer; avoid excess vegetative growth.\n3. Foliar spray of authorized boron and calibrated micronutrients at square formation upon local agronomist advice.",
    practiceMarathi: "\u0967. \u092A\u094D\u0930\u0924\u093F \u090F\u0915\u0930\u0940 \u096E \u0924\u0947 \u0967\u0966 \u092A\u093F\u0935\u0933\u0947 \u0935 \u0928\u093F\u0933\u0947 \u091A\u093F\u0915\u091F \u0938\u093E\u092A\u0933\u0947 \u0936\u0947\u0924\u093E\u0924 \u0932\u093E\u0935\u093E\u0935\u0947\u0924.\n\u0968. \u0930\u093E\u0938\u093E\u092F\u0928\u093F\u0915 \u0916\u0924\u093E\u0902\u091A\u093E \u0938\u092E\u0924\u094B\u0932 \u0930\u093E\u0916\u093E\u0935\u093E; \u091D\u093E\u0921\u093E\u0902\u091A\u0940 \u0905\u0935\u093E\u091C\u0935\u0940 \u0936\u093E\u0915\u0940\u092F \u0935\u093E\u0922 \u0939\u094B\u0923\u093E\u0930 \u0928\u093E\u0939\u0940 \u092F\u093E\u091A\u0940 \u0915\u093E\u0933\u091C\u0940 \u0918\u094D\u092F\u093E\u0935\u0940.\n\u0969. \u092A\u093E\u0924\u0947 \u0932\u093E\u0917\u0924\u093E\u0928\u093E \u092C\u094B\u0930\u0949\u0928 \u0935 \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u0940 \u0936\u093F\u092B\u093E\u0930\u0936\u0940\u0924 \u092E\u093E\u0924\u094D\u0930\u0947\u0924 \u092B\u0935\u093E\u0930\u0923\u0940 \u0915\u0930\u093E\u0935\u0940.",
    seasonEnglish: "Kharif Season",
    seasonMarathi: "\u0916\u0930\u0940\u092A \u0939\u0902\u0917\u093E\u092E",
    stageEnglish: "Square & Early Boll Formation (50\u201390 Days)",
    stageMarathi: "\u092A\u093E\u0924\u0947 \u0935 \u092C\u094B\u0902\u0921 \u0932\u093E\u0917\u0935\u0921 \u0905\u0935\u0938\u094D\u0925\u093E (\u096B\u0966 \u0924\u0947 \u096F\u0966 \u0926\u093F\u0935\u0938)",
    categoryKey: "nutrition-protection",
    isSample: true,
    image: "/assets/products/fertilizers/fertilizer-sample.png",
    relatedProductIds: ["prod-sample-01", "prod-sample-04"],
    keyInsightsEnglish: [
      "Sticky traps provide early warning before visual crop distress occurs",
      "Micronutrients during square formation improve retention",
      "Water management during boll swelling is vital"
    ],
    keyInsightsMarathi: [
      "\u091A\u093F\u0915\u091F \u0938\u093E\u092A\u0933\u094D\u092F\u093E\u0902\u092E\u0941\u0933\u0947 \u0915\u093F\u0921\u0940\u0902\u091A\u094D\u092F\u093E \u0906\u0917\u092E\u0928\u093E\u091A\u0940 \u0906\u0927\u0940\u091A \u092E\u093E\u0939\u093F\u0924\u0940 \u092E\u093F\u0933\u0924\u0947",
      "\u092A\u093E\u0924\u0947 \u0932\u093E\u0917\u0924\u093E\u0928\u093E \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u0940 \u092E\u093E\u0924\u094D\u0930\u093E \u092A\u093E\u0924\u0947 \u0917\u0933 \u0930\u094B\u0916\u0923\u094D\u092F\u093E\u0938 \u092E\u0926\u0924 \u0915\u0930\u0924\u0947",
      "\u092C\u094B\u0902\u0921 \u092D\u0930\u0924\u093E\u0928\u093E \u091C\u092E\u093F\u0928\u0940\u0924 \u092F\u094B\u0917\u094D\u092F \u0913\u0932\u093E\u0935\u093E \u0905\u0938\u0923\u0947 \u0906\u0935\u0936\u094D\u092F\u0915 \u0906\u0939\u0947"
    ]
  },
  {
    id: "fe-vegetables-drip-fertigation",
    cropKey: "vegetables",
    cropNameEnglish: "Vegetables (Tomato / Chilli)",
    cropNameMarathi: "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E (\u091F\u094B\u092E\u0945\u091F\u094B / \u092E\u093F\u0930\u091A\u0940)",
    titleEnglish: "Vegetables Precision Drip Fertigation & Early Blight Vigilance",
    titleMarathi: "\u092D\u093E\u091C\u0940\u092A\u093E\u0932\u093E \u092A\u093F\u0915\u093E\u0924 \u0920\u093F\u092C\u0915\u0926\u094D\u0935\u093E\u0930\u0947 \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0916\u0924\u093E\u0902\u091A\u0947 \u0928\u093F\u092F\u094B\u091C\u0928 \u0935 \u0915\u0930\u092A\u093E \u092A\u094D\u0930\u0924\u093F\u092C\u0902\u0927",
    summaryEnglish: "Splitting water-soluble nutrient doses through weekly drip schedules to maintain steady root development and minimize fungal blight risk.",
    summaryMarathi: "\u091F\u094B\u092E\u0945\u091F\u094B \u0935 \u092E\u093F\u0930\u091A\u0940\u092E\u0927\u094D\u092F\u0947 \u092A\u093F\u0915\u093E\u091A\u094D\u092F\u093E \u0935\u092F\u093E\u0928\u0941\u0938\u093E\u0930 \u0920\u093F\u092C\u0915\u092E\u0927\u0942\u0928 \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0916\u0924\u093E\u0902\u091A\u0947 \u0939\u092A\u094D\u0924\u0947 \u0935\u093F\u092D\u093E\u0917\u0942\u0928 \u0926\u0947\u0923\u0947 \u0906\u0923\u093F \u092A\u093E\u0928\u093E\u0902\u0935\u0930\u0940\u0932 \u0915\u0930\u092A\u094D\u092F\u093E\u091A\u0947 \u0935\u0947\u0933\u0947\u0935\u0930 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923.",
    observationEnglish: "Dumping heavy solid fertilizer near vegetable stem bases often burns feeding roots and creates open wounds for soil pathogens. Drip fertigation in small, regular intervals keeps plant immunity resilient against fungal blight.",
    observationMarathi: "\u0916\u094B\u0921\u093E\u0932\u0917\u0924 \u092E\u094B\u0920\u094D\u092F\u093E \u092A\u094D\u0930\u092E\u093E\u0923\u093E\u0935\u0930 \u0916\u0924\u093E\u0902\u091A\u0947 \u0922\u0940\u0917 \u0926\u093F\u0932\u094D\u092F\u093E\u0938 \u092A\u093E\u0902\u0922\u0930\u0940 \u092E\u0941\u0933\u0947 \u091C\u0933\u0923\u094D\u092F\u093E\u091A\u093E \u0927\u094B\u0915\u093E \u0905\u0938\u0924\u094B \u0906\u0923\u093F \u0930\u094B\u0917\u093E\u0902\u091A\u093E \u0936\u093F\u0930\u0915\u093E\u0935 \u0939\u094B\u0924\u094B. \u0924\u094D\u092F\u093E\u0910\u0935\u091C\u0940 \u0920\u093F\u092C\u0915\u092E\u0927\u0942\u0928 \u0935\u093F\u092D\u093E\u0917\u0942\u0928 \u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F \u0916\u0924\u0947 \u0926\u093F\u0932\u094D\u092F\u093E\u0938 \u091D\u093E\u0921\u093E\u0902\u091A\u0940 \u0924\u093E\u0915\u0926 \u091F\u093F\u0915\u0942\u0928 \u0930\u093E\u0939\u0924\u0947 \u0935 \u0915\u0930\u092A\u093E \u0930\u094B\u0917\u093E\u091A\u093E \u092A\u094D\u0930\u093E\u0926\u0941\u0930\u094D\u092D\u093E\u0935 \u0915\u092E\u0940 \u0939\u094B\u0924\u094B.",
    practiceEnglish: "1. Follow a step-wise NPK fertigation schedule (19:19:19 in early vegetative, 12:61:0 during rooting/flowering, 13:0:45 during fruit maturity).\n2. Maintain consistent soil moisture; avoid drastic wet-dry cycles.\n3. Inspect lower leaves weekly for concentric fungal rings and apply recommended preventive fungicides.",
    practiceMarathi: "\u0967. \u092A\u093F\u0915\u093E\u091A\u094D\u092F\u093E \u0905\u0935\u0938\u094D\u0925\u0947\u0928\u0941\u0938\u093E\u0930 \u0967\u096F:\u0967\u096F:\u0967\u096F, \u0967\u0968:\u096C\u0967:\u0966 \u0906\u0923\u093F \u092B\u0933\u0947 \u092D\u0930\u0924\u093E\u0928\u093E \u0967\u0969:\u0966:\u096A\u096B \u0916\u0924\u093E\u0902\u091A\u0947 \u092A\u094D\u0930\u092E\u093E\u0923 \u0935\u093F\u092D\u093E\u0917\u0942\u0928 \u0926\u094D\u092F\u093E\u0935\u0947.\n\u0968. \u091C\u092E\u093F\u0928\u0940\u0924\u0940\u0932 \u0913\u0932\u093E\u0935\u093E \u090F\u0915\u0938\u093E\u0930\u0916\u093E \u0920\u0947\u0935\u093E\u0935\u093E; \u092E\u0941\u0933\u093E\u0902\u0928\u093E \u092A\u093E\u0923\u094D\u092F\u093E\u091A\u093E \u0924\u093E\u0923 \u0905\u0925\u0935\u093E \u0926\u0932\u0926\u0932 \u0939\u094B\u090A \u0926\u0947\u090A \u0928\u092F\u0947.\n\u0969. \u0916\u093E\u0932\u091A\u094D\u092F\u093E \u092A\u093E\u0928\u093E\u0902\u0935\u0930 \u0915\u093E\u0933\u0947 \u0915\u093F\u0902\u0935\u093E \u0924\u092A\u0915\u093F\u0930\u0940 \u0921\u093E\u0917 \u0926\u093F\u0938\u0924\u093E\u091A \u0936\u093F\u092B\u093E\u0930\u0936\u0940\u0924 \u092C\u0941\u0930\u0936\u0940\u0928\u093E\u0936\u0915\u093E\u091A\u0940 \u0935\u0947\u0933\u0947\u0935\u0930 \u092B\u0935\u093E\u0930\u0923\u0940 \u0915\u0930\u093E\u0935\u0940.",
    seasonEnglish: "Rabi & Summer Seasons",
    seasonMarathi: "\u0930\u092C\u094D\u092C\u0940 \u0935 \u0909\u0928\u094D\u0939\u093E\u0933\u0940 \u0939\u0902\u0917\u093E\u092E",
    stageEnglish: "Vegetative Growth to Fruiting (30\u201390 Days)",
    stageMarathi: "\u0936\u093E\u0915\u0940\u092F \u0935\u093E\u0922 \u0935 \u092B\u0933\u0927\u093E\u0930\u0923\u093E \u0905\u0935\u0938\u094D\u0925\u093E (\u0969\u0966 \u0924\u0947 \u096F\u0966 \u0926\u093F\u0935\u0938)",
    categoryKey: "nutrition-protection",
    isSample: true,
    image: "/assets/products/fungicide-sample.png",
    relatedProductIds: ["prod-sample-01", "prod-sample-03"],
    keyInsightsEnglish: [
      "Split micro-doses through drip outperform single heavy bulk applications",
      "Scouting bottom canopy leaves catches early blight before it spreads upwards",
      "Calcium and boron help prevent fruit-end cracking and blossom drop"
    ],
    keyInsightsMarathi: [
      "\u090F\u0915\u0926\u093E\u091A \u091C\u093E\u0938\u094D\u0924 \u0916\u0924 \u0926\u0947\u0923\u094D\u092F\u093E\u092A\u0947\u0915\u094D\u0937\u093E \u0920\u093F\u092C\u0915\u092E\u0927\u0942\u0928 \u0925\u094B\u0921\u0947-\u0925\u094B\u0921\u0947 \u0926\u0947\u0923\u0947 \u091C\u093E\u0938\u094D\u0924 \u092B\u093E\u092F\u0926\u0947\u0936\u0940\u0930 \u0920\u0930\u0924\u0947",
      "\u091D\u093E\u0921\u093E\u091A\u094D\u092F\u093E \u0916\u093E\u0932\u091A\u094D\u092F\u093E \u092A\u093E\u0928\u093E\u0902\u091A\u0947 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0923 \u0915\u0947\u0932\u094D\u092F\u093E\u0938 \u0915\u0930\u092A\u093E \u0930\u094B\u0917\u093E\u091A\u093E \u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915 \u091F\u092A\u094D\u092A\u094D\u092F\u093E\u0924\u091A \u092C\u0902\u0926\u094B\u092C\u0938\u094D\u0924 \u0939\u094B\u0924\u094B",
      "\u0915\u0945\u0932\u094D\u0936\u093F\u092F\u092E \u0935 \u092C\u094B\u0930\u0949\u0928 \u092B\u0933 \u0924\u0921\u0915\u0923\u0947 \u0906\u0923\u093F \u092B\u0941\u0932\u0917\u0933 \u0930\u094B\u0916\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u0920\u0930\u0924\u093E\u0924"
    ]
  },
  {
    id: "fe-turmeric-nutrition-care",
    cropKey: "turmeric",
    cropNameEnglish: "Turmeric",
    cropNameMarathi: "\u0939\u0933\u0926",
    titleEnglish: "Turmeric Rhizome Development & Micronutrient Balance",
    titleMarathi: "\u0939\u0933\u0926 \u092A\u093F\u0915\u093E\u0924 \u0915\u0902\u0926 \u0935\u093E\u0922\u0940\u091A\u093E \u0915\u093E\u0933 \u0906\u0923\u093F \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E\u092A\u0928",
    summaryEnglish: "Practical observations on potash application, soil earthing-up (\u092E\u093E\u0924\u0940 \u0932\u093E\u0935\u0923\u0947), and foliage health during the 90 to 150-day development window.",
    summaryMarathi: "\u0939\u0933\u0926\u0940\u092E\u0927\u094D\u092F\u0947 \u096F\u0966 \u0924\u0947 \u0967\u096B\u0966 \u0926\u093F\u0935\u0938\u093E\u0902\u091A\u094D\u092F\u093E \u0915\u093E\u0932\u093E\u0935\u0927\u0940\u0924 \u092D\u0930 \u0932\u093E\u0935\u0923\u0947 (\u092E\u093E\u0924\u0940 \u0932\u093E\u0935\u0923\u0947) \u0906\u0923\u093F \u0915\u0902\u0926 \u092A\u094B\u0938\u0923\u094D\u092F\u093E\u0938\u093E\u0920\u0940 \u0906\u0935\u0936\u094D\u092F\u0915 \u0905\u0928\u094D\u0928\u0926\u094D\u0930\u0935\u094D\u092F\u093E\u0902\u091A\u0947 \u0938\u092E\u0924\u094B\u0932 \u0928\u093F\u092F\u094B\u091C\u0928.",
    observationEnglish: "Exposed rhizomes turning green due to sun exposure suffer in quality and weight. Earthing up soil around plants keeps growing fingers protected and cool, enabling maximum nutrient conversion.",
    observationMarathi: "\u092A\u093E\u0923\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u092A\u094D\u0930\u0935\u093E\u0939\u093E\u092E\u0941\u0933\u0947 \u0915\u093F\u0902\u0935\u093E \u0935\u093E\u092B\u094D\u092F\u093E\u0924\u0940\u0932 \u092E\u093E\u0924\u0940 \u0935\u093E\u0939\u0942\u0928 \u0917\u0947\u0932\u094D\u092F\u093E\u092E\u0941\u0933\u0947 \u0939\u0933\u0926\u0940\u091A\u0947 \u0915\u0902\u0926 \u0909\u0918\u0921\u0947 \u092A\u0921\u0932\u094D\u092F\u093E\u0938 \u0924\u0947 \u0939\u093F\u0930\u0935\u0947 \u092A\u0921\u0924\u093E\u0924 \u0935 \u0935\u091C\u0928 \u0918\u091F\u0924\u0947. \u0935\u0947\u0933\u0947\u0935\u0930 \u092D\u0930 \u0932\u093E\u0935\u0942\u0928 \u0915\u0902\u0926 \u092E\u093E\u0924\u0940\u0916\u093E\u0932\u0940 \u091D\u093E\u0915\u0932\u094D\u092F\u093E\u0938 \u0915\u0902\u0926\u093E\u0902\u091A\u0940 \u091C\u093E\u0921\u0940 \u0935 \u0926\u0930\u094D\u091C\u093E \u0938\u0941\u0927\u093E\u0930\u0924\u094B.",
    practiceEnglish: "1. Complete earthing-up operation around 75\u201390 days with well-decomposed organic manure.\n2. Ensure adequate potash and sulfur to improve curcumin development and finger density.\n3. Scout for leaf spot (Colletotrichum) and spray authorized fungicide at first symptoms.",
    practiceMarathi: "\u0967. \u0932\u093E\u0917\u0935\u0921\u0940\u0928\u0902\u0924\u0930 \u096D\u096B \u0924\u0947 \u096F\u0966 \u0926\u093F\u0935\u0938\u093E\u0902\u091A\u094D\u092F\u093E \u0926\u0930\u092E\u094D\u092F\u093E\u0928 \u0936\u0947\u0923\u0916\u0924\u093E\u091A\u093E \u0935\u093E\u092A\u0930 \u0915\u0930\u0942\u0928 \u091D\u093E\u0921\u093E\u0902\u0928\u093E \u092F\u094B\u0917\u094D\u092F \u092D\u0930 \u0932\u093E\u0935\u093E\u0935\u0940.\n\u0968. \u0915\u0902\u0926 \u092D\u0930\u0923\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u0915\u093E\u0933\u093E\u0924 \u092A\u094B\u091F\u0945\u0936 \u0935 \u0917\u0902\u0927\u0915\u093E\u091A\u093E \u0938\u092E\u0924\u094B\u0932 \u0920\u0947\u0935\u093E\u0935\u093E.\n\u0969. \u092A\u093E\u0928\u093E\u0902\u0935\u0930 \u0924\u093E\u0902\u092C\u0921\u0947 \u0915\u093F\u0902\u0935\u093E \u0924\u092A\u0915\u093F\u0930\u0940 \u0920\u093F\u092A\u0915\u0947 \u0926\u093F\u0938\u0932\u094D\u092F\u093E\u0938 \u0935\u0947\u0933\u0947\u0935\u0930 \u092C\u0941\u0930\u0936\u0940\u0928\u093E\u0936\u0915\u093E\u091A\u0940 \u092B\u0935\u093E\u0930\u0923\u0940 \u0915\u0930\u093E\u0935\u0940.",
    seasonEnglish: "Kharif to Rabi Season",
    seasonMarathi: "\u0916\u0930\u0940\u092A \u0924\u0947 \u0930\u092C\u094D\u092C\u0940 \u0939\u0902\u0917\u093E\u092E",
    stageEnglish: "Rhizome Development & Maturation (90\u2013180 Days)",
    stageMarathi: "\u0915\u0902\u0926 \u0935\u093E\u0922 \u0935 \u092D\u0930\u0923\u0940 \u0905\u0935\u0938\u094D\u0925\u093E (\u096F\u0966 \u0924\u0947 \u0967\u096E\u0966 \u0926\u093F\u0935\u0938)",
    categoryKey: "nutrition-protection",
    isSample: true,
    image: "/assets/products/combos/combo-sample.png",
    relatedProductIds: ["prod-sample-02"],
    keyInsightsEnglish: [
      "Earthing up protects growing rhizome fingers from sunlight and heat stress",
      "Sulfur aids quality, color, and curcumin content",
      "Keep field free of water stagnation during late monsoon"
    ],
    keyInsightsMarathi: [
      "\u0935\u0947\u0933\u0947\u0935\u0930 \u092D\u0930 \u0932\u093E\u0935\u0932\u094D\u092F\u093E\u0928\u0947 \u0939\u0933\u0926\u0940\u091A\u0947 \u0915\u0902\u0926 \u0909\u0928\u094D\u0939\u093E\u092A\u093E\u0938\u0942\u0928 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0930\u093E\u0939\u0942\u0928 \u0935\u0947\u0917\u093E\u0928\u0947 \u092A\u094B\u0938\u0924\u093E\u0924",
      "\u0917\u0902\u0927\u0915 (Sulfur) \u0915\u0902\u0926\u093E\u091A\u093E \u0930\u0902\u0917 \u0935 \u0926\u0930\u094D\u091C\u093E \u0938\u0941\u0927\u093E\u0930\u0923\u094D\u092F\u093E\u0938 \u092E\u0926\u0924 \u0915\u0930\u0924\u094B",
      "\u092A\u093E\u0935\u0938\u093E\u0933\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u0936\u0947\u0935\u091F\u0940 \u091C\u092E\u093F\u0928\u0940\u0924 \u092A\u093E\u0923\u0940 \u0938\u093E\u091A\u0923\u093E\u0930 \u0928\u093E\u0939\u0940 \u092F\u093E\u091A\u0940 \u0916\u092C\u0930\u0926\u093E\u0930\u0940 \u0918\u094D\u092F\u093E\u0935\u0940"
    ]
  }
];

// src/data/resultsData.ts
var defaultFarmerResults = [
  {
    id: "result-1",
    image: "/assets/result/1-himachal-variety-this-special-variety-from-himachal-pradesh-is-ideal-for-1723807624.jpg",
    name: {
      en: "Farmer Partner",
      mr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935"
    },
    location: {
      en: "Kaij Region",
      mr: "\u0915\u0948\u091C \u092A\u0930\u093F\u0938\u0930"
    },
    order: 1,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z"
  },
  {
    id: "result-2",
    image: "/assets/result/images.jfif",
    name: {
      en: "Farmer Partner",
      mr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935"
    },
    location: {
      en: "Dharur Region",
      mr: "\u0927\u093E\u0930\u0942\u0930 \u092A\u0930\u093F\u0938\u0930"
    },
    order: 2,
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z"
  },
  {
    id: "result-3",
    image: "/assets/result/images (1).jfif",
    name: {
      en: "Farmer Partner",
      mr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935"
    },
    location: {
      en: "Ambajogai",
      mr: "\u0905\u0902\u092C\u093E\u091C\u094B\u0917\u093E\u0908"
    },
    order: 3,
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z"
  },
  {
    id: "result-4",
    image: "/assets/result/images (2).jfif",
    name: {
      en: "Farmer Partner",
      mr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935"
    },
    location: {
      en: "Majalgaon",
      mr: "\u092E\u093E\u091C\u0932\u0917\u093E\u0935"
    },
    order: 4,
    createdAt: "2026-09-04T10:00:00.000Z",
    updatedAt: "2026-09-04T10:00:00.000Z"
  },
  {
    id: "result-5",
    image: "/assets/result/images (3).jfif",
    name: {
      en: "Farmer Partner",
      mr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935"
    },
    location: {
      en: "Beed Region",
      mr: "\u092C\u0940\u0921 \u092A\u0930\u093F\u0938\u0930"
    },
    order: 5,
    createdAt: "2026-09-05T10:00:00.000Z",
    updatedAt: "2026-09-05T10:00:00.000Z"
  },
  {
    id: "result-6",
    image: "/assets/result/images (4).jfif",
    name: {
      en: "Farmer Partner",
      mr: "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935"
    },
    location: {
      en: "Kalamb Region",
      mr: "\u0915\u0933\u0902\u092C \u092A\u0930\u093F\u0938\u0930"
    },
    order: 6,
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z"
  }
];

// src/data/aboutData.ts
var ownerProfile = {
  name: "Ganesh Shinde",
  nameMr: "\u0917\u0923\u0947\u0936 \u0936\u093F\u0902\u0926\u0947",
  village: {
    en: "Janegaon",
    mr: "\u091C\u093E\u0928\u0947\u0917\u093E\u0935"
  },
  role: {
    en: "Owner / Proprietor",
    mr: "\u0938\u0902\u091A\u093E\u0932\u0915"
  },
  bio: {
    en: "Ganesh Shinde is associated with Baliraja Krishi Seva Kendra, with this platform designed to present agricultural products, crop information, and practical information relevant to local farming needs.",
    mr: "\u0917\u0923\u0947\u0936 \u0936\u093F\u0902\u0926\u0947 \u0939\u0947 \u092C\u0933\u0940\u0930\u093E\u091C\u093E \u0915\u0943\u0937\u0940 \u0938\u0947\u0935\u093E \u0915\u0947\u0902\u0926\u094D\u0930\u093E\u0936\u0940 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0905\u0938\u0942\u0928, \u0936\u0947\u0924\u0915\u0931\u094D\u092F\u093E\u0902\u0938\u093E\u0920\u0940 \u0915\u0943\u0937\u0940 \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u0947, \u092A\u093F\u0915\u093E\u0902\u091A\u0940 \u092E\u093E\u0939\u093F\u0924\u0940 \u0906\u0923\u093F \u0938\u094D\u0925\u093E\u0928\u093F\u0915 \u0936\u0947\u0924\u0940\u091A\u094D\u092F\u093E \u0917\u0930\u091C\u093E\u0902\u0936\u0940 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928 \u0909\u092A\u0932\u092C\u094D\u0927 \u0915\u0930\u0942\u0928 \u0926\u0947\u0923\u094D\u092F\u093E\u091A\u094D\u092F\u093E \u0909\u0926\u094D\u0926\u0947\u0936\u093E\u0928\u0947 \u0939\u0947 \u0935\u094D\u092F\u093E\u0938\u092A\u0940\u0920 \u0909\u092D\u093E\u0930\u0923\u094D\u092F\u093E\u0924 \u0906\u0932\u0947 \u0906\u0939\u0947."
  },
  experience: {
    en: "Agricultural guidance grounded in local crop requirements and practical field experience.",
    mr: "\u0938\u094D\u0925\u093E\u0928\u093F\u0915 \u0936\u0947\u0924\u0940\u091A\u094D\u092F\u093E \u0917\u0930\u091C\u093E \u0906\u0923\u093F \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0905\u0928\u0941\u092D\u0935\u093E\u0935\u0930 \u0906\u0927\u093E\u0930\u093F\u0924 \u0915\u0943\u0937\u0940 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928."
  },
  // Official verified portrait of the proprietor
  image: "/assets/owner.png",
  isDemoContent: false
};
var verifiedBusinessInfo = {
  businessNameEn: "Baliraja Krishi Seva Kendra",
  businessNameMr: "\u092C\u0933\u0940\u0930\u093E\u091C\u093E \u0915\u0943\u0937\u0940 \u0938\u0947\u0935\u093E \u0915\u0947\u0902\u0926\u094D\u0930",
  taglineEn: "Agricultural information, products, and a trusted local connection.",
  taglineMr: "\u0936\u0947\u0924\u0940\u0938\u093E\u0920\u0940 \u092E\u093E\u0939\u093F\u0924\u0940, \u0909\u0924\u094D\u092A\u093E\u0926\u0928\u0947 \u0906\u0923\u093F \u0935\u093F\u0936\u094D\u0935\u093E\u0938\u093E\u091A\u093E \u0906\u0927\u093E\u0930.",
  ownerNameEn: "Ganesh Shinde",
  ownerNameMr: "\u0917\u0923\u0947\u0936 \u0936\u093F\u0902\u0926\u0947",
  nativePlaceEn: "Janegaon",
  nativePlaceMr: "\u091C\u093E\u0928\u0947\u0917\u093E\u0935",
  shopAddressEn: "Manglagwar Peth, Kaij, Dist. Beed, Maharashtra \u2013 431123",
  shopAddressMr: "\u092E\u0902\u0917\u0933\u0935\u093E\u0930 \u092A\u0947\u0920, \u0915\u0948\u091C, \u091C\u093F. \u092C\u0940\u0921, \u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u2013 \u096A\u0969\u0967\u0967\u0968\u0969",
  phone: "9881070520",
  whatsapp: "9881070520",
  email: "shinde.krishi.director@baliraja.in",
  otherBusinessNameEn: "Baliraja Jewellers",
  otherBusinessNameMr: "\u092C\u0933\u0940\u0930\u093E\u091C\u093E \u091C\u094D\u0935\u0947\u0932\u0930\u094D\u0938",
  otherBusinessNoteEn: "Independent retail enterprise owned by the proprietor (Non-agricultural).",
  otherBusinessNoteMr: "\u0938\u0902\u091A\u093E\u0932\u0915\u093E\u0902\u0936\u0940 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930 \u0935\u094D\u092F\u093E\u0935\u0938\u093E\u092F\u093F\u0915 \u0909\u092A\u0915\u094D\u0930\u092E (\u0917\u0948\u0930-\u0915\u0943\u0937\u0940).",
  location: {
    addressEn: "Manglagwar Peth, Kaij, Dist. Beed, Maharashtra \u2013 431123",
    addressMr: "\u092E\u0902\u0917\u0933\u0935\u093E\u0930 \u092A\u0947\u0920, \u0915\u0948\u091C, \u091C\u093F. \u092C\u0940\u0921, \u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u2013 \u096A\u0969\u0967\u0967\u0968\u0969",
    cityEn: "Kaij",
    cityMr: "\u0915\u0948\u091C",
    districtEn: "Beed",
    districtMr: "\u092C\u0940\u0921",
    pincode: "431123",
    latitude: 18.7042,
    longitude: 75.9556,
    googleMapsEmbedUrl: "https://maps.google.com/maps?q=18.7042,75.9556&t=&z=15&ie=UTF8&iwloc=&output=embed",
    googleMapsExternalUrl: "https://www.google.com/maps/search/?api=1&query=Manglagwar+Peth%2C+Kaij%2C+Dist.+Beed%2C+Maharashtra+431123"
  },
  social: {
    whatsapp: "9881070520",
    // Instagram handle and URL intentionally undefined pending owner confirmation
    instagramUrl: void 0,
    instagramHandle: void 0
  }
};

// server/storageService.ts
import fs2 from "node:fs";
import path2 from "node:path";
import crypto4 from "node:crypto";

// server/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
var SUPABASE_STORAGE_BUCKET = (process.env.SUPABASE_STORAGE_BUCKET || "baliraja-assets").trim();
function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
}
function getSupabaseServiceKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "").trim();
}
function isSupabaseServerConfigured() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  return Boolean(
    url && key && url.startsWith("https://") && key.length > 20
  );
}
var cachedClient = null;
function getSupabaseAdmin() {
  if (!isSupabaseServerConfigured()) {
    return null;
  }
  if (!cachedClient) {
    try {
      const url = getSupabaseUrl();
      const key = getSupabaseServiceKey();
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (err) {
      console.warn("[SUPABASE_SERVER] Failed to initialize Supabase admin client:", err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  return cachedClient;
}

// server/storageService.ts
var UPLOADS_DIR = path2.resolve(process.cwd(), "server/uploads");
try {
  if (!fs2.existsSync(UPLOADS_DIR)) {
    fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("[STORAGE_SERVICE] Uploads directory is read-only or not writable (operating in-memory / cloud storage mode):", err instanceof Error ? err.message : String(err));
}
function validateImageBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, mimeType: "", extension: "", error: "File is empty." };
  }
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, mimeType: "", extension: "", error: "File size exceeds maximum 15MB limit." };
  }
  if (buffer.length >= 12 && buffer[0] === 82 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 70 && buffer[8] === 87 && buffer[9] === 69 && buffer[10] === 66 && buffer[11] === 80) {
    return { valid: true, mimeType: "image/webp", extension: ".webp" };
  }
  if (buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71 && buffer[4] === 13 && buffer[5] === 10 && buffer[6] === 26 && buffer[7] === 10) {
    return { valid: true, mimeType: "image/png", extension: ".png" };
  }
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return { valid: true, mimeType: "image/jpeg", extension: ".jpg" };
  }
  if (buffer.length >= 6 && buffer[0] === 71 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 56 && (buffer[4] === 55 || buffer[4] === 57) && buffer[5] === 97) {
    return { valid: true, mimeType: "image/gif", extension: ".gif" };
  }
  const headerSample = buffer.subarray(0, Math.min(buffer.length, 1024)).toString("utf-8").trim().toLowerCase();
  if (headerSample.includes("<svg") || headerSample.includes("<?xml")) {
    const fullText = buffer.toString("utf-8").toLowerCase();
    if (fullText.includes("<svg") && fullText.includes("</svg>")) {
      const dangerousPatterns = [
        "<script",
        "javascript:",
        "onload=",
        "onerror=",
        "onclick=",
        "onmouseover=",
        "<foreignobject",
        'xlink:href="javascript',
        "xlink:href='javascript"
      ];
      const hasDanger = dangerousPatterns.some((pattern) => fullText.includes(pattern));
      if (hasDanger) {
        return { valid: false, mimeType: "", extension: "", error: "SVG contains disallowed executable script elements." };
      }
      return { valid: true, mimeType: "image/svg+xml", extension: ".svg" };
    }
  }
  return { valid: false, mimeType: "", extension: "", error: "Unsupported or corrupted image format. Please upload WebP, PNG, JPEG, GIF, or clean SVG." };
}
function generateSafeFilename(prefix, extension) {
  const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, "").toLowerCase().slice(0, 16) || "upload";
  const timestamp = Date.now();
  const randomHex = crypto4.randomBytes(8).toString("hex");
  const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;
  return `${safePrefix}_${timestamp}_${randomHex}${cleanExt}`;
}
function extractBufferFromBase64(dataUrlOrBase64) {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== "string") return null;
  const trimmed = dataUrlOrBase64.trim();
  const matches = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches[2]) {
    try {
      const buffer = Buffer.from(matches[2], "base64");
      return { buffer, declaredMime: matches[1] };
    } catch {
      return null;
    }
  }
  try {
    const buffer = Buffer.from(trimmed, "base64");
    return { buffer };
  } catch {
    return null;
  }
}
async function saveBase64Image(dataUrlOrBase64, prefix = "upload") {
  const extracted = extractBufferFromBase64(dataUrlOrBase64);
  if (!extracted || !extracted.buffer || extracted.buffer.length === 0) {
    return {
      success: false,
      errorEn: "Invalid or malformed Base64 image payload.",
      errorMr: "\u0905\u0935\u0948\u0927 \u0915\u093F\u0902\u0935\u093E \u0926\u0942\u0937\u093F\u0924 \u092A\u094D\u0930\u0924\u093F\u092E\u093E \u0921\u0947\u091F\u093E."
    };
  }
  return saveBinaryImage(extracted.buffer, prefix);
}
function saveBase64ImageSync(dataUrlOrBase64, prefix = "upload") {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== "string" || !dataUrlOrBase64.startsWith("data:image/")) {
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
  const filePath = path2.join(UPLOADS_DIR, filename);
  if (!path2.resolve(filePath).startsWith(UPLOADS_DIR)) {
    return dataUrlOrBase64;
  }
  try {
    const tmpPath = `${filePath}.tmp_${crypto4.randomBytes(4).toString("hex")}`;
    fs2.writeFileSync(tmpPath, extracted.buffer);
    fs2.renameSync(tmpPath, filePath);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn("[STORAGE_SERVICE] Could not save base64 image synchronously to disk (read-only filesystem):", err);
    return dataUrlOrBase64;
  }
}
async function saveBinaryImage(buffer, prefix = "upload") {
  const validation = validateImageBuffer(buffer);
  if (!validation.valid) {
    return {
      success: false,
      errorEn: validation.error || "Image validation failed.",
      errorMr: "\u092A\u094D\u0930\u0924\u093F\u092E\u093E \u092A\u0921\u0924\u093E\u0933\u0923\u0940 \u0905\u092F\u0936\u0938\u094D\u0935\u0940. \u0915\u0943\u092A\u092F\u093E \u092F\u094B\u0917\u094D\u092F \u092B\u0949\u0930\u092E\u0945\u091F \u0928\u093F\u0935\u0921\u093E."
    };
  }
  const filename = generateSafeFilename(prefix, validation.extension);
  if (isSupabaseServerConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const storagePath = `${prefix}/${filename}`;
      try {
        const { error: uploadError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(storagePath, buffer, {
          contentType: validation.mimeType,
          upsert: false
        });
        if (uploadError) {
          console.warn("[STORAGE_SERVICE] Supabase Storage upload failed, falling back to local storage:", uploadError.message);
        } else {
          const { data: publicUrlData } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);
          if (publicUrlData && publicUrlData.publicUrl) {
            return {
              success: true,
              url: publicUrlData.publicUrl,
              filename,
              size: buffer.length,
              mimeType: validation.mimeType
            };
          }
        }
      } catch (cloudErr) {
        console.warn("[STORAGE_SERVICE] Exception during Supabase upload, falling back to local storage:", cloudErr);
      }
    }
  }
  const filePath = path2.join(UPLOADS_DIR, filename);
  const resolved = path2.resolve(filePath);
  if (!resolved.startsWith(UPLOADS_DIR)) {
    return {
      success: false,
      errorEn: "Security violation: Path traversal detected.",
      errorMr: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0924\u094D\u0930\u0941\u091F\u0940: \u0905\u0935\u0948\u0927 \u092E\u093E\u0930\u094D\u0917 \u0906\u0922\u0933\u0932\u093E."
    };
  }
  try {
    const tmpPath = `${filePath}.tmp_${crypto4.randomBytes(4).toString("hex")}`;
    fs2.writeFileSync(tmpPath, buffer);
    fs2.renameSync(tmpPath, filePath);
    const stat = fs2.statSync(filePath);
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[STORAGE_SERVICE] Failed to save image file to disk:", msg);
    return {
      success: false,
      errorEn: `Server storage error: ${msg}`,
      errorMr: "\u0938\u0930\u094D\u0935\u094D\u0939\u0930\u0935\u0930 \u092A\u094D\u0930\u0924\u093F\u092E\u093E \u091C\u0924\u0928 \u0915\u0930\u0924\u093E\u0928\u093E \u0924\u094D\u0930\u0941\u091F\u0940 \u0906\u0932\u0940."
    };
  }
}
async function deleteUploadFile(urlOrFilename) {
  if (!urlOrFilename || typeof urlOrFilename !== "string") return false;
  if (urlOrFilename.includes("/storage/v1/object/public/" + SUPABASE_STORAGE_BUCKET)) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const parts = urlOrFilename.split("/storage/v1/object/public/" + SUPABASE_STORAGE_BUCKET + "/");
        if (parts[1]) {
          const objectPath = decodeURIComponent(parts[1].split("?")[0]);
          const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([objectPath]);
          if (!error) return true;
        }
      } catch (err) {
        console.error("[STORAGE_SERVICE] Failed to delete from Supabase storage:", err);
      }
    }
  }
  if (!urlOrFilename.startsWith("/uploads/") && !urlOrFilename.includes("server/uploads")) {
    return false;
  }
  const cleanName = path2.basename(urlOrFilename.replace(/^\/uploads\//, "").split("?")[0]);
  const filePath = path2.join(UPLOADS_DIR, cleanName);
  if (!path2.resolve(filePath).startsWith(UPLOADS_DIR)) {
    return false;
  }
  try {
    if (fs2.existsSync(filePath)) {
      fs2.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.error(`[STORAGE_SERVICE] Failed to delete file ${filePath}:`, err);
  }
  return false;
}

// server/contentDb.ts
var CONTENT_DIR = path3.resolve(process.cwd(), "server/data");
var CONTENT_FILE = path3.join(CONTENT_DIR, "content.json");
function initDefaultContent() {
  return {
    products: sampleProducts,
    categories: defaultCategories,
    brands: [],
    fieldVisits: fieldVisitItems.map((v, i) => ({ ...v, order: i + 1 })),
    fieldExperiences,
    results: defaultFarmerResults.map((r, i) => ({ ...r, order: i + 1 })),
    businessInfo: verifiedBusinessInfo,
    ownerProfile,
    auditLog: [
      {
        id: `audit-${Date.now()}-init`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        actionEn: "Initialized authoritative server content database with verified agricultural catalog",
        actionMr: "\u092A\u094D\u0930\u092E\u093E\u0923\u093F\u0924 \u0915\u0943\u0937\u0940 \u0915\u0945\u091F\u0932\u0949\u0917\u0938\u0939 \u0905\u0927\u093F\u0915\u0943\u0924 \u0938\u0930\u094D\u0935\u094D\u0939\u0930 \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0921\u0947\u091F\u093E\u092C\u0947\u0938 \u0938\u0941\u0930\u0942 \u0915\u0947\u0932\u093E",
        itemType: "system",
        performedBy: "System"
      }
    ],
    version: 4,
    lastModified: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapCategoryFromDb(row) {
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    nameMr: row.name_mr,
    image: row.image || "",
    icon: row.icon || "Layers",
    shortDesc: row.short_desc || "",
    shortDescMr: row.short_desc_mr || "",
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
    highlight: Boolean(row.highlight),
    featured: Boolean(row.featured),
    order: typeof row.display_order === "number" ? row.display_order : 1,
    active: row.active !== false
  };
}
function mapCategoryToDb(cat) {
  const isFeatured = Boolean(cat.featured || cat.highlight);
  return {
    id: cat.id,
    slug: cat.slug || cat.id,
    name: cat.name,
    name_mr: cat.nameMr || cat.name,
    image: cat.image || "",
    icon: cat.icon || "Layers",
    short_desc: cat.shortDesc || "",
    short_desc_mr: cat.shortDescMr || "",
    subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : [],
    highlight: isFeatured,
    featured: isFeatured,
    display_order: typeof cat.order === "number" ? cat.order : 1,
    active: cat.active !== false,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapProductFromDb(row) {
  const priceVal = row.price !== null && row.price !== void 0 ? Number(row.price) : void 0;
  return {
    id: row.id,
    slug: row.slug || row.id,
    nameEnglish: row.name_english,
    nameMarathi: row.name_marathi,
    categoryId: row.category_id,
    category: row.category_id,
    subcategoryId: row.subcategory_id || void 0,
    descriptionEnglish: row.description_english || "",
    descriptionMarathi: row.description_marathi || "",
    image: row.image,
    imageUrl: row.image_url || void 0,
    price: priceVal !== void 0 && !isNaN(priceVal) ? priceVal : void 0,
    availability: row.availability || "available",
    featured: Boolean(row.featured || row.is_bestseller),
    isBestseller: Boolean(row.is_bestseller || row.featured),
    popularity: typeof row.popularity === "number" ? row.popularity : 0,
    displayOrder: typeof row.display_order === "number" ? row.display_order : 1,
    isSample: Boolean(row.is_sample),
    keyPointsEnglish: Array.isArray(row.key_points_english) ? row.key_points_english : [],
    keyPointsMarathi: Array.isArray(row.key_points_marathi) ? row.key_points_marathi : [],
    suitableCropsEnglish: Array.isArray(row.suitable_crops_english) ? row.suitable_crops_english : [],
    suitableCropsMarathi: Array.isArray(row.suitable_crops_marathi) ? row.suitable_crops_marathi : [],
    translationSource: row.translation_source || void 0,
    customTranslation: Boolean(row.custom_translation),
    createdAt: row.created_at
  };
}
function mapProductToDb(prod) {
  const isFeatured = Boolean(prod.featured || prod.isBestseller);
  let cleanPrice = null;
  if (prod.price !== void 0 && prod.price !== null && prod.price !== "") {
    const num = Number(prod.price);
    if (!isNaN(num)) cleanPrice = num;
  }
  let availability = "available";
  if (prod.availability === "out_of_stock") {
    availability = "out_of_stock";
  } else if (prod.availability === "pre_order") {
    availability = "pre_order";
  }
  return {
    id: prod.id,
    slug: prod.slug || prod.id,
    name_english: prod.nameEnglish || "Product",
    name_marathi: prod.nameMarathi || prod.nameEnglish || "\u0909\u0924\u094D\u092A\u093E\u0926\u0928",
    category_id: prod.categoryId || prod.category || "seeds",
    subcategory_id: prod.subcategoryId || null,
    description_english: prod.descriptionEnglish || "",
    description_marathi: prod.descriptionMarathi || "",
    image: prod.image || "/assets/products/seeds/seed_1.png",
    image_url: prod.imageUrl || null,
    price: cleanPrice,
    availability,
    featured: isFeatured,
    is_bestseller: isFeatured,
    popularity: typeof prod.popularity === "number" ? prod.popularity : 0,
    display_order: typeof prod.displayOrder === "number" ? prod.displayOrder : 1,
    is_sample: Boolean(prod.isSample),
    key_points_english: Array.isArray(prod.keyPointsEnglish) ? prod.keyPointsEnglish : [],
    key_points_marathi: Array.isArray(prod.keyPointsMarathi) ? prod.keyPointsMarathi : [],
    suitable_crops_english: Array.isArray(prod.suitableCropsEnglish) ? prod.suitableCropsEnglish : [],
    suitable_crops_marathi: Array.isArray(prod.suitableCropsMarathi) ? prod.suitableCropsMarathi : [],
    translation_source: prod.translationSource || null,
    custom_translation: Boolean(prod.customTranslation),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapBrandFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    order: typeof row.display_order === "number" ? row.display_order : 1
  };
}
function mapBrandToDb(brand) {
  return {
    id: brand.id,
    name: brand.name || "Brand",
    logo: brand.logo || "",
    display_order: typeof brand.order === "number" ? brand.order : 1,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapFieldVisitFromDb(row) {
  return {
    id: row.id,
    titleEn: row.title_en,
    titleMr: row.title_mr,
    imageSrc: row.image_src,
    altEn: row.alt_en || void 0,
    altMr: row.alt_mr || void 0,
    tagEn: row.tag_en || void 0,
    tagMr: row.tag_mr || void 0,
    descriptionEn: row.description_en || void 0,
    descriptionMr: row.description_mr || void 0,
    order: typeof row.display_order === "number" ? row.display_order : 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapFieldVisitToDb(visit) {
  return {
    id: visit.id,
    title_en: visit.titleEn || "Field Guidance",
    title_mr: visit.titleMr || visit.titleEn || "\u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928",
    image_src: visit.imageSrc || "/assets/visit/visit1.png",
    alt_en: visit.altEn || null,
    alt_mr: visit.altMr || null,
    tag_en: visit.tagEn || null,
    tag_mr: visit.tagMr || null,
    description_en: visit.descriptionEn || null,
    description_mr: visit.descriptionMr || null,
    display_order: typeof visit.order === "number" ? visit.order : 1,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapFieldExperienceFromDb(row) {
  return {
    id: row.id,
    cropKey: row.crop_key,
    cropNameEnglish: row.crop_name_english,
    cropNameMarathi: row.crop_name_marathi,
    titleEnglish: row.title_english,
    titleMarathi: row.title_marathi,
    summaryEnglish: row.summary_english || "",
    summaryMarathi: row.summary_marathi || "",
    observationEnglish: row.observation_english || "",
    observationMarathi: row.observation_marathi || "",
    practiceEnglish: row.practice_english || "",
    practiceMarathi: row.practice_marathi || "",
    seasonEnglish: row.season_english || void 0,
    seasonMarathi: row.season_marathi || void 0,
    stageEnglish: row.stage_english || void 0,
    stageMarathi: row.stage_marathi || void 0,
    categoryKey: row.category_key || void 0,
    isSample: Boolean(row.is_sample),
    image: row.image || void 0,
    relatedProductIds: Array.isArray(row.related_product_ids) ? row.related_product_ids : [],
    keyInsightsEnglish: Array.isArray(row.key_insights_english) ? row.key_insights_english : [],
    keyInsightsMarathi: Array.isArray(row.key_insights_marathi) ? row.key_insights_marathi : [],
    translationSource: row.translation_source || void 0,
    customTranslation: Boolean(row.custom_translation)
  };
}
function mapFieldExperienceToDb(fe) {
  return {
    id: fe.id,
    crop_key: fe.cropKey || "general",
    crop_name_english: fe.cropNameEnglish || "General Crop",
    crop_name_marathi: fe.cropNameMarathi || "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092A\u0940\u0915",
    title_english: fe.titleEnglish || "Field Advisory",
    title_marathi: fe.titleMarathi || fe.titleEnglish || "\u0915\u0943\u0937\u0940 \u0938\u0932\u094D\u0932\u093E",
    summary_english: fe.summaryEnglish || "",
    summary_marathi: fe.summaryMarathi || "",
    observation_english: fe.observationEnglish || "",
    observation_marathi: fe.observationMarathi || "",
    practice_english: fe.practiceEnglish || "",
    practice_marathi: fe.practiceMarathi || "",
    season_english: fe.seasonEnglish || null,
    season_marathi: fe.seasonMarathi || null,
    stage_english: fe.stageEnglish || null,
    stage_marathi: fe.stageMarathi || null,
    category_key: fe.categoryKey || null,
    is_sample: Boolean(fe.isSample),
    image: fe.image || null,
    related_product_ids: Array.isArray(fe.relatedProductIds) ? fe.relatedProductIds : [],
    key_insights_english: Array.isArray(fe.keyInsightsEnglish) ? fe.keyInsightsEnglish : [],
    key_insights_marathi: Array.isArray(fe.keyInsightsMarathi) ? fe.keyInsightsMarathi : [],
    translation_source: fe.translationSource || null,
    custom_translation: Boolean(fe.customTranslation),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapFarmerResultFromDb(row) {
  return {
    id: row.id,
    image: row.image,
    name: { en: row.name_en, mr: row.name_mr },
    location: { en: row.location_en, mr: row.location_mr },
    nameEn: row.name_en,
    nameMr: row.name_mr,
    locationEn: row.location_en,
    locationMr: row.location_mr,
    order: typeof row.display_order === "number" ? row.display_order : 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapFarmerResultToDb(res) {
  const nameEn = res.name?.en || res.nameEn || "Farmer Partner";
  const nameMr = res.name?.mr || res.nameMr || "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935";
  const locEn = res.location?.en || res.locationEn || "Kaij Region";
  const locMr = res.location?.mr || res.locationMr || "\u0915\u0948\u091C \u092A\u0930\u093F\u0938\u0930";
  return {
    id: res.id,
    image: res.image || "/assets/result/1-himachal-variety-this-special-variety-from-himachal-pradesh-is-ideal-for-1723807624.jpg",
    name_en: nameEn,
    name_mr: nameMr,
    location_en: locEn,
    location_mr: locMr,
    display_order: typeof res.order === "number" ? res.order : 1,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapBusinessInfoFromDb(row, fallback) {
  return {
    businessNameEn: row.name,
    businessNameMr: row.name_mr,
    taglineEn: fallback.taglineEn,
    taglineMr: fallback.taglineMr,
    ownerNameEn: row.proprietor,
    ownerNameMr: row.proprietor_mr || row.proprietor,
    nativePlaceEn: fallback.nativePlaceEn || "Janegaon",
    nativePlaceMr: fallback.nativePlaceMr || "\u091C\u093E\u0928\u0947\u0917\u093E\u0935",
    shopAddressEn: row.address,
    shopAddressMr: row.address_mr || row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    otherBusinessNameEn: fallback.otherBusinessNameEn,
    otherBusinessNameMr: fallback.otherBusinessNameMr,
    otherBusinessNoteEn: fallback.otherBusinessNoteEn,
    otherBusinessNoteMr: fallback.otherBusinessNoteMr,
    location: {
      addressEn: row.address,
      addressMr: row.address_mr || row.address,
      cityEn: row.city,
      cityMr: row.city === "Kaij" ? "\u0915\u0948\u091C" : row.city,
      districtEn: row.district,
      districtMr: row.district === "Beed" ? "\u092C\u0940\u0921" : row.district,
      pincode: row.pincode,
      latitude: Number(row.latitude) || 18.7042,
      longitude: Number(row.longitude) || 75.9556,
      googleMapsEmbedUrl: fallback.location?.googleMapsEmbedUrl,
      googleMapsExternalUrl: row.google_maps_url || fallback.location?.googleMapsExternalUrl
    },
    social: {
      whatsapp: row.whatsapp,
      instagramUrl: fallback.social?.instagramUrl,
      instagramHandle: fallback.social?.instagramHandle
    }
  };
}
function mapBusinessInfoToDb(info) {
  const addrEn = info.location?.addressEn || info.shopAddressEn || "Manglagwar Peth, Kaij, Dist. Beed, Maharashtra \u2013 431123";
  const addrMr = info.location?.addressMr || info.shopAddressMr || "\u092E\u0902\u0917\u0933\u0935\u093E\u0930 \u092A\u0947\u0920, \u0915\u0948\u091C, \u091C\u093F. \u092C\u0940\u0921, \u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u2013 \u096A\u0969\u0967\u0967\u0968\u0969";
  return {
    id: "default_business_info",
    name: info.businessNameEn || "Baliraja Krishi Seva Kendra",
    name_mr: info.businessNameMr || "\u092C\u0933\u0940\u0930\u093E\u091C\u093E \u0915\u0943\u0937\u0940 \u0938\u0947\u0935\u093E \u0915\u0947\u0902\u0926\u094D\u0930",
    proprietor: info.ownerNameEn || "Ganesh Shinde",
    proprietor_mr: info.ownerNameMr || "\u0917\u0923\u0947\u0936 \u0936\u093F\u0902\u0926\u0947",
    address: addrEn,
    address_mr: addrMr,
    city: info.location?.cityEn || "Kaij",
    district: info.location?.districtEn || "Beed",
    state: "Maharashtra",
    pincode: info.location?.pincode || "431123",
    phone: info.phone || "9881070520",
    whatsapp: info.whatsapp || "9881070520",
    email: info.email || "shinde.krishi.director@baliraja.in",
    latitude: info.location?.latitude || 18.7042,
    longitude: info.location?.longitude || 75.9556,
    google_maps_url: info.location?.googleMapsExternalUrl || null,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapOwnerProfileFromDb(row, fallback) {
  return {
    name: row.name,
    nameMr: row.name_mr,
    village: fallback.village || { en: "Janegaon", mr: "\u091C\u093E\u0928\u0947\u0917\u093E\u0935" },
    role: { en: row.title, mr: row.title_mr },
    bio: { en: row.bio_en, mr: row.bio_mr },
    experience: {
      en: row.education_en || fallback.experience?.en || "",
      mr: row.education_mr || fallback.experience?.mr || ""
    },
    image: row.image,
    isDemoContent: fallback.isDemoContent || false
  };
}
function mapOwnerProfileToDb(profile) {
  return {
    id: "default_owner_profile",
    name: profile.name || "Ganesh Shinde",
    name_mr: profile.nameMr || "\u0917\u0923\u0947\u0936 \u0936\u093F\u0902\u0926\u0947",
    title: profile.role?.en || "Owner / Proprietor",
    title_mr: profile.role?.mr || "\u0938\u0902\u091A\u093E\u0932\u0915",
    bio_en: profile.bio?.en || "",
    bio_mr: profile.bio?.mr || "",
    education_en: profile.experience?.en || null,
    education_mr: profile.experience?.mr || null,
    image: profile.image || "/assets/owner.png",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function mapAuditLogFromDb(row) {
  return {
    id: row.id,
    actionEn: row.action_en,
    actionMr: row.action_mr,
    itemType: row.item_type,
    performedBy: row.performed_by,
    timestamp: row.timestamp
  };
}
function mapAuditLogToDb(entry) {
  return {
    id: entry.id,
    action_en: entry.actionEn,
    action_mr: entry.actionMr,
    item_type: entry.itemType,
    performed_by: entry.performedBy,
    timestamp: entry.timestamp || (/* @__PURE__ */ new Date()).toISOString()
  };
}
var ServerContentDatabase = class {
  localData;
  constructor() {
    this.ensureDirectory();
    this.localData = this.loadLocalDatabase();
  }
  ensureDirectory() {
    try {
      if (!fs3.existsSync(CONTENT_DIR)) {
        fs3.mkdirSync(CONTENT_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn("[SERVER_CONTENT_DB] Content directory is read-only or not writable (in-memory mode active):", err instanceof Error ? err.message : String(err));
    }
  }
  loadLocalDatabase() {
    try {
      if (fs3.existsSync(CONTENT_FILE)) {
        const raw = fs3.readFileSync(CONTENT_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
          this.localData = {
            products: parsed.products,
            categories: parsed.categories,
            brands: Array.isArray(parsed.brands) ? parsed.brands : [],
            fieldVisits: Array.isArray(parsed.fieldVisits) ? parsed.fieldVisits : [],
            fieldExperiences: Array.isArray(parsed.fieldExperiences) ? parsed.fieldExperiences : [],
            results: Array.isArray(parsed.results) ? parsed.results : [],
            businessInfo: parsed.businessInfo || verifiedBusinessInfo,
            ownerProfile: parsed.ownerProfile || ownerProfile,
            auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
            version: parsed.version || 4,
            lastModified: parsed.lastModified || (/* @__PURE__ */ new Date()).toISOString()
          };
          return this.localData;
        }
      }
    } catch (err) {
      console.warn("[SERVER_CONTENT_DB] Error loading local content JSON file, initializing defaults:", err instanceof Error ? err.message : String(err));
    }
    const initial = initDefaultContent();
    try {
      this.saveLocalDatabaseSync(initial);
    } catch (err) {
      console.warn("[SERVER_CONTENT_DB] Could not persist initial local content (read-only filesystem):", err instanceof Error ? err.message : String(err));
    }
    this.localData = initial;
    return initial;
  }
  saveLocalDatabaseSync(data) {
    try {
      this.ensureDirectory();
      const tmpFile = `${CONTENT_FILE}.tmp_${Date.now()}`;
      fs3.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
      fs3.renameSync(tmpFile, CONTENT_FILE);
    } catch (err) {
      console.warn("[SERVER_CONTENT_DB] Could not save content database file (in-memory state active):", err instanceof Error ? err.message : String(err));
    }
  }
  persistLocal() {
    this.localData.lastModified = (/* @__PURE__ */ new Date()).toISOString();
    this.saveLocalDatabaseSync(this.localData);
  }
  async recordAudit(actionEn, actionMr, itemType, performedBy = "Administrator") {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actionEn,
      actionMr,
      itemType,
      performedBy
    };
    this.localData.auditLog = [entry, ...this.localData.auditLog || []].slice(0, 100);
    this.persistLocal();
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("admin_audit_logs").insert(mapAuditLogToDb(entry));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Failed to record audit log to Supabase:", err);
        }
      }
    }
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 1. FULL CONTENT BUNDLE
  // ═════════════════════════════════════════════════════════════════════════════
  async getAllContent() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const [
            catsRes,
            prodsRes,
            brandsRes,
            visitsRes,
            expsRes,
            resultsRes,
            bizRes,
            ownerRes,
            logsRes
          ] = await Promise.all([
            supabase.from("categories").select("*").order("display_order", { ascending: true }),
            supabase.from("products").select("*").order("display_order", { ascending: true }),
            supabase.from("brands").select("*").order("display_order", { ascending: true }),
            supabase.from("field_visits").select("*").order("display_order", { ascending: true }),
            supabase.from("field_experiences").select("*"),
            supabase.from("farmer_results").select("*").order("display_order", { ascending: true }),
            supabase.from("business_info").select("*").limit(1),
            supabase.from("owner_profile").select("*").limit(1),
            supabase.from("admin_audit_logs").select("*").order("timestamp", { ascending: false }).limit(50)
          ]);
          const hasData = catsRes.data && catsRes.data.length > 0 || prodsRes.data && prodsRes.data.length > 0;
          if (hasData) {
            const categories = (catsRes.data || []).map(mapCategoryFromDb);
            const products = (prodsRes.data || []).map(mapProductFromDb);
            const brands = (brandsRes.data || []).map(mapBrandFromDb);
            const fieldVisits = (visitsRes.data || []).map(mapFieldVisitFromDb);
            const fieldExperiences2 = (expsRes.data || []).map(mapFieldExperienceFromDb);
            const results = (resultsRes.data || []).map(mapFarmerResultFromDb);
            const businessInfo = bizRes.data && bizRes.data[0] ? mapBusinessInfoFromDb(bizRes.data[0], this.localData.businessInfo || verifiedBusinessInfo) : this.localData.businessInfo || verifiedBusinessInfo;
            const ownerProfile2 = ownerRes.data && ownerRes.data[0] ? mapOwnerProfileFromDb(ownerRes.data[0], this.localData.ownerProfile || ownerProfile) : this.localData.ownerProfile || ownerProfile;
            const auditLog = (logsRes.data || []).map(mapAuditLogFromDb);
            return {
              products,
              categories,
              brands,
              fieldVisits,
              fieldExperiences: fieldExperiences2,
              results,
              businessInfo,
              ownerProfile: ownerProfile2,
              auditLog,
              version: 4,
              lastModified: (/* @__PURE__ */ new Date()).toISOString()
            };
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase query error in getAllContent, falling back to local storage:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return JSON.parse(JSON.stringify(this.localData));
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 2. PRODUCTS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  async getProducts() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("products").select("*").order("display_order", { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapProductFromDb);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getProducts error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.products];
  }
  async getProductById(id) {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
          if (!error && data) {
            return mapProductFromDb(data);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getProductById error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    const p = this.localData.products.find((prod) => prod.id === id);
    return p ? { ...p } : null;
  }
  async createProduct(productData, performedBy) {
    this.loadLocalDatabase();
    const id = productData.id || `prod-${Date.now()}`;
    const slug = productData.slug || productData.nameEnglish?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || id;
    const rawImage = productData.image || productData.imageUrl || "/assets/products/seeds/seed_1.png";
    const sanitizedImage = saveBase64ImageSync(rawImage, "product");
    const rawImageUrl = productData.imageUrl || productData.image || "/assets/products/seeds/seed_1.png";
    const sanitizedImageUrl = rawImageUrl === rawImage ? sanitizedImage : saveBase64ImageSync(rawImageUrl, "product");
    const newProd = {
      id,
      slug,
      nameEnglish: productData.nameEnglish || "New Product",
      nameMarathi: productData.nameMarathi || productData.nameEnglish || "\u0928\u0935\u0940\u0928 \u0909\u0924\u094D\u092A\u093E\u0926\u0928",
      categoryId: productData.categoryId || "seeds",
      category: productData.category || productData.categoryId || "seeds",
      subcategoryId: productData.subcategoryId,
      descriptionEnglish: productData.descriptionEnglish || "",
      descriptionMarathi: productData.descriptionMarathi || "",
      image: sanitizedImage,
      imageUrl: sanitizedImageUrl,
      price: productData.price !== void 0 ? productData.price : 0,
      createdAt: productData.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      availability: productData.availability || "available",
      featured: Boolean(productData.featured || productData.isBestseller),
      isBestseller: Boolean(productData.isBestseller || productData.featured),
      popularity: typeof productData.popularity === "number" ? productData.popularity : 0,
      displayOrder: typeof productData.displayOrder === "number" ? productData.displayOrder : this.localData.products.length + 1,
      isSample: Boolean(productData.isSample),
      keyPointsEnglish: Array.isArray(productData.keyPointsEnglish) ? productData.keyPointsEnglish : [],
      keyPointsMarathi: Array.isArray(productData.keyPointsMarathi) ? productData.keyPointsMarathi : [],
      suitableCropsEnglish: Array.isArray(productData.suitableCropsEnglish) ? productData.suitableCropsEnglish : [],
      suitableCropsMarathi: Array.isArray(productData.suitableCropsMarathi) ? productData.suitableCropsMarathi : [],
      translationSource: productData.translationSource,
      customTranslation: productData.customTranslation
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const dbPayload = mapProductToDb(newProd);
          await supabase.from("products").upsert(dbPayload);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase createProduct error:", err);
        }
      }
    }
    this.localData.products.unshift(newProd);
    await this.recordAudit(
      `Created product: ${newProd.nameEnglish}`,
      `\u0928\u0935\u0940\u0928 \u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u091C\u094B\u0921\u0932\u0947: ${newProd.nameMarathi}`,
      "product",
      performedBy
    );
    this.persistLocal();
    return newProd;
  }
  async updateProduct(id, updates, performedBy) {
    this.loadLocalDatabase();
    const idx = this.localData.products.findIndex((p) => p.id === id);
    const current = idx !== -1 ? this.localData.products[idx] : null;
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, "product");
    }
    if (cleanUpdates.imageUrl) {
      cleanUpdates.imageUrl = saveBase64ImageSync(cleanUpdates.imageUrl, "product");
    }
    const updated = {
      ...current || {},
      ...cleanUpdates,
      id
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const dbPayload = mapProductToDb(updated);
          await supabase.from("products").update(dbPayload).eq("id", id);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateProduct error:", err);
        }
      }
    }
    if (idx !== -1) {
      this.localData.products[idx] = updated;
    } else {
      this.localData.products.push(updated);
    }
    await this.recordAudit(
      `Updated product: ${updated.nameEnglish}`,
      `\u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0947: ${updated.nameMarathi}`,
      "product",
      performedBy
    );
    this.persistLocal();
    return updated;
  }
  async deleteProduct(id, performedBy) {
    this.loadLocalDatabase();
    const existing = this.localData.products.find((p) => p.id === id);
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("products").delete().eq("id", id);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase deleteProduct error:", err);
        }
      }
    }
    this.localData.products = this.localData.products.filter((p) => p.id !== id);
    await this.recordAudit(
      `Deleted product: ${existing?.nameEnglish || id}`,
      `\u0909\u0924\u094D\u092A\u093E\u0926\u0928 \u0939\u091F\u0935\u0932\u0947: ${existing?.nameMarathi || id}`,
      "product",
      performedBy
    );
    this.persistLocal();
    return true;
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 3. CATEGORIES CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  async getCategories() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapCategoryFromDb);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getCategories error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async getCategoryById(id) {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("categories").select("*").or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
          if (!error && data) {
            return mapCategoryFromDb(data);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getCategoryById error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    const c = this.localData.categories.find((cat) => cat.id === id || cat.slug === id);
    return c ? { ...c } : null;
  }
  async createCategory(catData, performedBy) {
    this.loadLocalDatabase();
    const id = catData.id || `cat-${Date.now()}`;
    const slug = catData.slug || id;
    const rawImage = catData.image || "/assets/categories/seeds.png";
    const sanitizedImage = saveBase64ImageSync(rawImage, "category");
    const newCat = {
      id,
      slug,
      name: catData.name || "New Category",
      nameMr: catData.nameMr || catData.name || "\u0928\u0935\u0940\u0928 \u0935\u0930\u094D\u0917\u0935\u093E\u0930\u0940",
      image: sanitizedImage,
      icon: catData.icon || "Layers",
      shortDesc: catData.shortDesc || "",
      shortDescMr: catData.shortDescMr || "",
      subcategories: Array.isArray(catData.subcategories) ? catData.subcategories : [],
      highlight: Boolean(catData.highlight || catData.featured),
      featured: Boolean(catData.featured || catData.highlight),
      order: typeof catData.order === "number" ? catData.order : this.localData.categories.length + 1,
      active: catData.active !== false
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("categories").upsert(mapCategoryToDb(newCat));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase createCategory error:", err);
        }
      }
    }
    this.localData.categories.push(newCat);
    await this.recordAudit(
      `Created category: ${newCat.name}`,
      `\u0928\u0935\u0940\u0928 \u0935\u0930\u094D\u0917\u0935\u093E\u0930\u0940 \u0924\u092F\u093E\u0930 \u0915\u0947\u0932\u0940: ${newCat.nameMr}`,
      "category",
      performedBy
    );
    this.persistLocal();
    return newCat;
  }
  async updateCategory(id, updates, performedBy) {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      return null;
    }
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, "category");
    }
    const isFeatured = cleanUpdates.featured !== void 0 ? Boolean(cleanUpdates.featured) : cleanUpdates.highlight !== void 0 ? Boolean(cleanUpdates.highlight) : Boolean(existing.featured || existing.highlight);
    const updated = {
      ...existing,
      ...cleanUpdates,
      id: existing.id,
      slug: cleanUpdates.slug || existing.slug || existing.id,
      featured: isFeatured,
      highlight: isFeatured,
      active: cleanUpdates.active !== void 0 ? Boolean(cleanUpdates.active) : existing.active !== false
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { error } = await supabase.from("categories").update(mapCategoryToDb(updated)).eq("id", existing.id);
          if (error) {
            console.warn("[SERVER_CONTENT_DB] Supabase updateCategory error:", error.message);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateCategory error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    const idx = this.localData.categories.findIndex((c) => c.id === existing.id || c.slug === existing.id);
    if (idx !== -1) {
      this.localData.categories[idx] = updated;
    } else {
      this.localData.categories.push(updated);
    }
    await this.recordAudit(
      `Updated category: ${updated.name}`,
      `\u0935\u0930\u094D\u0917\u0935\u093E\u0930\u0940 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940: ${updated.nameMr}`,
      "category",
      performedBy
    );
    this.persistLocal();
    return updated;
  }
  async deleteCategory(id, performedBy) {
    const existing = await this.getCategoryById(id);
    if (!existing) return false;
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { error } = await supabase.from("categories").delete().eq("id", existing.id);
          if (error) {
            console.warn("[SERVER_CONTENT_DB] Supabase deleteCategory error:", error.message);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase deleteCategory error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    this.localData.categories = this.localData.categories.filter((c) => c.id !== existing.id && c.slug !== existing.id);
    await this.recordAudit(
      `Deleted category: ${existing.name}`,
      `\u0935\u0930\u094D\u0917\u0935\u093E\u0930\u0940 \u0939\u091F\u0935\u0932\u0940: ${existing.nameMr}`,
      "category",
      performedBy
    );
    this.persistLocal();
    return true;
  }
  async reorderCategories(orderedIds, performedBy) {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.categories.forEach((cat) => {
      if (orderMap.has(cat.id)) {
        cat.order = orderMap.get(cat.id);
      }
    });
    this.localData.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from("categories").update({ display_order: i + 1 }).eq("id", orderedIds[i]);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase reorderCategories error:", err);
        }
      }
    }
    await this.recordAudit("Reordered categories display sequence", "\u0935\u0930\u094D\u0917\u0935\u093E\u0930\u0940 \u0915\u094D\u0930\u092E\u0935\u093E\u0930\u0940 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940", "category", performedBy);
    this.persistLocal();
    return this.getCategories();
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 4. BRANDS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  async getBrands() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("brands").select("*").order("display_order", { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapBrandFromDb);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getBrands error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.brands].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async createBrand(brandData, performedBy) {
    this.loadLocalDatabase();
    const id = brandData.id || `brand-${Date.now()}`;
    const rawLogo = brandData.logo || "";
    const sanitizedLogo = saveBase64ImageSync(rawLogo, "brand");
    const newBrand = {
      id,
      name: brandData.name || "New Brand",
      logo: sanitizedLogo,
      order: typeof brandData.order === "number" ? brandData.order : this.localData.brands.length + 1
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("brands").upsert(mapBrandToDb(newBrand));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase createBrand error:", err);
        }
      }
    }
    this.localData.brands.push(newBrand);
    await this.recordAudit(`Created brand: ${newBrand.name}`, `\u0928\u0935\u0940\u0928 \u092C\u094D\u0930\u0901\u0921 \u091C\u094B\u0921\u0932\u093E: ${newBrand.name}`, "brand", performedBy);
    this.persistLocal();
    return newBrand;
  }
  async updateBrand(id, updates, performedBy) {
    this.loadLocalDatabase();
    const idx = this.localData.brands.findIndex((b) => b.id === id);
    const current = idx !== -1 ? this.localData.brands[idx] : null;
    const cleanUpdates = { ...updates };
    if (cleanUpdates.logo) {
      cleanUpdates.logo = saveBase64ImageSync(cleanUpdates.logo, "brand");
    }
    const updated = { ...current || {}, ...cleanUpdates, id };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("brands").upsert(mapBrandToDb(updated));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateBrand error:", err);
        }
      }
    }
    if (idx !== -1) {
      this.localData.brands[idx] = updated;
    } else {
      this.localData.brands.push(updated);
    }
    await this.recordAudit(`Updated brand: ${updated.name}`, `\u092C\u094D\u0930\u0901\u0921 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u093E: ${updated.name}`, "brand", performedBy);
    this.persistLocal();
    return updated;
  }
  async deleteBrand(id, performedBy) {
    this.loadLocalDatabase();
    const existing = this.localData.brands.find((b) => b.id === id);
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("brands").delete().eq("id", id);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase deleteBrand error:", err);
        }
      }
    }
    this.localData.brands = this.localData.brands.filter((b) => b.id !== id);
    await this.recordAudit(`Deleted brand: ${existing?.name || id}`, `\u092C\u094D\u0930\u0901\u0921 \u0939\u091F\u0935\u0932\u093E: ${existing?.name || id}`, "brand", performedBy);
    this.persistLocal();
    return true;
  }
  async reorderBrands(orderedIds, performedBy) {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.brands.forEach((brand) => {
      if (orderMap.has(brand.id)) {
        brand.order = orderMap.get(brand.id);
      }
    });
    this.localData.brands.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from("brands").update({ display_order: i + 1 }).eq("id", orderedIds[i]);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase reorderBrands error:", err);
        }
      }
    }
    await this.recordAudit("Reordered connected brands sequence", "\u092C\u094D\u0930\u0901\u0921\u094D\u0938 \u0915\u094D\u0930\u092E\u0935\u093E\u0930\u0940 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940", "brand", performedBy);
    this.persistLocal();
    return this.getBrands();
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 5. FIELD VISITS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  async getFieldVisits() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("field_visits").select("*").order("display_order", { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapFieldVisitFromDb);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getFieldVisits error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.fieldVisits].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async createFieldVisit(visitData, performedBy) {
    this.loadLocalDatabase();
    const id = visitData.id || `visit-${Date.now()}`;
    const rawImageSrc = visitData.imageSrc || "/assets/visit/visit1.png";
    const sanitizedImageSrc = saveBase64ImageSync(rawImageSrc, "visit");
    const newVisit = {
      id,
      titleEn: visitData.titleEn || "Field Guidance",
      titleMr: visitData.titleMr || visitData.titleEn || "\u0936\u0947\u0924\u093E\u0924\u0940\u0932 \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928",
      imageSrc: sanitizedImageSrc,
      altEn: visitData.altEn,
      altMr: visitData.altMr,
      tagEn: visitData.tagEn,
      tagMr: visitData.tagMr,
      descriptionEn: visitData.descriptionEn,
      descriptionMr: visitData.descriptionMr,
      order: typeof visitData.order === "number" ? visitData.order : this.localData.fieldVisits.length + 1,
      createdAt: visitData.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("field_visits").upsert(mapFieldVisitToDb(newVisit));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase createFieldVisit error:", err);
        }
      }
    }
    this.localData.fieldVisits.unshift(newVisit);
    await this.recordAudit(`Added field visit record: ${newVisit.titleEn}`, `\u0936\u0947\u0924 \u092D\u0947\u091F \u0928\u094B\u0902\u0926 \u091C\u094B\u0921\u0932\u0940: ${newVisit.titleMr}`, "field-visit", performedBy);
    this.persistLocal();
    return newVisit;
  }
  async updateFieldVisit(id, updates, performedBy) {
    this.loadLocalDatabase();
    const idx = this.localData.fieldVisits.findIndex((v) => v.id === id);
    const current = idx !== -1 ? this.localData.fieldVisits[idx] : null;
    const cleanUpdates = { ...updates };
    if (cleanUpdates.imageSrc) {
      cleanUpdates.imageSrc = saveBase64ImageSync(cleanUpdates.imageSrc, "visit");
    }
    const updated = {
      ...current || {},
      ...cleanUpdates,
      id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("field_visits").update(mapFieldVisitToDb(updated)).eq("id", id);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateFieldVisit error:", err);
        }
      }
    }
    if (idx !== -1) {
      this.localData.fieldVisits[idx] = updated;
    } else {
      this.localData.fieldVisits.push(updated);
    }
    await this.recordAudit(`Updated field visit: ${updated.titleEn}`, `\u0936\u0947\u0924 \u092D\u0947\u091F \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940: ${updated.titleMr}`, "field-visit", performedBy);
    this.persistLocal();
    return updated;
  }
  async deleteFieldVisit(id, performedBy) {
    this.loadLocalDatabase();
    const existing = this.localData.fieldVisits.find((v) => v.id === id);
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("field_visits").delete().eq("id", id);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase deleteFieldVisit error:", err);
        }
      }
    }
    this.localData.fieldVisits = this.localData.fieldVisits.filter((v) => v.id !== id);
    await this.recordAudit(`Deleted field visit record: ${existing?.titleEn || id}`, `\u0936\u0947\u0924 \u092D\u0947\u091F \u0928\u094B\u0902\u0926 \u0939\u091F\u0935\u0932\u0940: ${existing?.titleMr || id}`, "field-visit", performedBy);
    this.persistLocal();
    return true;
  }
  async reorderFieldVisits(orderedIds, performedBy) {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.fieldVisits.forEach((visit) => {
      if (orderMap.has(visit.id)) {
        visit.order = orderMap.get(visit.id);
      }
    });
    this.localData.fieldVisits.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from("field_visits").update({ display_order: i + 1 }).eq("id", orderedIds[i]);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase reorderFieldVisits error:", err);
        }
      }
    }
    await this.recordAudit("Reordered field visits gallery sequence", "\u0936\u0947\u0924 \u092D\u0947\u091F\u0940\u0902\u091A\u0940 \u0915\u094D\u0930\u092E\u0935\u093E\u0930\u0940 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940", "field-visit", performedBy);
    this.persistLocal();
    return this.getFieldVisits();
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 6. FIELD EXPERIENCES CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  async getFieldExperiences() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("field_experiences").select("*");
          if (!error && data && data.length > 0) {
            return data.map(mapFieldExperienceFromDb);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getFieldExperiences error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.fieldExperiences];
  }
  async createFieldExperience(feData, performedBy) {
    this.loadLocalDatabase();
    const id = feData.id || `fe-${Date.now()}`;
    const rawImage = feData.image ? saveBase64ImageSync(feData.image, "fieldexp") : void 0;
    const newFe = {
      id,
      cropKey: feData.cropKey || "general",
      cropNameEnglish: feData.cropNameEnglish || "General Crop",
      cropNameMarathi: feData.cropNameMarathi || "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092A\u0940\u0915",
      titleEnglish: feData.titleEnglish || "Field Advisory Observation",
      titleMarathi: feData.titleMarathi || feData.titleEnglish || "\u0915\u0943\u0937\u0940 \u0938\u0932\u094D\u0932\u093E \u0935 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0923",
      summaryEnglish: feData.summaryEnglish || "",
      summaryMarathi: feData.summaryMarathi || "",
      observationEnglish: feData.observationEnglish || "",
      observationMarathi: feData.observationMarathi || "",
      practiceEnglish: feData.practiceEnglish || "",
      practiceMarathi: feData.practiceMarathi || "",
      seasonEnglish: feData.seasonEnglish,
      seasonMarathi: feData.seasonMarathi,
      stageEnglish: feData.stageEnglish,
      stageMarathi: feData.stageMarathi,
      categoryKey: feData.categoryKey,
      isSample: Boolean(feData.isSample),
      image: rawImage,
      relatedProductIds: Array.isArray(feData.relatedProductIds) ? feData.relatedProductIds : [],
      keyInsightsEnglish: Array.isArray(feData.keyInsightsEnglish) ? feData.keyInsightsEnglish : [],
      keyInsightsMarathi: Array.isArray(feData.keyInsightsMarathi) ? feData.keyInsightsMarathi : [],
      translationSource: feData.translationSource,
      customTranslation: feData.customTranslation
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("field_experiences").upsert(mapFieldExperienceToDb(newFe));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase createFieldExperience error:", err);
        }
      }
    }
    this.localData.fieldExperiences.unshift(newFe);
    await this.recordAudit(`Added field experience advisory: ${newFe.titleEnglish}`, `\u0915\u0943\u0937\u0940 \u0938\u0932\u094D\u0932\u093E \u0928\u094B\u0902\u0926 \u091C\u094B\u0921\u0932\u0940: ${newFe.titleMarathi}`, "field-experience", performedBy);
    this.persistLocal();
    return newFe;
  }
  async updateFieldExperience(id, updates, performedBy) {
    this.loadLocalDatabase();
    const idx = this.localData.fieldExperiences.findIndex((fe) => fe.id === id);
    const current = idx !== -1 ? this.localData.fieldExperiences[idx] : null;
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, "fieldexp");
    }
    const updated = { ...current || {}, ...cleanUpdates, id };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("field_experiences").upsert(mapFieldExperienceToDb(updated));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateFieldExperience error:", err);
        }
      }
    }
    if (idx !== -1) {
      this.localData.fieldExperiences[idx] = updated;
    } else {
      this.localData.fieldExperiences.push(updated);
    }
    await this.recordAudit(`Updated field experience: ${updated.titleEnglish}`, `\u0915\u0943\u0937\u0940 \u0938\u0932\u094D\u0932\u093E \u0928\u094B\u0902\u0926 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940: ${updated.titleMarathi}`, "field-experience", performedBy);
    this.persistLocal();
    return updated;
  }
  async deleteFieldExperience(id, performedBy) {
    this.loadLocalDatabase();
    const existing = this.localData.fieldExperiences.find((fe) => fe.id === id);
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("field_experiences").delete().eq("id", id);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase deleteFieldExperience error:", err);
        }
      }
    }
    this.localData.fieldExperiences = this.localData.fieldExperiences.filter((fe) => fe.id !== id);
    await this.recordAudit(`Deleted field experience: ${existing?.titleEnglish || id}`, `\u0915\u0943\u0937\u0940 \u0938\u0932\u094D\u0932\u093E \u0928\u094B\u0902\u0926 \u0939\u091F\u0935\u0932\u0940: ${existing?.titleMarathi || id}`, "field-experience", performedBy);
    this.persistLocal();
    return true;
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 7. FARMER RESULTS CRUD
  // ═════════════════════════════════════════════════════════════════════════════
  async getResults() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("farmer_results").select("*").order("display_order", { ascending: true });
          if (!error && data && data.length > 0) {
            return data.map(mapFarmerResultFromDb);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getResults error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.results].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  async createResult(resData, performedBy) {
    this.loadLocalDatabase();
    const id = resData.id || `res-${Date.now()}`;
    const nameEn = resData.name?.en || resData.nameEn || "Progressive Farmer";
    const nameMr = resData.name?.mr || resData.nameMr || "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935";
    const locEn = resData.location?.en || resData.locationEn || "Kaij Region";
    const locMr = resData.location?.mr || resData.locationMr || "\u0915\u0948\u091C \u092A\u0930\u093F\u0938\u0930";
    const rawImage = resData.image || "/assets/result/1-himachal-variety-this-special-variety-from-himachal-pradesh-is-ideal-for-1723807624.jpg";
    const sanitizedImage = saveBase64ImageSync(rawImage, "result");
    const newRes = {
      id,
      image: sanitizedImage,
      name: { en: nameEn, mr: nameMr },
      location: { en: locEn, mr: locMr },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr,
      order: typeof resData.order === "number" ? resData.order : this.localData.results.length + 1,
      createdAt: resData.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("farmer_results").upsert(mapFarmerResultToDb(newRes));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase createResult error:", err);
        }
      }
    }
    this.localData.results.unshift(newRes);
    await this.recordAudit(`Added farmer success result: ${newRes.name.en}`, `\u0936\u0947\u0924\u0915\u0930\u0940 \u092F\u0936\u094B\u0917\u093E\u0925\u093E \u091C\u094B\u0921\u0932\u0940: ${newRes.name.mr}`, "result", performedBy);
    this.persistLocal();
    return newRes;
  }
  async updateResult(id, updates, performedBy) {
    this.loadLocalDatabase();
    const idx = this.localData.results.findIndex((r) => r.id === id);
    const current = idx !== -1 ? this.localData.results[idx] : null;
    const cleanUpdates = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = saveBase64ImageSync(cleanUpdates.image, "result");
    }
    const nameEn = cleanUpdates.name?.en || cleanUpdates.nameEn || current?.name.en || "Farmer Partner";
    const nameMr = cleanUpdates.name?.mr || cleanUpdates.nameMr || current?.name.mr || "\u0936\u0947\u0924\u0915\u0930\u0940 \u092C\u093E\u0902\u0927\u0935";
    const locEn = cleanUpdates.location?.en || cleanUpdates.locationEn || current?.location.en || "Kaij Region";
    const locMr = cleanUpdates.location?.mr || cleanUpdates.locationMr || current?.location.mr || "\u0915\u0948\u091C \u092A\u0930\u093F\u0938\u0930";
    const updated = {
      ...current || {},
      ...cleanUpdates,
      id,
      name: { en: nameEn, mr: nameMr },
      location: { en: locEn, mr: locMr },
      nameEn,
      nameMr,
      locationEn: locEn,
      locationMr: locMr,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("farmer_results").upsert(mapFarmerResultToDb(updated));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateResult error:", err);
        }
      }
    }
    if (idx !== -1) {
      this.localData.results[idx] = updated;
    } else {
      this.localData.results.push(updated);
    }
    await this.recordAudit(`Updated farmer result: ${updated.name.en}`, `\u0936\u0947\u0924\u0915\u0930\u0940 \u092F\u0936\u094B\u0917\u093E\u0925\u093E \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940: ${updated.name.mr}`, "result", performedBy);
    this.persistLocal();
    return updated;
  }
  async deleteResult(id, performedBy) {
    this.loadLocalDatabase();
    const existing = this.localData.results.find((r) => r.id === id);
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("farmer_results").delete().eq("id", id);
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase deleteResult error:", err);
        }
      }
    }
    this.localData.results = this.localData.results.filter((r) => r.id !== id);
    await this.recordAudit(`Deleted farmer result: ${existing?.name.en || id}`, `\u0936\u0947\u0924\u0915\u0930\u0940 \u092F\u0936\u094B\u0917\u093E\u0925\u093E \u0939\u091F\u0935\u0932\u0940: ${existing?.name.mr || id}`, "result", performedBy);
    this.persistLocal();
    return true;
  }
  async reorderResults(orderedIds, performedBy) {
    this.loadLocalDatabase();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
    this.localData.results.forEach((res) => {
      if (orderMap.has(res.id)) {
        res.order = orderMap.get(res.id);
      }
    });
    this.localData.results.sort((a, b) => (a.order || 0) - (b.order || 0));
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          for (let i = 0; i < orderedIds.length; i++) {
            await supabase.from("farmer_results").update({ display_order: i + 1 }).eq("id", orderedIds[i]);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase reorderResults error:", err);
        }
      }
    }
    await this.recordAudit("Reordered farmer results showcase sequence", "\u0936\u0947\u0924\u0915\u0930\u0940 \u092F\u0936\u094B\u0917\u093E\u0925\u093E\u0902\u091A\u0940 \u0915\u094D\u0930\u092E\u0935\u093E\u0930\u0940 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940", "result", performedBy);
    this.persistLocal();
    return this.getResults();
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 8. BUSINESS INFO & OWNER PROFILE
  // ═════════════════════════════════════════════════════════════════════════════
  async getBusinessInfo() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("business_info").select("*").limit(1);
          if (!error && data && data.length > 0) {
            return mapBusinessInfoFromDb(data[0], this.localData.businessInfo || verifiedBusinessInfo);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getBusinessInfo error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return { ...this.localData.businessInfo };
  }
  async updateBusinessInfo(info, performedBy) {
    this.loadLocalDatabase();
    this.localData.businessInfo = { ...this.localData.businessInfo, ...info };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("business_info").upsert(mapBusinessInfoToDb(this.localData.businessInfo));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateBusinessInfo error:", err);
        }
      }
    }
    await this.recordAudit("Updated verified business and contact info", "\u0935\u094D\u092F\u0935\u0938\u093E\u092F \u0935 \u0938\u0902\u092A\u0930\u094D\u0915 \u092E\u093E\u0939\u093F\u0924\u0940 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0940", "contact", performedBy);
    this.persistLocal();
    return this.getBusinessInfo();
  }
  async getOwnerProfile() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("owner_profile").select("*").limit(1);
          if (!error && data && data.length > 0) {
            return mapOwnerProfileFromDb(data[0], this.localData.ownerProfile || ownerProfile);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getOwnerProfile error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return { ...this.localData.ownerProfile };
  }
  async updateOwnerProfile(profile, performedBy) {
    this.loadLocalDatabase();
    const cleanProfile = { ...profile };
    if (cleanProfile.image) {
      cleanProfile.image = saveBase64ImageSync(cleanProfile.image, "owner");
    }
    this.localData.ownerProfile = { ...this.localData.ownerProfile, ...cleanProfile };
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from("owner_profile").upsert(mapOwnerProfileToDb(this.localData.ownerProfile));
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase updateOwnerProfile error:", err);
        }
      }
    }
    await this.recordAudit("Updated founder profile & agronomy credentials", "\u0938\u0902\u0938\u094D\u0925\u093E\u092A\u0915 \u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932 \u0905\u0926\u094D\u092F\u0924\u0928\u093F\u0924 \u0915\u0947\u0932\u0947", "about", performedBy);
    this.persistLocal();
    return this.getOwnerProfile();
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 9. AUDIT LOG
  // ═════════════════════════════════════════════════════════════════════════════
  async getAuditLog() {
    if (isSupabaseServerConfigured()) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data, error } = await supabase.from("admin_audit_logs").select("*").order("timestamp", { ascending: false }).limit(100);
          if (!error && data && data.length > 0) {
            return data.map(mapAuditLogFromDb);
          }
        } catch (err) {
          console.warn("[SERVER_CONTENT_DB] Supabase getAuditLog error:", err);
        }
      }
    }
    this.loadLocalDatabase();
    return [...this.localData.auditLog || []];
  }
  // ═════════════════════════════════════════════════════════════════════════════
  // 10. RESET & BACKUP UTILITIES
  // ═════════════════════════════════════════════════════════════════════════════
  async resetToDefaults(performedBy) {
    this.localData = initDefaultContent();
    await this.recordAudit("Reset all content to verified initial agricultural catalog defaults", "\u0938\u0930\u094D\u0935 \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0938\u0941\u0930\u0941\u0935\u093E\u0924\u0940\u091A\u094D\u092F\u093E \u092A\u094D\u0930\u092E\u093E\u0923\u093F\u0924 \u0938\u094D\u0925\u093F\u0924\u0940\u0924 \u092A\u0941\u0928\u0930\u094D\u0938\u0902\u091A\u092F\u093F\u0924 \u0915\u0947\u0932\u0940", "system", performedBy);
    this.persistLocal();
    return this.getAllContent();
  }
  async importBackup(parsed, performedBy) {
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.products)) {
      return { success: false, error: "Invalid backup file: Missing products array." };
    }
    const sanitized = this.sanitizeImportedContent(parsed);
    this.localData = {
      products: sanitized.products,
      categories: Array.isArray(sanitized.categories) ? sanitized.categories : defaultCategories,
      brands: Array.isArray(sanitized.brands) ? sanitized.brands : [],
      fieldVisits: Array.isArray(sanitized.fieldVisits) ? sanitized.fieldVisits : [],
      fieldExperiences: Array.isArray(sanitized.fieldExperiences) ? sanitized.fieldExperiences : [],
      results: Array.isArray(sanitized.results) ? sanitized.results : [],
      businessInfo: sanitized.businessInfo || verifiedBusinessInfo,
      ownerProfile: sanitized.ownerProfile || ownerProfile,
      auditLog: Array.isArray(sanitized.auditLog) ? sanitized.auditLog : [],
      version: sanitized.version || 4,
      lastModified: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.recordAudit("Restored content database from JSON backup file", "JSON \u092C\u0945\u0915\u0905\u092A\u092E\u0927\u0942\u0928 \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0921\u0947\u091F\u093E\u092C\u0947\u0938 \u092A\u0941\u0928\u0930\u094D\u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0915\u0947\u0932\u093E", "system", performedBy);
    this.persistLocal();
    return { success: true };
  }
  sanitizeImportedContent(parsed) {
    if (!parsed || typeof parsed !== "object") return parsed;
    const cloned = JSON.parse(JSON.stringify(parsed));
    if (Array.isArray(cloned.products)) {
      cloned.products = cloned.products.map((p) => ({
        ...p,
        image: p.image ? saveBase64ImageSync(p.image, "product") : p.image,
        imageUrl: p.imageUrl ? saveBase64ImageSync(p.imageUrl, "product") : p.imageUrl
      }));
    }
    if (Array.isArray(cloned.categories)) {
      cloned.categories = cloned.categories.map((c) => ({
        ...c,
        image: c.image ? saveBase64ImageSync(c.image, "category") : c.image
      }));
    }
    if (Array.isArray(cloned.brands)) {
      cloned.brands = cloned.brands.map((b) => ({
        ...b,
        logo: b.logo ? saveBase64ImageSync(b.logo, "brand") : b.logo
      }));
    }
    if (Array.isArray(cloned.fieldVisits)) {
      cloned.fieldVisits = cloned.fieldVisits.map((v) => ({
        ...v,
        imageSrc: v.imageSrc ? saveBase64ImageSync(v.imageSrc, "visit") : v.imageSrc
      }));
    }
    if (Array.isArray(cloned.results)) {
      cloned.results = cloned.results.map((r) => ({
        ...r,
        image: r.image ? saveBase64ImageSync(r.image, "result") : r.image
      }));
    }
    if (Array.isArray(cloned.fieldExperiences)) {
      cloned.fieldExperiences = cloned.fieldExperiences.map((f) => ({
        ...f,
        image: f.image ? saveBase64ImageSync(f.image, "fieldexp") : f.image
      }));
    }
    if (cloned.ownerProfile?.image) {
      cloned.ownerProfile.image = saveBase64ImageSync(cloned.ownerProfile.image, "owner");
    }
    return cloned;
  }
};
var serverContentDb = new ServerContentDatabase();

// server/contentRoutes.ts
var contentRouter = Router2();
function getParamId(req) {
  const raw = req.params?.id;
  if (Array.isArray(raw)) return raw[0] || "";
  return String(raw || "").trim();
}
function requireAdminAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      errorEn: "Unauthorized: Administrative sign-in required.",
      errorMr: "\u0905\u0928\u0927\u093F\u0915\u0943\u0924: \u092A\u094D\u0930\u0936\u093E\u0938\u0915\u0940\u092F \u0932\u0949\u0917\u093F\u0928 \u0906\u0935\u0936\u094D\u092F\u0915 \u0906\u0939\u0947."
    });
    return;
  }
  const session = serverDb.getSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      errorEn: "Unauthorized: Session expired or invalid.",
      errorMr: "\u0905\u0928\u0927\u093F\u0915\u0943\u0924: \u0938\u0924\u094D\u0930 \u0938\u0902\u092A\u0932\u0947 \u0906\u0939\u0947 \u0915\u093F\u0902\u0935\u093E \u0905\u0935\u0948\u0927 \u0906\u0939\u0947."
    });
    return;
  }
  const admin = serverDb.getAdmin();
  if (!admin || admin.id !== session.userId) {
    res.status(403).json({
      success: false,
      errorEn: "Forbidden: Insufficient privileges.",
      errorMr: "\u0928\u093F\u0937\u093F\u0926\u094D\u0927: \u0905\u092A\u0941\u0930\u0947 \u0905\u0927\u093F\u0915\u093E\u0930."
    });
    return;
  }
  req.adminUser = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    name: admin.name,
    role: admin.role
  };
  req.sessionToken = token;
  next();
}
function requireCsrf(req, res, next) {
  const token = req.sessionToken || getSessionToken(req);
  const session = token ? serverDb.getSession(token) : null;
  if (!session) {
    res.status(401).json({
      success: false,
      errorEn: "Unauthorized: Active session required.",
      errorMr: "\u0905\u0928\u0927\u093F\u0915\u0943\u0924: \u0938\u0915\u094D\u0930\u093F\u092F \u0938\u0924\u094D\u0930 \u0906\u0935\u0936\u094D\u092F\u0915 \u0906\u0939\u0947."
    });
    return;
  }
  const headerCsrf = (req.headers["x-csrf-token"] || req.headers["x-xsrf-token"] || "").trim();
  if (!session.csrfToken || !headerCsrf) {
    res.status(403).json({
      success: false,
      errorEn: "Security check failed: CSRF token missing in request header.",
      errorMr: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u0921\u0924\u093E\u0933\u0923\u0940 \u0905\u092F\u0936\u0938\u094D\u0935\u0940: CSRF \u091F\u094B\u0915\u0928 \u0917\u0939\u093E\u0933 \u0906\u0939\u0947."
    });
    return;
  }
  const a = Buffer.from(session.csrfToken);
  const b = Buffer.from(headerCsrf);
  if (a.length !== b.length || !crypto5.timingSafeEqual(a, b)) {
    res.status(403).json({
      success: false,
      errorEn: "Security check failed: Invalid CSRF token.",
      errorMr: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u0921\u0924\u093E\u0933\u0923\u0940 \u0905\u092F\u0936\u0938\u094D\u0935\u0940: \u0905\u0935\u0948\u0927 CSRF \u091F\u094B\u0915\u0928."
    });
    return;
  }
  next();
}
function sanitizeString(val, maxLen = 5e3) {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}
contentRouter.get("/", async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await serverContentDb.getAllContent();
    const durationMs = Date.now() - startTime;
    console.log(`[DIAGNOSTIC_CONTENT_GET] Path: ${req.originalUrl || req.url} | Status: 200 | Products: ${data?.products?.length ?? 0} | Categories: ${data?.categories?.length ?? 0} | Duration: ${durationMs}ms`);
    res.json({ success: true, data });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : void 0;
    console.error(`[DIAGNOSTIC_CONTENT_GET_ERROR] Path: ${req.originalUrl || req.url} | Status: 500 | Duration: ${durationMs}ms | Error: ${errMsg}`);
    if (errStack) console.error(`[DIAGNOSTIC_CONTENT_GET_STACK]`, errStack);
    res.status(500).json({
      success: false,
      errorEn: "Internal server error while retrieving catalog content.",
      errorMr: "\u0915\u0945\u091F\u0932\u0949\u0917 \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u092E\u093F\u0933\u0935\u0924\u093E\u0928\u093E \u0938\u0930\u094D\u0935\u094D\u0939\u0930 \u0924\u094D\u0930\u0941\u091F\u0940 \u0906\u0932\u0940."
    });
  }
});
contentRouter.post("/reset", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const data = await serverContentDb.resetToDefaults(performedBy);
    res.json({ success: true, messageEn: "Content reset to verified defaults", data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Reset failed: ${msg}` });
  }
});
contentRouter.post("/import", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const result = await serverContentDb.importBackup(req.body, performedBy);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    const all = await serverContentDb.getAllContent();
    res.json({ success: true, data: all });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Import failed: ${msg}` });
  }
});
contentRouter.get("/export", requireAdminAuth, async (_req, res) => {
  try {
    const data = await serverContentDb.getAllContent();
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Export failed: ${msg}` });
  }
});
contentRouter.get("/audit-log", requireAdminAuth, async (_req, res) => {
  try {
    const data = await serverContentDb.getAuditLog();
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Audit log retrieval failed: ${msg}` });
  }
});
contentRouter.get("/products", async (_req, res) => {
  try {
    const products = await serverContentDb.getProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get products: ${msg}` });
  }
});
contentRouter.get("/products/:id", async (req, res) => {
  try {
    const id = getParamId(req);
    const product = await serverContentDb.getProductById(id);
    if (!product) {
      res.status(404).json({ success: false, errorEn: "Product not found" });
      return;
    }
    res.json({ success: true, data: product });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get product: ${msg}` });
  }
});
contentRouter.post("/products", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const body = req.body || {};
    const nameEnglish = sanitizeString(body.nameEnglish, 250);
    const nameMarathi = sanitizeString(body.nameMarathi, 250);
    if (!nameEnglish && !nameMarathi) {
      res.status(400).json({ success: false, errorEn: "Product name in English or Marathi is required" });
      return;
    }
    const created = await serverContentDb.createProduct(body, performedBy);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to create product: ${msg}` });
  }
});
contentRouter.put("/products/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateProduct(id, req.body || {}, performedBy);
    if (!updated) {
      res.status(404).json({ success: false, errorEn: "Product not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update product: ${msg}` });
  }
});
contentRouter.patch("/products/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateProduct(id, req.body || {}, performedBy);
    if (!updated) {
      res.status(404).json({ success: false, errorEn: "Product not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to patch product: ${msg}` });
  }
});
contentRouter.delete("/products/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const deleted = await serverContentDb.deleteProduct(id, performedBy);
    if (!deleted) {
      res.status(404).json({ success: false, errorEn: "Product not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to delete product: ${msg}` });
  }
});
contentRouter.get("/categories", async (_req, res) => {
  try {
    const categories = await serverContentDb.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get categories: ${msg}` });
  }
});
contentRouter.get("/categories/:id", async (req, res) => {
  try {
    const id = getParamId(req);
    const category = await serverContentDb.getCategoryById(id);
    if (!category) {
      res.status(404).json({ success: false, errorEn: "Category not found" });
      return;
    }
    res.json({ success: true, data: category });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get category: ${msg}` });
  }
});
contentRouter.post("/categories", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const body = req.body || {};
    const name = sanitizeString(body.name, 150);
    if (!name) {
      res.status(400).json({ success: false, errorEn: "Category name is required" });
      return;
    }
    const created = await serverContentDb.createCategory(body, performedBy);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to create category: ${msg}` });
  }
});
contentRouter.put("/categories/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateCategory(id, req.body || {}, performedBy);
    if (!updated) {
      res.status(404).json({ success: false, errorEn: "Category not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update category: ${msg}` });
  }
});
contentRouter.patch("/categories/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateCategory(id, req.body || {}, performedBy);
    if (!updated) {
      res.status(404).json({ success: false, errorEn: "Category not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to patch category: ${msg}` });
  }
});
contentRouter.delete("/categories/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const deleted = await serverContentDb.deleteCategory(id, performedBy);
    if (!deleted) {
      res.status(404).json({ success: false, errorEn: "Category not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to delete category: ${msg}` });
  }
});
contentRouter.post("/categories/reorder", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, errorEn: "orderedIds must be an array of category IDs" });
      return;
    }
    const categories = await serverContentDb.reorderCategories(orderedIds, performedBy);
    res.json({ success: true, data: categories });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to reorder categories: ${msg}` });
  }
});
contentRouter.get("/brands", async (_req, res) => {
  try {
    const brands = await serverContentDb.getBrands();
    res.json({ success: true, data: brands });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get brands: ${msg}` });
  }
});
contentRouter.post("/brands", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const created = await serverContentDb.createBrand(req.body || {}, performedBy);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to create brand: ${msg}` });
  }
});
contentRouter.put("/brands/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateBrand(id, req.body || {}, performedBy);
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update brand: ${msg}` });
  }
});
contentRouter.delete("/brands/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const deleted = await serverContentDb.deleteBrand(id, performedBy);
    if (!deleted) {
      res.status(404).json({ success: false, errorEn: "Brand not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to delete brand: ${msg}` });
  }
});
contentRouter.post("/brands/reorder", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, errorEn: "orderedIds must be an array of brand IDs" });
      return;
    }
    const brands = await serverContentDb.reorderBrands(orderedIds, performedBy);
    res.json({ success: true, data: brands });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to reorder brands: ${msg}` });
  }
});
contentRouter.get("/field-visits", async (_req, res) => {
  try {
    const visits = await serverContentDb.getFieldVisits();
    res.json({ success: true, data: visits });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get field visits: ${msg}` });
  }
});
contentRouter.post("/field-visits", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const created = await serverContentDb.createFieldVisit(req.body || {}, performedBy);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to create field visit: ${msg}` });
  }
});
contentRouter.put("/field-visits/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateFieldVisit(id, req.body || {}, performedBy);
    if (!updated) {
      res.status(404).json({ success: false, errorEn: "Field visit not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update field visit: ${msg}` });
  }
});
contentRouter.delete("/field-visits/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const deleted = await serverContentDb.deleteFieldVisit(id, performedBy);
    if (!deleted) {
      res.status(404).json({ success: false, errorEn: "Field visit not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to delete field visit: ${msg}` });
  }
});
contentRouter.post("/field-visits/reorder", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, errorEn: "orderedIds must be an array of visit IDs" });
      return;
    }
    const visits = await serverContentDb.reorderFieldVisits(orderedIds, performedBy);
    res.json({ success: true, data: visits });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to reorder field visits: ${msg}` });
  }
});
contentRouter.get("/field-experiences", async (_req, res) => {
  try {
    const data = await serverContentDb.getFieldExperiences();
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get field experiences: ${msg}` });
  }
});
contentRouter.post("/field-experiences", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const created = await serverContentDb.createFieldExperience(req.body || {}, performedBy);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to create field experience: ${msg}` });
  }
});
contentRouter.put("/field-experiences/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateFieldExperience(id, req.body || {}, performedBy);
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update field experience: ${msg}` });
  }
});
contentRouter.delete("/field-experiences/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const deleted = await serverContentDb.deleteFieldExperience(id, performedBy);
    if (!deleted) {
      res.status(404).json({ success: false, errorEn: "Field experience not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to delete field experience: ${msg}` });
  }
});
contentRouter.get("/results", async (_req, res) => {
  try {
    const results = await serverContentDb.getResults();
    res.json({ success: true, data: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get results: ${msg}` });
  }
});
contentRouter.post("/results", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const created = await serverContentDb.createResult(req.body || {}, performedBy);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to create result: ${msg}` });
  }
});
contentRouter.put("/results/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateResult(id, req.body || {}, performedBy);
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update result: ${msg}` });
  }
});
contentRouter.delete("/results/:id", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const id = getParamId(req);
    const performedBy = req.adminUser?.name || "Administrator";
    const deleted = await serverContentDb.deleteResult(id, performedBy);
    if (!deleted) {
      res.status(404).json({ success: false, errorEn: "Result not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to delete result: ${msg}` });
  }
});
contentRouter.post("/results/reorder", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, errorEn: "orderedIds must be an array of result IDs" });
      return;
    }
    const results = await serverContentDb.reorderResults(orderedIds, performedBy);
    res.json({ success: true, data: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to reorder results: ${msg}` });
  }
});
contentRouter.get("/business-info", async (_req, res) => {
  try {
    const businessInfo = await serverContentDb.getBusinessInfo();
    res.json({ success: true, data: businessInfo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get business info: ${msg}` });
  }
});
contentRouter.put("/business-info", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateBusinessInfo(req.body || {}, performedBy);
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update business info: ${msg}` });
  }
});
contentRouter.get("/owner-profile", async (_req, res) => {
  try {
    const ownerProfile2 = await serverContentDb.getOwnerProfile();
    res.json({ success: true, data: ownerProfile2 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to get owner profile: ${msg}` });
  }
});
contentRouter.put("/owner-profile", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const performedBy = req.adminUser?.name || "Administrator";
    const updated = await serverContentDb.updateOwnerProfile(req.body || {}, performedBy);
    res.json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to update owner profile: ${msg}` });
  }
});
contentRouter.post("/upload", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const { image, dataUrl, prefix = "upload" } = req.body || {};
    const payload = image || dataUrl;
    if (!payload || typeof payload !== "string") {
      res.status(400).json({
        success: false,
        errorEn: "Missing image payload. Please provide a valid Base64 data URL.",
        errorMr: "\u092A\u094D\u0930\u0924\u093F\u092E\u093E \u0921\u0947\u091F\u093E \u0917\u0939\u093E\u0933 \u0906\u0939\u0947. \u0915\u0943\u092A\u092F\u093E \u0935\u0948\u0927 \u092A\u094D\u0930\u0924\u093F\u092E\u093E \u0921\u0947\u091F\u093E \u0928\u093F\u0935\u0921\u093E."
      });
      return;
    }
    const result = await saveBase64Image(payload, String(prefix));
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    const performedBy = req.adminUser?.name || "Administrator";
    await serverContentDb.recordAudit(
      `Uploaded media asset: ${result.filename} (${((result.size || 0) / 1024).toFixed(1)} KB)`,
      `\u092E\u0940\u0921\u093F\u092F\u093E \u092B\u093E\u0907\u0932 \u0905\u092A\u0932\u094B\u0921 \u0915\u0947\u0932\u0940: ${result.filename}`,
      "system",
      performedBy
    );
    res.status(201).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Upload processing failed: ${msg}` });
  }
});
contentRouter.delete("/upload", requireAdminAuth, requireCsrf, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string") {
      res.status(400).json({ success: false, errorEn: "Image URL is required" });
      return;
    }
    const allContent = await serverContentDb.getAllContent();
    const referencedUrls = /* @__PURE__ */ new Set();
    allContent.products?.forEach((p) => {
      if (p.image) referencedUrls.add(p.image);
      if (p.imageUrl) referencedUrls.add(p.imageUrl);
    });
    allContent.categories?.forEach((c) => {
      if (c.image) referencedUrls.add(c.image);
    });
    allContent.brands?.forEach((b) => {
      if (b.logo) referencedUrls.add(b.logo);
    });
    allContent.fieldVisits?.forEach((v) => {
      if (v.imageSrc) referencedUrls.add(v.imageSrc);
    });
    allContent.results?.forEach((r) => {
      if (r.image) referencedUrls.add(r.image);
    });
    allContent.fieldExperiences?.forEach((f) => {
      if (f.image) referencedUrls.add(f.image);
    });
    if (allContent.ownerProfile?.image) referencedUrls.add(allContent.ownerProfile.image);
    if (referencedUrls.has(url)) {
      res.status(409).json({
        success: false,
        errorEn: "Cannot delete image: It is currently assigned to one or more active catalog items.",
        errorMr: "\u092A\u094D\u0930\u0924\u093F\u092E\u093E \u0939\u091F\u0935\u0924\u093E \u092F\u0947\u0924 \u0928\u093E\u0939\u0940: \u0924\u0940 \u0938\u0927\u094D\u092F\u093E \u0907\u0924\u0930 \u0918\u091F\u0915\u093E\u0902\u092E\u0927\u094D\u092F\u0947 \u0935\u093E\u092A\u0930\u093E\u0924 \u0906\u0939\u0947."
      });
      return;
    }
    const deleted = await deleteUploadFile(url);
    if (!deleted) {
      res.status(404).json({ success: false, errorEn: "File not found or cannot be deleted." });
      return;
    }
    res.json({ success: true, messageEn: "Image file removed from server disk." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, errorEn: `Failed to delete file: ${msg}` });
  }
});

// server/translationRoutes.ts
import { Router as Router3 } from "express";

// server/translationService.ts
var ServerTranslationService = class {
  // In-memory cache: key -> { translated, createdAt }
  cache = /* @__PURE__ */ new Map();
  maxCacheSize = 5e3;
  ttlMs = 24 * 60 * 60 * 1e3;
  // 24 hours
  // HTML entity decoder
  decodeHtmlEntities(str) {
    if (!str) return "";
    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/").replace(/&nbsp;/g, " ");
  }
  // Agricultural terminology refinement for natural local phrasing
  refineAgriculturalTranslation(text, targetLang) {
    let refined = this.decodeHtmlEntities(text);
    if (targetLang === "mr") {
      refined = refined.replace(/पाणी\s*-\s*विद्रव्य/gi, "\u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F").replace(/पाणी\s*विद्रव्य/gi, "\u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F").replace(/पाण्यात\s*विद्रव्य/gi, "\u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F").replace(/विद्रव्य/g, "\u0935\u093F\u0926\u094D\u0930\u093E\u0935\u094D\u092F").replace(/कीडनाशक/g, "\u0915\u0940\u091F\u0915\u0928\u093E\u0936\u0915").replace(/बुरशी\s*नाशक/g, "\u092C\u0941\u0930\u0936\u0940\u0928\u093E\u0936\u0915").replace(/तण\s*नाशक/g, "\u0924\u0923\u0928\u093E\u0936\u0915").replace(/बीज\s*उपचार/g, "\u092C\u0940\u091C\u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E").replace(/कंद\s*सड/g, "\u0915\u0902\u0926\u0915\u0941\u091C").replace(/कंद\s*कुज/g, "\u0915\u0902\u0926\u0915\u0941\u091C").replace(/ठिबक\s*ग्रेड/gi, "\u0920\u093F\u092C\u0915 \u0926\u0930\u094D\u091C\u093E");
    } else {
      refined = refined.replace(/(\d+)\s*:\s*(\d+)\s*:\s*(\d+)/g, "$1:$2:$3").replace(/\s+([.,;:!?])/g, "$1");
    }
    return refined.trim();
  }
  getCacheKey(from, to, text) {
    return `${from}:${to}:${text.trim()}`;
  }
  getFromCache(from, to, text) {
    const key = this.getCacheKey(from, to, text);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.translated;
  }
  setInCache(from, to, text, translated) {
    const key = this.getCacheKey(from, to, text);
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      translated,
      createdAt: Date.now()
    });
  }
  getCacheMetrics() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      ttlHours: this.ttlMs / (60 * 60 * 1e3)
    };
  }
  clearCache() {
    this.cache.clear();
  }
  // Tier 1: MyMemory Translation API
  async fetchMyMemory(text, from, to) {
    try {
      const apiKey = process.env.TRANSLATION_API_KEY || process.env.MYMEMORY_KEY || "";
      const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : "";
      const emailParam = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : "";
      const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}${keyParam}${emailParam}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7e3);
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Baliraja-Krishi-Translation-Proxy/1.0"
        }
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
          const raw = data.responseData.translatedText;
          if (typeof raw === "string" && !raw.startsWith("MYMEMORY WARNING:")) {
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
  async fetchGoogleFallback(text, from, to) {
    try {
      const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6e3);
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((chunk) => Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : "").join("");
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
  async translateText(text, from = "en", to = "mr") {
    const trimmed = text.trim();
    if (!trimmed) {
      return { text: "", cached: false };
    }
    if (from === to) {
      return { text: trimmed, cached: false };
    }
    const cached = this.getFromCache(from, to, trimmed);
    if (cached !== null) {
      return { text: cached, cached: true };
    }
    const tier1 = await this.fetchMyMemory(trimmed, from, to);
    if (tier1) {
      this.setInCache(from, to, trimmed, tier1);
      return { text: tier1, cached: false };
    }
    const tier2 = await this.fetchGoogleFallback(trimmed, from, to);
    if (tier2) {
      this.setInCache(from, to, trimmed, tier2);
      return { text: tier2, cached: false };
    }
    throw new Error("Translation upstream providers unavailable.");
  }
  /**
   * Translate array of strings (batch) with individual fallback resilience
   */
  async translateBatch(texts, from = "en", to = "mr") {
    let allCached = true;
    const results = [];
    for (const t of texts) {
      const trimmed = t.trim();
      if (!trimmed || from === to) {
        results.push(trimmed);
        continue;
      }
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
        results.push(trimmed);
      }
    }
    return { texts: results, allCached };
  }
};
var serverTranslationService = new ServerTranslationService();

// server/translationRoutes.ts
var translationRouter = Router3();
var translationRateLimits = {};
var RATE_LIMIT_WINDOW_MS = 60 * 1e3;
var MAX_REQUESTS_PER_WINDOW = 60;
function checkTranslationRateLimit(ip) {
  const now = Date.now();
  const record = translationRateLimits[ip];
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    translationRateLimits[ip] = { count: 1, windowStart: now };
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetMs: RATE_LIMIT_WINDOW_MS };
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetMs2 = RATE_LIMIT_WINDOW_MS - (now - record.windowStart);
    return { allowed: false, remaining: 0, resetMs: resetMs2 };
  }
  record.count += 1;
  const remaining = MAX_REQUESTS_PER_WINDOW - record.count;
  const resetMs = RATE_LIMIT_WINDOW_MS - (now - record.windowStart);
  return { allowed: true, remaining, resetMs };
}
function isValidLanguage(lang) {
  return lang === "en" || lang === "mr";
}
translationRouter.post("/", async (req, res) => {
  const clientIp = getClientIp(req);
  const rateLimit = checkTranslationRateLimit(clientIp);
  res.setHeader("X-RateLimit-Limit", String(MAX_REQUESTS_PER_WINDOW));
  res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetMs / 1e3)));
  if (!rateLimit.allowed) {
    res.status(429).json({
      success: false,
      errorEn: "Too many translation requests. Please slow down.",
      errorMr: "\u0905\u0928\u0941\u0935\u093E\u0926 \u0935\u093F\u0928\u0902\u0924\u094D\u092F\u093E\u0902\u091A\u0940 \u092E\u0930\u094D\u092F\u093E\u0926\u093E \u0913\u0932\u093E\u0902\u0921\u0932\u0940. \u0915\u0943\u092A\u092F\u093E \u0925\u094B\u0921\u093E \u0935\u0947\u0933 \u0925\u093E\u0902\u092C\u0942\u0928 \u092A\u0941\u0928\u094D\u0939\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928 \u0915\u0930\u093E."
    });
    return;
  }
  const { text, texts, from = "en", to = "mr" } = req.body || {};
  if (!isValidLanguage(from) || !isValidLanguage(to)) {
    res.status(400).json({
      success: false,
      errorEn: "Invalid language parameters. Supported languages are 'en' and 'mr'.",
      errorMr: "\u0905\u0935\u0948\u0927 \u092D\u093E\u0937\u093E \u092A\u0930\u094D\u092F\u093E\u092F. \u092B\u0915\u094D\u0924 \u0907\u0902\u0917\u094D\u0930\u091C\u0940 (en) \u0935 \u092E\u0930\u093E\u0920\u0940 (mr) \u0938\u092E\u0930\u094D\u0925\u093F\u0924 \u0906\u0939\u0947\u0924."
    });
    return;
  }
  if (typeof text === "string") {
    if (text.length > 5e3) {
      res.status(400).json({
        success: false,
        errorEn: "Text too large. Maximum length is 5,000 characters per request.",
        errorMr: "\u092E\u091C\u0915\u0942\u0930 \u0916\u0942\u092A \u092E\u094B\u0920\u093E \u0906\u0939\u0947. \u0915\u092E\u093E\u0932 \u092E\u0930\u094D\u092F\u093E\u0926\u093E \u096B,\u0966\u0966\u0966 \u0905\u0915\u094D\u0937\u0930\u0947 \u0906\u0939\u0947."
      });
      return;
    }
    try {
      const result = await serverTranslationService.translateText(text, from, to);
      res.setHeader("X-Cache", result.cached ? "HIT" : "MISS");
      res.json({
        success: true,
        text: result.text,
        cached: result.cached
      });
      return;
    } catch {
      res.status(503).json({
        success: false,
        errorEn: "Translation service is temporarily unreachable.",
        errorMr: "\u0905\u0928\u0941\u0935\u093E\u0926 \u0938\u0947\u0935\u093E \u0938\u0927\u094D\u092F\u093E \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u0915\u093E\u0939\u0940 \u0935\u0947\u0933\u093E\u0928\u0947 \u092A\u0941\u0928\u094D\u0939\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928 \u0915\u0930\u093E."
      });
      return;
    }
  }
  if (Array.isArray(texts)) {
    if (texts.length > 50) {
      res.status(400).json({
        success: false,
        errorEn: "Batch limit exceeded. Maximum 50 items allowed per batch.",
        errorMr: "\u0924\u0941\u0915\u0921\u094D\u092F\u093E\u0902\u091A\u0940 \u092E\u0930\u094D\u092F\u093E\u0926\u093E \u0913\u0932\u093E\u0902\u0921\u0932\u0940. \u090F\u0915\u093E\u091A \u0935\u0947\u0933\u0940 \u091C\u093E\u0938\u094D\u0924\u0940\u0924 \u091C\u093E\u0938\u094D\u0924 \u096B\u0966 \u0906\u092F\u091F\u092E \u0938\u092E\u0930\u094D\u0925\u093F\u0924 \u0906\u0939\u0947\u0924."
      });
      return;
    }
    for (let i = 0; i < texts.length; i++) {
      if (typeof texts[i] !== "string" || texts[i].length > 2e3) {
        res.status(400).json({
          success: false,
          errorEn: `Invalid text item at index ${i}. Each item must be a string under 2,000 characters.`,
          errorMr: "\u0905\u0935\u0948\u0927 \u092E\u091C\u0915\u0942\u0930 \u0906\u092F\u091F\u092E \u0906\u0922\u0933\u0932\u093E."
        });
        return;
      }
    }
    try {
      const result = await serverTranslationService.translateBatch(texts, from, to);
      res.setHeader("X-Cache", result.allCached ? "HIT" : "MISS");
      res.json({
        success: true,
        texts: result.texts,
        allCached: result.allCached
      });
      return;
    } catch {
      res.status(503).json({
        success: false,
        errorEn: "Translation service is temporarily unreachable.",
        errorMr: "\u0905\u0928\u0941\u0935\u093E\u0926 \u0938\u0947\u0935\u093E \u0938\u0927\u094D\u092F\u093E \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u093E\u0939\u0940. \u0915\u0943\u092A\u092F\u093E \u0915\u093E\u0939\u0940 \u0935\u0947\u0933\u093E\u0928\u0947 \u092A\u0941\u0928\u094D\u0939\u093E \u092A\u094D\u0930\u092F\u0924\u094D\u0928 \u0915\u0930\u093E."
      });
      return;
    }
  }
  res.status(400).json({
    success: false,
    errorEn: "Missing 'text' or 'texts' in request body.",
    errorMr: "\u0905\u0928\u0941\u0935\u093E\u0926\u093E\u0938\u093E\u0920\u0940 \u092E\u091C\u0915\u0942\u0930 \u0906\u0935\u0936\u094D\u092F\u0915 \u0906\u0939\u0947."
  });
});
translationRouter.get("/health", (_req, res) => {
  const metrics = serverTranslationService.getCacheMetrics();
  res.json({
    success: true,
    service: "baliraja-translation-proxy",
    status: "operational",
    supportedLanguages: ["en", "mr"],
    cache: metrics
  });
});

// server/index.ts
dotenv2.config();
var app = express();
var PORT = process.env.PORT || 3001;
var isProd = process.env.NODE_ENV === "production";
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
} else if (process.env.TRUST_PROXY) {
  app.set("trust proxy", process.env.TRUST_PROXY);
}
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'"
          // Permitted for bundler dev builds
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "http:"
        ],
        mediaSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:"
        ],
        connectSrc: [
          "'self'",
          "http://localhost:*",
          "http://127.0.0.1:*",
          "ws://localhost:*",
          "ws://127.0.0.1:*",
          "https://*.supabase.co",
          "https://*.supabase.in",
          "https://api.mymemory.translated.net",
          "https://translate.googleapis.com",
          "https://*.tile.openstreetmap.fr",
          "https://*.openstreetmap.fr",
          "https://*.basemaps.cartocdn.com",
          "https://basemaps.cartocdn.com",
          "https://*.cartocdn.com"
        ],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProd && process.env.APP_URL?.startsWith("https") ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: isProd && (process.env.APP_URL?.startsWith("https") || process.env.ENABLE_HSTS === "true") ? { maxAge: 31536e3, includeSubDomains: true, preload: true } : false
  })
);
var allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  process.env.APP_URL,
  process.env.VITE_APP_URL,
  ...process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : []
].filter((url) => Boolean(url && typeof url === "string" && url.trim()));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || typeof origin === "string" && origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-session-token", "x-csrf-token", "x-xsrf-token"]
}));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(["/api/auth", "/auth"], authRouter);
app.use(["/api/content", "/content"], contentRouter);
app.use(["/api/translate", "/translate"], translationRouter);
app.get(["/api/health", "/health"], (_req, res) => {
  res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get(["/uploads/:filename", "/api/uploads/:filename"], (req, res) => {
  const rawParam = req.params.filename;
  const filename = path4.basename(Array.isArray(rawParam) ? rawParam[0] : rawParam || "");
  const filePath = path4.join(UPLOADS_DIR, filename);
  if (!path4.resolve(filePath).startsWith(UPLOADS_DIR)) {
    res.status(403).json({ error: "Access denied: Path traversal attempt detected." });
    return;
  }
  if (!fs4.existsSync(filePath)) {
    res.status(404).json({ error: "Image not found." });
    return;
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  res.sendFile(filePath);
});
app.use((err, req, res, _next) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error(`[SERVER_GLOBAL_ERROR] Method: ${req.method} | URL: ${req.originalUrl || req.url} | Error: ${errMsg}`);
  if (err instanceof Error && err.stack) {
    console.error(`[SERVER_GLOBAL_ERROR_STACK]`, err.stack);
  }
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      errorEn: "An unexpected internal server error occurred.",
      errorMr: "\u0938\u0930\u094D\u0935\u094D\u0939\u0930\u0935\u0930 \u0905\u0928\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u0924\u094D\u0930\u0941\u091F\u0940 \u0906\u0932\u0940."
    });
  }
});
var isDirectExecution = process.argv[1]?.replace(/\\/g, "/").endsWith("server/index.ts") || process.env.RUN_SERVER === "true";
if (isDirectExecution && process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    const status = serverAuthService.getAuthStatus();
    console.log(`====================================================`);
    console.log(`\u{1F680} Baliraja Admin Auth Backend Server running on port ${PORT}`);
    console.log(`   Admin ID: ${status.adminId}`);
    console.log(`   Registered Email: ${status.email}`);
    console.log(`   Email Provider Configured: ${status.emailProviderConfigured ? "YES" : "NO"}`);
    console.log(`====================================================`);
  });
}
var index_default = app;
export {
  index_default as default
};
