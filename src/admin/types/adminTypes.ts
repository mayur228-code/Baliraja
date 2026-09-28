export interface AdminUser {
  id: string;
  username: string;
  role: 'admin';
  name: string;
  lastLoginAt?: string;
}

export interface AdminSession {
  token?: string;
  user: AdminUser;
  csrfToken?: string;
  expiresAt?: number; // Unix timestamp in ms
}

export type AdminSection = 
  | 'overview' 
  | 'products' 
  | 'categories'
  | 'brands'
  | 'field-visits'
  | 'our-results'
  | 'field-experience' 
  | 'about' 
  | 'contact-location' 
  | 'settings';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actionEn: string;
  actionMr: string;
  itemType: 'product' | 'category' | 'brand' | 'field-visit' | 'our-results' | 'result' | 'field-experience' | 'about' | 'contact' | 'system';
  performedBy: string;
}
