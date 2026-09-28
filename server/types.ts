export interface ServerAdminUser {
  id: 'admin-01';
  username: 'admin';
  email: string;
  passwordHash: string; // bcrypt hash ($2a$10$...)
  name: string;
  role: 'admin';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface ServerResetToken {
  token: string; // 64-hex-char cryptographically random token
  email: string;
  expiresAt: number; // Unix timestamp ms
  used: boolean;
  createdAt: number;
  ip?: string;
}

export interface ServerSession {
  sessionToken: string;
  csrfToken?: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface ServerAuthDatabase {
  admin: ServerAdminUser;
  resetTokens: ServerResetToken[];
  sessions: ServerSession[];
  rateLimits: Record<string, number[]>; // IP/identifier -> timestamps
  version: number;
}
