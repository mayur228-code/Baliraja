import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { serverDb } from './db';
import { sendPasswordResetEmail, isEmailProviderConfigured } from './email';

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 Hours
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 Minutes

export class ServerAuthService {
  /**
   * Authenticate admin credentials on the server using bcrypt.
   */
  public async login(
    usernameOrEmail: string,
    passcode: string,
    clientIp: string = '127.0.0.1'
  ): Promise<{
    success: boolean;
    sessionToken?: string;
    csrfToken?: string;
    token?: string;
    user?: {
      id: string;
      username: string;
      email: string;
      name: string;
      role: string;
      lastLoginAt?: string;
    };
    errorEn?: string;
    errorMr?: string;
  }> {
    const trimmedUser = usernameOrEmail.trim().toLowerCase();
    const trimmedPass = passcode.trim();

    if (!trimmedUser || !trimmedPass) {
      return {
        success: false,
        errorEn: 'Please enter both username/email and administrative passcode.',
        errorMr: 'कृपया वापरकर्ता नाव/ईमेल आणि प्रशासकीय संकेतांक प्रविष्ट करा.'
      };
    }

    // Rate limiting: 10 attempts per 10 minutes per IP
    const isAllowed = serverDb.checkRateLimit(`login_${clientIp}`, 10, 10 * 60 * 1000);
    if (!isAllowed) {
      return {
        success: false,
        errorEn: 'Too many login attempts. Please wait 10 minutes before trying again.',
        errorMr: 'प्रवेश करण्याचे अनेक अयशस्वी प्रयत्न झाले आहेत. कृपया १० मिनिटे प्रतीक्षा करा.'
      };
    }

    const admin = serverDb.getAdmin();
    const isUserMatch =
      trimmedUser === admin.username.toLowerCase() ||
      trimmedUser === admin.email.toLowerCase();

    if (!isUserMatch) {
      return {
        success: false,
        errorEn: 'Unable to sign in. Please check your credentials and try again.',
        errorMr: 'प्रवेश करता आला नाही. कृपया आपली माहिती तपासा आणि पुन्हा प्रयत्न करा.'
      };
    }

    const isPassMatch = await bcrypt.compare(trimmedPass, admin.passwordHash);
    if (!isPassMatch) {
      return {
        success: false,
        errorEn: 'Unable to sign in. Please check your credentials and try again.',
        errorMr: 'प्रवेश करता आला नाही. कृपया आपली माहिती तपासा आणि पुन्हा प्रयत्न करा.'
      };
    }

    // Update last login timestamp
    serverDb.updateLastLogin();

    // Generate secure session token and cryptographically random CSRF token
    const sessionToken = `baliraja_adm_${crypto.randomBytes(32).toString('hex')}`;
    const csrfToken = crypto.randomBytes(32).toString('hex');
    serverDb.createSession(sessionToken, admin.id, SESSION_TTL_MS, csrfToken);

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
        lastLoginAt: new Date().toISOString()
      }
    };
  }

  /**
   * Retrieve active session object from database.
   */
  public getSession(token: string) {
    if (!token) return null;
    return serverDb.getSession(token);
  }

  /**
   * Validate session token from Authorization header or cookie.
   */
  public getSessionUser(token: string) {
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
  public logout(token: string): boolean {
    if (!token) return false;
    serverDb.deleteSession(token);
    return true;
  }

  /**
   * Change administrator registered email. Requires valid session + current password.
   */
  public async changeEmail(
    sessionToken: string,
    currentPasscode: string,
    newEmail: string
  ): Promise<{ success: boolean; email?: string; errorEn?: string; errorMr?: string }> {
    const user = this.getSessionUser(sessionToken);
    if (!user) {
      return {
        success: false,
        errorEn: 'Unauthorized session. Please sign in again.',
        errorMr: 'अनधिकृत सत्र. कृपया पुन्हा लॉगिन करा.'
      };
    }

    const trimmedPass = currentPasscode.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedPass) {
      return {
        success: false,
        errorEn: 'Please enter your current administrator password.',
        errorMr: 'कृपया आपला सध्याचा प्रशासकीय पासवर्ड प्रविष्ट करा.'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return {
        success: false,
        errorEn: 'Please enter a valid email address (e.g. name@example.com).',
        errorMr: 'कृपया वैध ईमेल पत्ता प्रविष्ट करा (उदा. name@example.com).'
      };
    }

    const admin = serverDb.getAdmin();
    if (trimmedEmail === admin.email.toLowerCase()) {
      return {
        success: false,
        errorEn: 'New email cannot be identical to your current registered email.',
        errorMr: 'नवीन ईमेल सध्याच्या नोंदणीकृत ईमेलसारखाच असू शकत नाही.'
      };
    }

    const isPassMatch = await bcrypt.compare(trimmedPass, admin.passwordHash);
    if (!isPassMatch) {
      return {
        success: false,
        errorEn: 'Current administrator password is incorrect.',
        errorMr: 'सध्याचा प्रशासकीय पासवर्ड चुकीचा आहे.'
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
  public async changePassword(
    sessionToken: string,
    currentPasscode: string,
    newPasscode: string
  ): Promise<{ success: boolean; errorEn?: string; errorMr?: string }> {
    const user = this.getSessionUser(sessionToken);
    if (!user) {
      return {
        success: false,
        errorEn: 'Unauthorized session. Please sign in again.',
        errorMr: 'अनधिकृत सत्र. कृपया पुन्हा लॉगिन करा.'
      };
    }

    const trimmedCurrent = currentPasscode.trim();
    const trimmedNew = newPasscode.trim();

    if (!trimmedCurrent) {
      return {
        success: false,
        errorEn: 'Please enter your current password.',
        errorMr: 'कृपया आपला सध्याचा पासवर्ड प्रविष्ट करा.'
      };
    }

    if (trimmedNew.length < 12) {
      return {
        success: false,
        errorEn: 'New password must be at least 12 characters long.',
        errorMr: 'नवीन पासवर्ड किमान १२ अक्षरांचा असावा.'
      };
    }

    if (trimmedCurrent === trimmedNew) {
      return {
        success: false,
        errorEn: 'New password cannot be the same as your current password.',
        errorMr: 'नवीन पासवर्ड सध्याच्या पासवर्डसारखाच असू शकत नाही.'
      };
    }

    const admin = serverDb.getAdmin();
    const isPassMatch = await bcrypt.compare(trimmedCurrent, admin.passwordHash);
    if (!isPassMatch) {
      return {
        success: false,
        errorEn: 'Current administrator password is incorrect.',
        errorMr: 'सध्याचा प्रशासकीय पासवर्ड चुकीचा आहे.'
      };
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(trimmedNew, salt);
    serverDb.updateAdminPasswordHash(newHash);

    console.log(`[SERVER_AUTH] Admin password updated successfully.`);
    return { success: true };
  }

  /**
   * Request password reset token. Rate limited, generates crypto token, sends email.
   */
  public async forgotPassword(
    identifier: string,
    clientIp: string = '127.0.0.1'
  ): Promise<{
    success: boolean;
    messageEn: string;
    messageMr: string;
    emailSent: boolean;
    providerConfigured: boolean;
    errorEn?: string;
    errorMr?: string;
  }> {
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) {
      return {
        success: false,
        messageEn: 'Please enter your registered email address.',
        messageMr: 'कृपया आपला नोंदणीकृत ईमेल प्रविष्ट करा.',
        emailSent: false,
        providerConfigured: isEmailProviderConfigured(),
        errorEn: 'Please enter your registered email address.',
        errorMr: 'कृपया आपला नोंदणीकृत ईमेल प्रविष्ट करा.'
      };
    }

    // Rate limiting: 5 requests per 15 minutes per IP
    const isAllowed = serverDb.checkRateLimit(`forgot_${clientIp}`, 5, 15 * 60 * 1000);
    if (!isAllowed) {
      return {
        success: false,
        messageEn: 'Too many reset requests. Please wait 15 minutes before trying again.',
        messageMr: 'वारंवार पासवर्ड रीसेट विनंत्या आल्या आहेत. कृपया १५ मिनिटे प्रतीक्षा करा.',
        emailSent: false,
        providerConfigured: isEmailProviderConfigured(),
        errorEn: 'Too many password reset requests. Please wait a few minutes.',
        errorMr: 'वारंवार पासवर्ड रीसेट विनंत्या आल्या आहेत. कृपया काही मिनिटे प्रतीक्षा करा.'
      };
    }

    // Check if email provider is configured in environment
    if (!isEmailProviderConfigured()) {
      console.warn(`[SERVER_AUTH] Password reset requested for ${trimmed}, but SMTP is not configured in .env.`);
      return {
        success: false,
        messageEn: 'Password reset email service is not configured. Please contact the administrator.',
        messageMr: 'पासवर्ड रीसेट ईमेल सेवा कॉन्फिगर केलेली नाही. कृपया प्रशासकाशी संपर्क साधा.',
        providerConfigured: false,
        emailSent: false,
        errorEn: 'Password reset email service is not configured. Please contact the administrator.',
        errorMr: 'पासवर्ड रीसेट ईमेल सेवा कॉन्फिगर केलेली नाही. कृपया प्रशासकाशी संपर्क साधा.'
      };
    }

    const admin = serverDb.getAdmin();
    const isMatch =
      trimmed === admin.email.toLowerCase() ||
      trimmed === admin.username.toLowerCase();

    // Uniform response to prevent account enumeration if email does not match
    if (!isMatch) {
      return {
        success: true,
        messageEn: 'If this email is associated with the administrative account, password reset instructions have been sent to your inbox.',
        messageMr: 'हा ईमेल प्रशासकीय खात्याशी जोडलेला असल्यास, पासवर्ड रीसेट लिंक आपल्या इनबॉक्समध्ये पाठवली गेली आहे.',
        emailSent: true,
        providerConfigured: true
      };
    }

    // Generate 64-hex cryptographically secure random single-use token
    const token = crypto.randomBytes(32).toString('hex');
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

    // Send reset email via Nodemailer SMTP
    const emailResult = await sendPasswordResetEmail(admin.email, token);

    if (!emailResult.sent) {
      console.error(`[SERVER_AUTH] Failed to dispatch password reset email to ${admin.email}:`, emailResult.error);
      return {
        success: false,
        messageEn: 'Failed to deliver password reset email. Please check server SMTP configuration.',
        messageMr: 'पासवर्ड रीसेट ईमेल पाठवता आला नाही. कृपया सर्व्हर SMTP कॉन्फिगरेशन तपासा.',
        emailSent: false,
        providerConfigured: true,
        errorEn: 'Failed to deliver password reset email. Please check server SMTP configuration.',
        errorMr: 'पासवर्ड रीसेट ईमेल पाठवता आला नाही. कृपया सर्व्हर SMTP कॉन्फिगरेशन तपासा.'
      };
    }

    return {
      success: true,
      messageEn: 'A password reset link has been dispatched to your registered email address.',
      messageMr: 'पासवर्ड रीसेट लिंक आपल्या नोंदणीकृत ईमेलवर पाठवली गेली आहे.',
      emailSent: true,
      providerConfigured: true
    };
  }

  /**
   * Validate password reset token without consuming it.
   */
  public validateResetToken(token: string): {
    valid: boolean;
    errorEn?: string;
    errorMr?: string;
  } {
    const trimmed = (token || '').trim();
    if (!trimmed) {
      return {
        valid: false,
        errorEn: 'Please provide a valid reset token.',
        errorMr: 'कृपया वैध रीसेट टोकन द्या.'
      };
    }

    const record = serverDb.getResetToken(trimmed);
    if (!record) {
      return {
        valid: false,
        errorEn: 'Invalid or unrecognized password reset token.',
        errorMr: 'अवैध किंवा अनोळखी पासवर्ड रीसेट टोकन.'
      };
    }

    if (record.used) {
      return {
        valid: false,
        errorEn: 'This password reset link has already been used. Please request a new one.',
        errorMr: 'ही पासवर्ड रीसेट लिंक आधीच वापरली गेली आहे. कृपया नवीन लिंकची विनंती करा.'
      };
    }

    if (record.expiresAt <= Date.now()) {
      return {
        valid: false,
        errorEn: 'This password reset link has expired (15-minute validity). Please request a new one.',
        errorMr: 'या पासवर्ड रीसेट लिंकची मुदत संपली आहे (१५ मिनिटे). कृपया नवीन लिंकची विनंती करा.'
      };
    }

    return { valid: true };
  }

  /**
   * Consume reset token and set new password.
   */
  public async resetPasswordWithToken(
    token: string,
    newPasscode: string
  ): Promise<{ success: boolean; errorEn?: string; errorMr?: string }> {
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
        errorEn: 'New password must be at least 12 characters long.',
        errorMr: 'नवीन पासवर्ड किमान १२ अक्षरांचा असावा.'
      };
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(trimmedPass, salt);

    // Update password
    serverDb.updateAdminPasswordHash(newHash);

    // Invalidate reset token immediately (single-use)
    serverDb.markResetTokenUsed(token.trim());

    console.log(`[SERVER_AUTH] Admin password successfully reset with single-use token.`);
    return { success: true };
  }

  /**
   * Get public server authentication metadata.
   */
  public getAuthStatus() {
    const admin = serverDb.getAdmin();
    return {
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
      emailProviderConfigured: isEmailProviderConfigured()
    };
  }
}

export const serverAuthService = new ServerAuthService();
