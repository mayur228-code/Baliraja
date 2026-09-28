import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export interface EmailSendResult {
  sent: boolean;
  providerConfigured: boolean;
  messageId?: string;
  error?: string;
}

export function isEmailProviderConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(host && user && pass);
}

/**
 * Retrieves the main website URL dynamically from environment configuration.
 * When deployed to production, setting APP_URL or VITE_APP_URL in .env automatically updates
 * all email links (logo home link, brand name link & reset password link) with zero hardcoded URLs.
 */
export function getAppUrl(): string {
  const envUrl = process.env.APP_URL || process.env.VITE_APP_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  return 'http://localhost:5173';
}

/**
 * Resolves absolute public image URLs for external email clients.
 * In development: Uses ASSET_BASE_URL, PUBLIC_ASSET_URL, or APP_URL (if HTTPS).
 * In production: Switching APP_URL in .env to the live HTTPS domain (e.g. APP_URL=https://baliraja.in)
 * automatically serves all email images from the live website assets.
 */
export function getAssetUrl(assetPath: string): string {
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  // 1. Explicit asset host override (e.g. CDN or public bucket)
  if (process.env.ASSET_BASE_URL && process.env.ASSET_BASE_URL.trim()) {
    return `${process.env.ASSET_BASE_URL.replace(/\/+$/, '')}${cleanPath}`;
  }
  if (process.env.PUBLIC_ASSET_URL && process.env.PUBLIC_ASSET_URL.trim()) {
    return `${process.env.PUBLIC_ASSET_URL.replace(/\/+$/, '')}${cleanPath}`;
  }

  // 2. Production / Live HTTPS APP_URL
  const appUrl = getAppUrl();
  if (appUrl.startsWith('https://')) {
    return `${appUrl}${cleanPath}`;
  }

  // 3. Fallback production domain
  return `https://baliraja.in${cleanPath}`;
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string
): Promise<EmailSendResult> {
  const appUrl = getAppUrl();
  const resetLink = `${appUrl}/admin?resetToken=${encodeURIComponent(resetToken)}`;

  // 1. Brand Logo PNG URL (Top Circular Asset)
  const logoUrl = getAssetUrl('/assets/logo.png');

  // 2. Brand Name PNG URL (Underneath Logo Asset)
  const brandNameUrl = getAssetUrl('/assets/brand_name.png');

  if (!isEmailProviderConfigured()) {
    console.warn(
      `[EMAIL_SERVICE] SMTP is NOT configured in environment. Generated password reset token for: ${recipientEmail}. ` +
      `To deliver live emails to this inbox, please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in your .env file.`
    );
    return {
      sent: false,
      providerConfigured: false,
      error: 'SMTP email provider is not configured. Please configure SMTP credentials in server environment variables (.env).'
    };
  }

  const host = process.env.SMTP_HOST!;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
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
    पासवर्ड रीसेट लिंक • Baliraja Krishi Seva Kendra Admin Password Reset verification link (Valid for 15 minutes).
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
                        alt="बळीराजा कृषी सेवा केंद्र" 
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
                      नमस्कार / Hello Administrator,
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; color: #292524;">
                      आम्हाला आपल्या प्रशासकीय खात्यासाठी पासवर्ड रीसेट करण्याची विनंती प्राप्त झाली आहे.
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
                                  पासवर्ड रीसेट करा • Reset Password
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
                        बटण काम करत नसल्यास खालील लिंक थेट ब्राऊझरमध्ये उघडा / If the button does not work, copy and open this link:
                      </p>
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11.5px; color: #047857; line-height: 1.4;">
                        <a href="${resetLink}" style="color: #047857; text-decoration: underline;">${resetLink}</a>
                      </div>
                    </div>

                    <!-- 5. Concise Security & Expiry Notice -->
                    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 14px 16px; margin-top: 24px;">
                      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #92400e;">
                        ⚠️ सुरक्षा सूचना / Security Notice:
                      </p>
                      <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #78350f;">
                        <li>ही लिंक पुढील <strong>१५ मिनिटांसाठी</strong> वैध आहे / Valid for <strong>15 minutes</strong> only.</li>
                        <li>ही सिंगल-युझ लिंक असून पासवर्ड बदलल्यानंतर लगेच अवैध होईल / Single-use only. Token expires upon password update.</li>
                        <li>ही विनंती आपण केली नसल्यास या ईमेलकडे दुर्लक्ष करा. आपला सध्याचा पासवर्ड सुरक्षित राहील / If you did not make this request, please disregard this email.</li>
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
                      Confidential Security Dispatch • Please do not reply directly to this automated email
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
Baliraja Krishi Seva Kendra (बळीराजा कृषी सेवा केंद्र) - Admin Password Reset

नमस्कार / Hello Administrator,

आम्हाला आपल्या प्रशासकीय खात्यासाठी पासवर्ड रीसेट करण्याची विनंती प्राप्त झाली आहे.
We received a request to securely reset the password for your administrator account.

खालील सुरक्षित लिंक वापरून आपला पासवर्ड रीसेट करा (Link valid for 15 minutes):
${resetLink}

सुरक्षा सूचना / Security Notice:
- ही लिंक पुढील १५ मिनिटांसाठी वैध आहे (Valid for 15 minutes only).
- ही सिंगल-युझ लिंक असून एकदा पासवर्ड बदलल्यानंतर लगेच अवैध होते (Single-use token).
- ही विनंती आपण केली नसल्यास या ईमेलकडे दुर्लक्ष करा (If you did not request this, please disregard).

Baliraja Krishi Seva Kendra
Mangalwar Peth, Kaij, Dist. Beed, Maharashtra - 431123
  `.trim();

  try {
    // Deliver email via IMAGE URL method without attachments array (No paperclip attachment indicator)
    const info = await transporter.sendMail({
      from,
      to: recipientEmail,
      subject: 'Baliraja Krishi Seva Kendra - Admin Password Reset',
      text: textContent,
      html: htmlContent
    });

    console.log(`[EMAIL_SERVICE] Password reset email sent to ${recipientEmail}. MessageId: ${info.messageId}`);
    return {
      sent: true,
      providerConfigured: true,
      messageId: info.messageId
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EMAIL_SERVICE] Failed to send email via SMTP:`, msg);
    return {
      sent: false,
      providerConfigured: true,
      error: `Failed to deliver email via SMTP: ${msg}`
    };
  }
}
