import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Languages, 
  AlertCircle,
  Loader2,
  KeyRound,
  Mail,
  CheckCircle2,
  Send,
  Info,
  RotateCw,
  ArrowRight
} from 'lucide-react';
import type { Language } from '../types';
import { authService } from './auth/authService';

interface AdminLoginProps {
  lang: Language;
  onToggleLang: () => void;
  onLoginSuccess: () => void;
  onBackToPublicSite: () => void;
}

type AuthMode = 'login' | 'forgot_password';
type ForgotStep = 'request' | 'link_sent' | 'reset_with_token' | 'success';

/**
 * Mask an email address for privacy-safe display in UI (e.g. ma****3@gmail.com)
 */
function maskEmailAddress(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.trim().split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const start = local.slice(0, 2);
  const end = local.slice(-1);
  const asterisks = '*'.repeat(Math.min(Math.max(local.length - 3, 3), 5));
  return `${start}${asterisks}${end}@${domain}`;
}

export const AdminLogin: FC<AdminLoginProps> = ({
  lang,
  onToggleLang,
  onLoginSuccess,
  onBackToPublicSite
}) => {
  // Token detected from URL
  const [initialToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return (params.get('resetToken') || params.get('token') || '').trim();
  });

  // Login Form State
  const [authMode, setAuthMode] = useState<AuthMode>(() => initialToken ? 'forgot_password' : 'login');
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<ForgotStep>(() => initialToken ? 'reset_with_token' : 'request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [activeResetToken, setActiveResetToken] = useState<string>(() => initialToken);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(() => Boolean(initialToken));
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [sentNotice, setSentNotice] = useState<{ messageEn: string; messageMr: string; providerConfigured: boolean; recipient: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Resend cooldown timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Validate initial token from URL if present
  useEffect(() => {
    if (initialToken) {
      let isMounted = true;
      authService.validateResetToken(initialToken).then((res) => {
        if (!isMounted) return;
        setForgotLoading(false);
        if (res.valid) {
          setForgotStep('reset_with_token');
          setForgotError(null);
        } else {
          setForgotStep('request');
          setForgotError(lang === 'mr' ? (res.errorMr || 'अवैध किंवा मुदत संपलेली रीसेट लिंक.') : (res.errorEn || 'Invalid or expired password reset link.'));
        }
      }).catch(() => {
        if (!isMounted) return;
        setForgotLoading(false);
        setForgotStep('request');
        setForgotError(lang === 'mr' ? 'रीसेट लिंक तपासण्यात त्रुटी आली.' : 'Failed to validate reset link.');
      });
      return () => {
        isMounted = false;
      };
    }
  }, [initialToken, lang]);

  // Handle standard login
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authService.login(username, passcode);
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(lang === 'mr' ? (result.errorMr || 'प्रवेश करता आला नाही.') : (result.errorEn || 'Unable to sign in. Please verify credentials.'));
      }
    } catch {
      setErrorMessage(
        lang === 'mr'
          ? 'प्रवेश करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
          : 'An unexpected authentication error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password: Step 1 Send Reset Link
  const handleRequestLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    const emailToSubmit = forgotEmail.trim();

    try {
      const result = await authService.requestPasswordReset(emailToSubmit);
      if (result.success && result.emailSent) {
        setSentNotice({
          messageEn: result.messageEn || 'A password reset link has been dispatched to your email inbox.',
          messageMr: result.messageMr || 'पासवर्ड रीसेट लिंक आपल्या ईमेल इनबॉक्समध्ये पाठवली गेली आहे.',
          providerConfigured: Boolean(result.providerConfigured),
          recipient: emailToSubmit
        });
        setForgotStep('link_sent');
        setResendCooldown(60);
      } else {
        const errorMsg = lang === 'mr' 
          ? (result.errorMr || 'पासवर्ड रीसेट विनंती पूर्ण करता आली नाही. कृपया पुन्हा प्रयत्न करा.') 
          : (result.errorEn || 'Password reset request could not be completed. Please try again.');
        setForgotError(errorMsg);
      }
    } catch {
      setForgotError(
        lang === 'mr'
          ? 'रीसेट विनंती करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
          : 'An error occurred while requesting reset.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Resending Reset Link
  const handleResendResetLink = async () => {
    if (resendCooldown > 0 || forgotLoading) return;
    const targetEmail = sentNotice?.recipient || forgotEmail.trim();
    if (!targetEmail) return;

    setForgotError(null);
    setForgotLoading(true);

    try {
      const result = await authService.requestPasswordReset(targetEmail);
      if (result.success && result.emailSent) {
        setSentNotice({
          messageEn: result.messageEn || 'A fresh password reset link has been dispatched.',
          messageMr: result.messageMr || 'नवीन पासवर्ड रीसेट लिंक आपल्या ईमेलवर पाठवली गेली आहे.',
          providerConfigured: Boolean(result.providerConfigured),
          recipient: targetEmail
        });
        setResendCooldown(60);
      } else {
        const errorMsg = lang === 'mr'
          ? (result.errorMr || 'नवीन ईमेल पाठवता आला नाही.')
          : (result.errorEn || 'Failed to resend reset email.');
        setForgotError(errorMsg);
      }
    } catch {
      setForgotError(
        lang === 'mr'
          ? 'पुन्हा लिंक पाठवताना त्रुटी आली.'
          : 'An error occurred while resending the link.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Forgot Password: Step 2 Set New Password with Token
  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const trimmedNew = newPasscode.trim();
    const trimmedConfirm = confirmPasscode.trim();

    if (trimmedNew.length < 12) {
      setForgotError(
        lang === 'mr'
          ? 'नवीन पासवर्ड किमान १२ अक्षरांचा असणे आवश्यक आहे.'
          : 'New password must be at least 12 characters long.'
      );
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setForgotError(
        lang === 'mr'
          ? 'दोन्ही पासवर्ड जुळत नाहीत. कृपया पुन्हा तपासा.'
          : 'Passwords do not match. Please verify.'
      );
      return;
    }

    setForgotLoading(true);

    try {
      const result = await authService.resetPasswordWithToken(activeResetToken, trimmedNew);
      if (result.success) {
        if (typeof window !== 'undefined' && window.history) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
        setForgotStep('success');
      } else {
        setForgotError(lang === 'mr' ? (result.errorMr || 'पासवर्ड रीसेट करता आला नाही.') : (result.errorEn || 'Failed to reset password.'));
      }
    } catch {
      setForgotError(
        lang === 'mr'
          ? 'पासवर्ड अद्यतनित करताना त्रुटी आली.'
          : 'An error occurred while updating the password.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    setAuthMode('login');
    setForgotStep('request');
    setForgotEmail('');
    setActiveResetToken('');
    setNewPasscode('');
    setConfirmPasscode('');
    setSentNotice(null);
    setForgotError(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between py-8 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900 antialiased">
      {/* Subtle ambient botanical lighting */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-emerald-500/10 via-emerald-100/20 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true" 
      />
      <div 
        className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true" 
      />

      {/* Top Header Navigation */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between z-10 pb-4">
        <button
          type="button"
          onClick={onBackToPublicSite}
          className="text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer px-3.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-stone-200/90 shadow-2xs backdrop-blur-xs"
          aria-label={lang === 'mr' ? 'मुख्य संकेतस्थळावर परत जा' : 'Return to public website'}
        >
          <ArrowLeft className="w-4 h-4 text-stone-500" />
          <span>{lang === 'mr' ? 'मुख्य संकेतस्थळ' : 'Public Website'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs backdrop-blur-xs"
          aria-label={lang === 'mr' ? 'Switch language to English' : 'मराठी भाषेत बदला'}
        >
          <Languages className="w-3.5 h-3.5 text-emerald-700" />
          <span>{lang === 'mr' ? 'English' : 'मराठी'}</span>
        </button>
      </div>

      {/* Main Elevated Card */}
      <div className="max-w-md w-full mx-auto z-10 my-auto">
        <div className="bg-white/95 border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-900/5 backdrop-blur-xl ring-1 ring-stone-900/5 space-y-6">
          
          {/* ── Brand Header (Strict vertical column structure for 100% identical layout in EN and MR) ── */}
          <div className="flex flex-col items-center justify-center text-center w-full space-y-3">
            {/* Logo + Brand Name container */}
            <a
              href="/"
              title={lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Go to Home'}
              className="flex flex-col items-center justify-center text-center w-full group cursor-pointer select-none"
            >
              {/* Centered Circular/Rounded Logo Box */}
              <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200/90 p-2 flex items-center justify-center shrink-0 mx-auto shadow-2xs group-hover:border-emerald-500 group-hover:scale-105 transition-all">
                <img
                  src="/assets/logo.png"
                  alt="Baliraja Krishi Seva Kendra Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              
              {/* Brand Heading with guaranteed centering and full glyph room */}
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif tracking-tight mt-3 text-center w-full max-w-sm mx-auto group-hover:text-emerald-700 transition-colors leading-relaxed py-0.5 overflow-visible">
                {lang === 'mr' ? 'बळीराजा कृषी सेवा केंद्र' : 'Baliraja Krishi Seva Kendra'}
              </h1>
            </a>
            
            {/* Centered Mode Badge */}
            <div className="flex items-center justify-center w-full">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
                {authMode === 'login' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{lang === 'mr' ? 'प्रशासक प्रवेश' : 'Admin Control Gateway'}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{lang === 'mr' ? 'पासवर्ड पुनर्प्राप्ती' : 'Password Recovery'}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Subtitle Description */}
            <p className="text-xs text-stone-500 max-w-xs mx-auto text-center leading-relaxed py-0.5 overflow-visible">
              {authMode === 'login'
                ? (lang === 'mr' ? 'कृषी निविष्ठा, उत्पादने व शेती माहिती व्यवस्थापन' : 'Agricultural catalog & verified content control')
                : (lang === 'mr' ? 'नोंदणीकृत प्रशासक खात्यासाठी सुरक्षित पासवर्ड रीसेट' : 'Secure password recovery for authorized administrator')}
            </p>
          </div>

          {/* MODE 1: STANDARD ADMIN LOGIN */}
          {authMode === 'login' && (
            <div className="space-y-4">
              {/* Error Message Display */}
              {errorMessage && (
                <div 
                  role="alert" 
                  className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    {lang === 'mr' ? 'वापरकर्ता नाव किंवा ईमेल' : 'Username or Admin Email'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => {
                        setErrorMessage(null);
                        setUsername(e.target.value);
                      }}
                      placeholder={lang === 'mr' ? 'नाव किंवा नोंदणीकृत ईमेल' : 'Enter username or registered email'}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/60 border border-stone-200/90 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Passcode */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      {lang === 'mr' ? 'प्रशासकीय पासवर्ड (Passcode)' : 'Administrative Passcode'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot_password');
                        setForgotStep('request');
                        setForgotError(null);
                        setForgotEmail(username.includes('@') ? username : '');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold transition-colors cursor-pointer"
                    >
                      {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={passcode}
                      onChange={(e) => {
                        setErrorMessage(null);
                        setPasscode(e.target.value);
                      }}
                      placeholder={lang === 'mr' ? 'पासवर्ड प्रविष्ट करा' : 'Enter administrative passcode'}
                      className="w-full pl-10 pr-10 py-2.5 bg-stone-50/60 border border-stone-200/90 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'mr' ? 'प्रमाणित होत आहे...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <span>{lang === 'mr' ? 'प्रवेश करा (Sign In)' : 'Sign In to Portal'}</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: FORGOT PASSWORD FLOW (SERVER-SIDE TOKEN & EMAIL LINK) */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              {/* Error Message Display */}
              {forgotError && (
                <div 
                  role="alert" 
                  className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{forgotError}</span>
                </div>
              )}

              {/* STEP 1: Enter Registered Email */}
              {forgotStep === 'request' && (
                <form onSubmit={handleRequestLinkSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      {lang === 'mr' ? 'नोंदणीकृत प्रशासक ईमेल' : 'Registered Administrator Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotError(null);
                          setForgotEmail(e.target.value);
                        }}
                        placeholder={lang === 'mr' ? 'आपला नोंदणीकृत ईमेल प्रविष्ट करा' : 'Enter registered admin email'}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/60 border border-stone-200/90 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                      {lang === 'mr'
                        ? 'पासवर्ड रीसेट करण्यासाठी १५ मिनिटे वैध असलेली सुरक्षित लिंक आपल्या ईमेलवर पाठवली जाईल.'
                        : 'A secure password reset link valid for 15 minutes will be dispatched to your registered email.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{lang === 'mr' ? 'विनंती पाठवत आहे...' : 'Dispatching Reset Link...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === 'mr' ? 'पासवर्ड रीसेट लिंक पाठवा' : 'Send Password Reset Link'}</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleReturnToLogin}
                      className="text-xs text-stone-500 hover:text-stone-800 font-medium transition-colors cursor-pointer"
                    >
                      {lang === 'mr' ? '← प्रवेश पृष्ठावर परत जा' : '← Back to Sign In'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Password Reset Sent Confirmation Screen */}
              {forgotStep === 'link_sent' && (
                <div className="space-y-5 text-center py-2 animate-in fade-in duration-200">
                  {/* Success Icon Badge */}
                  <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200/90 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 shadow-2xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>

                  {/* Confirmation Title & Message */}
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-snug">
                      {lang === 'mr' ? 'पासवर्ड रीसेट लिंक पाठवली आहे' : 'Password Reset Link Sent'}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {lang === 'mr' ? 'कृपया आपला नोंदणीकृत ईमेल इनबॉक्स तपासा' : 'Check your registered email inbox to proceed'}
                    </p>
                  </div>

                  {/* Details Card */}
                  <div className="space-y-3 text-left bg-emerald-50/80 p-4 sm:p-4.5 rounded-2xl border border-emerald-200/90 shadow-2xs">
                    <div className="text-xs text-emerald-950 leading-relaxed">
                      {lang === 'mr' ? (
                        <>
                          आम्ही <span className="font-bold text-emerald-950 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/80 inline-block">{maskEmailAddress(sentNotice?.recipient || forgotEmail)}</span> या नोंदणीकृत ईमेलवर पासवर्ड रीसेट करण्याची सुरक्षित लिंक पाठवली आहे.
                        </>
                      ) : (
                        <>
                          We have dispatched a secure password reset link to <span className="font-bold text-emerald-950 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/80 inline-block">{maskEmailAddress(sentNotice?.recipient || forgotEmail)}</span>.
                        </>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-emerald-200/70 text-[11.5px] text-emerald-900/90 space-y-1.5 leading-relaxed">
                      <p className="flex items-start gap-1.5">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{lang === 'mr' ? 'ईमेल इनबॉक्स आणि स्पॅम (Spam) फोल्डर तपासा.' : 'Check your inbox and Spam / Junk folder.'}</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{lang === 'mr' ? 'सुरक्षेच्या कारणास्तव ही लिंक पुढील १५ मिनिटांसाठी वैध राहील.' : 'For security, this reset link is valid for 15 minutes only.'}</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{lang === 'mr' ? 'ही सिंगल-युझ लिंक असून पासवर्ड बदलल्यानंतर लगेच अवैध होईल.' : 'Single-use token: invalidates automatically upon password change.'}</span>
                      </p>
                    </div>
                  </div>

                  {/* SMTP Not Configured Fallback Indicator (Development only) */}
                  {!sentNotice?.providerConfigured && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-amber-800 leading-relaxed">
                        {lang === 'mr'
                          ? 'डेव्हलपमेंट सूचना: सर्व्हरवर SMTP ईमेल प्रदाता अद्याप कॉन्फिगर केलेला नाही (.env मध्ये SMTP तपशील भरा).'
                          : 'Development notice: SMTP email provider is not configured in server .env. Check server console for link.'}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons & Resend Controls */}
                  <div className="space-y-3 pt-2">
                    {/* Primary Button: Back to Sign In */}
                    <button
                      type="button"
                      onClick={handleReturnToLogin}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{lang === 'mr' ? '← प्रवेश पृष्ठावर परत जा' : '← Back to Sign In'}</span>
                    </button>

                    {/* Resend Action with Cooldown Protection */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 px-1">
                      {resendCooldown > 0 ? (
                        <span className="text-2xs text-stone-500 font-medium flex items-center gap-1.5">
                          <RotateCw className="w-3 h-3 text-stone-400 animate-spin" />
                          <span>
                            {lang === 'mr' 
                              ? `पुन्हा पाठवा (${resendCooldown} से.)` 
                              : `Resend link (${resendCooldown}s)`}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={forgotLoading}
                          onClick={handleResendResetLink}
                          className="text-2xs text-emerald-700 hover:text-emerald-800 font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          <RotateCw className="w-3 h-3 text-emerald-600" />
                          <span>{lang === 'mr' ? 'ईमेल आला नाही? पुन्हा पाठवा' : "Didn't receive email? Resend"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep('request');
                          setForgotError(null);
                        }}
                        className="text-2xs text-stone-500 hover:text-stone-800 font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{lang === 'mr' ? 'दुसरा ईमेल वापरा' : 'Use different email'}</span>
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Reset Password with Verified Token */}
              {forgotStep === 'reset_with_token' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-700" />
                    <span className="leading-relaxed">
                      {lang === 'mr'
                        ? 'सुरक्षित रीसेट लिंक सत्यापित झाली. नवीन पासवर्ड तयार करा.'
                        : 'Secure reset link verified. Enter your new password below.'}
                    </span>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      {lang === 'mr' ? 'नवीन पासवर्ड (किमान १२ अक्षरे)' : 'New Password (min 12 characters)'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={12}
                        value={newPasscode}
                        onChange={(e) => {
                          setForgotError(null);
                          setNewPasscode(e.target.value);
                        }}
                        placeholder={lang === 'mr' ? 'नवीन पासवर्ड प्रविष्ट करा' : 'Enter new password'}
                        className="w-full pl-10 pr-10 py-2.5 bg-stone-50/60 border border-stone-200/90 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      {lang === 'mr' ? 'नवीन पासवर्डची पुष्टी करा' : 'Confirm New Password'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={12}
                        value={confirmPasscode}
                        onChange={(e) => {
                          setForgotError(null);
                          setConfirmPasscode(e.target.value);
                        }}
                        placeholder={lang === 'mr' ? 'नवीन पासवर्ड पुन्हा प्रविष्ट करा' : 'Re-enter new password'}
                        className="w-full pl-10 pr-10 py-2.5 bg-stone-50/60 border border-stone-200/90 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{lang === 'mr' ? 'पासवर्ड जतन होत आहे...' : 'Saving New Password...'}</span>
                      </>
                    ) : (
                      <span>{lang === 'mr' ? 'नवीन पासवर्ड जतन करा' : 'Save New Password'}</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleReturnToLogin}
                      className="text-xs text-stone-500 hover:text-stone-800 font-medium transition-colors cursor-pointer"
                    >
                      {lang === 'mr' ? '← रद्द करा आणि प्रवेश पृष्ठावर परत जा' : '← Cancel & Return to Sign In'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: Success Confirmation */}
              {forgotStep === 'success' && (
                <div className="text-center space-y-4 py-3 animate-in fade-in duration-200">
                  <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 shadow-2xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-stone-900 font-serif">
                      {lang === 'mr' ? 'पासवर्ड यशस्वीरित्या बदलला!' : 'Password Changed Successfully!'}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {lang === 'mr'
                        ? 'आपला पासवर्ड सर्व्हरवर अद्यतनित केला गेला आहे. आता आपण नवीन पासवर्ड वापरून प्रशासकीय पोर्टलवर प्रवेश करू शकता.'
                        : 'Your administrator password has been securely updated on the server. You can now log in with your new credentials.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReturnToLogin}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{lang === 'mr' ? 'आता लॉगिन करा' : 'Sign In with New Password'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security & Access Notice */}
          <div className="pt-3 border-t border-stone-100 text-center">
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {lang === 'mr'
                ? 'केवळ अधिकृत व्यवस्थापनासाठी. सुरक्षित सर्व्हर प्रमाणीकरण.'
                : 'Authorized personnel only. Server-grade cryptographic authentication.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer architectural note */}
      <div className="max-w-md w-full mx-auto text-center z-10 pt-4">
        <p className="text-[11px] text-stone-400 font-mono">
          Baliraja Krishi Seva Kendra • Kaij, Maharashtra • Server Auth v2.0
        </p>
      </div>
    </div>
  );
};
