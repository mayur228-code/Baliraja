import type { AdminUser } from '../types/adminTypes';

/**
 * BALIRAJA KRISHI SEVA KENDRA — Server-Side Admin Authentication Client (HttpOnly Cookie Mode)
 * 
 * Secure client connected directly to the backend API (/api/auth/*) using:
 * - Server-managed HttpOnly & SameSite=Strict cookies for session management (mitigating XSS token theft)
 * - Cryptographic Anti-CSRF token verification on state-changing requests
 * - Zero storage of session tokens in sessionStorage or localStorage
 */

const LEGACY_STORAGE_KEY = 'baliraja_admin_session_v1';

interface ServerStatusResponse {
  success: boolean;
  adminId: string;
  username: string;
  email: string;
  emailProviderConfigured: boolean;
}

type AuthChangeListener = (isAuthenticated: boolean) => void;
type EmailChangeListener = (email: string) => void;

class AuthService {
  private currentUser: AdminUser | null = null;
  private csrfToken: string = '';
  private cachedAdminEmail: string = '';
  private isEmailProviderConfigured: boolean = false;
  private isCheckingSession: boolean = false;
  private sessionCheckPromise: Promise<boolean> | null = null;
  private authListeners: Set<AuthChangeListener> = new Set();
  private emailListeners: Set<EmailChangeListener> = new Set();

  constructor() {
    this.cleanLegacyStorage();
    this.fetchServerStatus();
    this.checkSession();
  }

  private cleanLegacyStorage(): void {
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  public subscribeToAuth(listener: AuthChangeListener): () => void {
    this.authListeners.add(listener);
    listener(this.isAuthenticated());
    return () => this.authListeners.delete(listener);
  }

  private notifyAuthChange(isAuthenticated: boolean): void {
    this.authListeners.forEach((listener) => listener(isAuthenticated));
  }

  public subscribeToEmail(listener: EmailChangeListener): () => void {
    this.emailListeners.add(listener);
    if (this.cachedAdminEmail) {
      listener(this.cachedAdminEmail);
    }
    return () => this.emailListeners.delete(listener);
  }

  private notifyEmailChange(email: string): void {
    const clean = email.toLowerCase().trim();
    this.cachedAdminEmail = clean;
    this.emailListeners.forEach((listener) => listener(clean));
  }

  /**
   * Check active server session via HttpOnly cookie.
   */
  public async checkSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.sessionCheckPromise) return this.sessionCheckPromise;

    this.isCheckingSession = true;
    this.sessionCheckPromise = (async () => {
      try {
        const res = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.authenticated && data.user) {
            this.currentUser = {
              id: data.user.id || 'admin-01',
              username: data.user.username || 'admin',
              role: 'admin',
              name: data.user.name || 'Baliraja Administrator',
              lastLoginAt: data.user.lastLoginAt
            };
            this.csrfToken = data.csrfToken || '';
            if (data.user.email) {
              this.notifyEmailChange(data.user.email);
            }
            this.notifyAuthChange(true);
            return true;
          }
        }

        this.currentUser = null;
        this.csrfToken = '';
        this.notifyAuthChange(false);
        return false;
      } catch {
        this.currentUser = null;
        this.csrfToken = '';
        this.notifyAuthChange(false);
        return false;
      } finally {
        this.isCheckingSession = false;
        this.sessionCheckPromise = null;
      }
    })();

    return this.sessionCheckPromise;
  }

  public async fetchServerStatus(): Promise<{ email: string; emailProviderConfigured: boolean }> {
    if (typeof window === 'undefined') {
      return { email: this.cachedAdminEmail, emailProviderConfigured: this.isEmailProviderConfigured };
    }
    try {
      const res = await fetch('/api/auth/status', { credentials: 'include' });
      if (res.ok) {
        const data: ServerStatusResponse = await res.json();
        if (data.success && data.email) {
          const email = data.email.toLowerCase().trim();
          this.isEmailProviderConfigured = Boolean(data.emailProviderConfigured);
          this.notifyEmailChange(email);
          return { email, emailProviderConfigured: this.isEmailProviderConfigured };
        }
      }
    } catch {
      // Server may be starting or offline
    }
    return { email: this.cachedAdminEmail, emailProviderConfigured: this.isEmailProviderConfigured };
  }

  public async fetchAdminEmail(): Promise<string> {
    const status = await this.fetchServerStatus();
    return status.email || this.cachedAdminEmail;
  }

  public getAdminEmail(): string {
    return this.cachedAdminEmail;
  }

  public getEmailProviderStatus(): boolean {
    return this.isEmailProviderConfigured;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.currentUser);
  }

  public getUser(): AdminUser | null {
    return this.currentUser;
  }

  public getCsrfToken(): string {
    return this.csrfToken;
  }

  public isChecking(): boolean {
    return this.isCheckingSession;
  }

  /**
   * Authenticate admin credentials against the secure backend server.
   * Server responds with an HttpOnly session cookie and Anti-CSRF token.
   */
  public async login(
    username: string,
    passcode: string
  ): Promise<{ success: boolean; errorEn?: string; errorMr?: string }> {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = passcode.trim();

    if (!trimmedUser || !trimmedPass) {
      return {
        success: false,
        errorEn: 'Please enter both username/email and administrative passcode.',
        errorMr: 'कृपया वापरकर्ता नाव/ईमेल आणि प्रशासकीय संकेतांक प्रविष्ट करा.'
      };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: trimmedUser,
          passcode: trimmedPass
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          errorEn: data.errorEn || 'Unable to sign in. Please check your credentials and try again.',
          errorMr: data.errorMr || 'प्रवेश करता आला नाही. कृपया आपली माहिती तपासा आणि पुन्हा प्रयत्न करा.'
        };
      }

      this.currentUser = {
        id: data.user?.id || 'admin-01',
        username: data.user?.username || 'admin',
        role: 'admin',
        name: data.user?.name || 'Baliraja Administrator',
        lastLoginAt: data.user?.lastLoginAt || new Date().toISOString()
      };
      this.csrfToken = data.csrfToken || '';

      if (data.user?.email) {
        this.notifyEmailChange(data.user.email);
      }

      this.notifyAuthChange(true);
      return { success: true };
    } catch {
      return {
        success: false,
        errorEn: 'Unable to connect to authentication server. Please verify backend service is running.',
        errorMr: 'प्रमाणीकरण सर्व्हरशी संपर्क होऊ शकला नाही. कृपया सर्व्हर सुरू असल्याचे तपासा.'
      };
    }
  }

  /**
   * Request password reset from the backend server.
   * Server generates a secure token and sends a real reset email through configured SMTP.
   */
  public async requestPasswordReset(identifier: string): Promise<{
    success: boolean;
    errorEn?: string;
    errorMr?: string;
    messageEn?: string;
    messageMr?: string;
    emailSent?: boolean;
    providerConfigured?: boolean;
  }> {
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      return {
        success: false,
        errorEn: 'Please enter your registered administrator email address.',
        errorMr: 'कृपया आपला नोंदणीकृत प्रशासकीय ईमेल प्रविष्ट करा.'
      };
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: trimmed
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          errorEn: data.errorEn || 'Failed to process password reset request.',
          errorMr: data.errorMr || 'पासवर्ड रीसेट विनंती पूर्ण करता आली नाही.',
          providerConfigured: Boolean(data.providerConfigured),
          emailSent: false
        };
      }

      return {
        success: true,
        messageEn: data.messageEn,
        messageMr: data.messageMr,
        emailSent: Boolean(data.emailSent),
        providerConfigured: Boolean(data.providerConfigured)
      };
    } catch {
      return {
        success: false,
        errorEn: 'Failed to connect to backend password reset service.',
        errorMr: 'पासवर्ड रीसेट सेवेशी संपर्क साधता आला नाही.'
      };
    }
  }

  /**
   * Validate if a reset token is valid and active on the server.
   */
  public async validateResetToken(token: string): Promise<{
    valid: boolean;
    errorEn?: string;
    errorMr?: string;
  }> {
    const trimmed = (token || '').trim();
    if (!trimmed) {
      return {
        valid: false,
        errorEn: 'Please provide a valid password reset token.',
        errorMr: 'कृपया वैध रीसेट टोकन द्या.'
      };
    }

    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: trimmed
        })
      });

      const data = await response.json();
      if (!response.ok || !data.valid) {
        return {
          valid: false,
          errorEn: data.errorEn || 'Invalid or expired password reset link.',
          errorMr: data.errorMr || 'अवैध किंवा मुदत संपलेली पासवर्ड रीसेट लिंक.'
        };
      }

      return { valid: true };
    } catch {
      return {
        valid: false,
        errorEn: 'Failed to validate reset token with server.',
        errorMr: 'सर्व्हरसह रीसेट टोकन तपासण्यात त्रुटी आली.'
      };
    }
  }

  /**
   * Set new password using validated reset token via the backend server.
   */
  public async resetPasswordWithToken(
    token: string,
    newPasscode: string
  ): Promise<{ success: boolean; errorEn?: string; errorMr?: string }> {
    const trimmedPass = newPasscode.trim();
    const trimmedToken = token.trim();

    if (trimmedPass.length < 12) {
      return {
        success: false,
        errorEn: 'New password must be at least 12 characters long.',
        errorMr: 'नवीन पासवर्ड किमान १२ अक्षरांचा असावा.'
      };
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: trimmedToken,
          newPassword: trimmedPass
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          errorEn: data.errorEn || 'Failed to update password on server.',
          errorMr: data.errorMr || 'सर्व्हरवर पासवर्ड अद्यतनित करण्यात त्रुटी आली.'
        };
      }

      // Clear any client session state
      this.logout();

      return { success: true };
    } catch {
      return {
        success: false,
        errorEn: 'Failed to communicate with authentication server.',
        errorMr: 'प्रमाणीकरण सर्व्हरशी संपर्क करण्यात त्रुटी आली.'
      };
    }
  }

  /**
   * Change admin registered email on the backend server (requires HttpOnly cookie, CSRF token, and current password).
   */
  public async changeAdminEmail(
    currentPasscode: string,
    newEmail: string
  ): Promise<{ success: boolean; errorEn?: string; errorMr?: string; email?: string }> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        errorEn: 'You must be signed in to change the administrator email.',
        errorMr: 'प्रशासकीय ईमेल बदलण्यासाठी आपण लॉगिन केलेले असणे आवश्यक आहे.'
      };
    }

    const trimmedPass = currentPasscode.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();

    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken
        },
        body: JSON.stringify({
          currentPassword: trimmedPass,
          newEmail: trimmedEmail
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          errorEn: data.errorEn || 'Failed to update email on server.',
          errorMr: data.errorMr || 'सर्व्हरवर ईमेल अद्यतनित करण्यात त्रुटी आली.'
        };
      }

      const cleanEmail = data.email.toLowerCase().trim();
      this.notifyEmailChange(cleanEmail);
      return { success: true, email: cleanEmail };
    } catch {
      return {
        success: false,
        errorEn: 'Failed to communicate with server while updating email.',
        errorMr: 'ईमेल बदलताना सर्व्हरशी संपर्क साधता आला नाही.'
      };
    }
  }

  /**
   * Change password on the backend server (requires HttpOnly cookie, CSRF token, and current password).
   */
  public async changePassword(
    currentPasscode: string,
    newPasscode: string
  ): Promise<{ success: boolean; errorEn?: string; errorMr?: string }> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        errorEn: 'You must be signed in to change your password.',
        errorMr: 'पासवर्ड बदलण्यासाठी आपण लॉगिन केलेले असणे आवश्यक आहे.'
      };
    }

    const trimmedCurrent = currentPasscode.trim();
    const trimmedNew = newPasscode.trim();

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken
        },
        body: JSON.stringify({
          currentPassword: trimmedCurrent,
          newPassword: trimmedNew
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          errorEn: data.errorEn || 'Failed to change password on server.',
          errorMr: data.errorMr || 'सर्व्हरवर पासवर्ड बदलण्यात त्रुटी आली.'
        };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        errorEn: 'Failed to communicate with server while changing password.',
        errorMr: 'पासवर्ड बदलताना सर्व्हरशी संपर्क साधता आला नाही.'
      };
    }
  }

  /**
   * Terminate active session locally and on the server.
   */
  public logout(): void {
    const activeCsrf = this.csrfToken;
    this.currentUser = null;
    this.csrfToken = '';
    this.notifyAuthChange(false);

    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'x-csrf-token': activeCsrf
      }
    }).catch(() => {
      // ignore network error on logout
    });
  }
}

export const authService = new AuthService();
