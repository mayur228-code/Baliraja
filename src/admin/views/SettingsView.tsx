import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { 
  Download, 
  Upload, 
  Database,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import type { Language } from '../../types';
import { useContentStore } from '../data/contentStore';
import { ConfirmModal } from '../components/ConfirmModal';
import { authService } from '../auth/authService';

interface SettingsViewProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const SettingsView: FC<SettingsViewProps> = ({ lang, onShowToast }) => {
  const { businessInfo, saveBusinessInfo, exportBackupJson, importBackupJson, resetToDefaults } = useContentStore();

  // Reset & Backup states
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Active Admin Email state (derived from authoritative server auth layer)
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>(() => authService.getAdminEmail());

  // Subscribe to live server email updates and fetch on mount
  useEffect(() => {
    const unsubscribe = authService.subscribeToEmail((email) => {
      if (email) setCurrentAdminEmail(email);
    });

    authService.fetchAdminEmail().then((email) => {
      if (email) setCurrentAdminEmail(email);
    });

    return unsubscribe;
  }, []);

  // Change Admin Email form states
  const [currentEmailPassword, setCurrentEmailPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Change Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleExport = () => {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baliraja_content_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onShowToast(
      'success',
      'JSON database backup downloaded successfully.',
      'डेटाबेस JSON बॅकअप यशस्वीरित्या डाउनलोड केला.'
    );
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const res = importBackupJson(importJsonText);
    if (res.success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
      onShowToast(
        'success',
        'Database backup restored successfully.',
        'डेटाबेस बॅकअप यशस्वीरित्या पुनर्संचयित केला.'
      );
    } else {
      onShowToast(
        'error',
        res.error || 'Failed to import JSON.',
        'बॅकअप आयात करण्यात त्रुटी आली. फाइल तपासा.'
      );
    }
  };

  const handleResetConfirm = () => {
    resetToDefaults();
    setIsResetConfirmOpen(false);
    onShowToast(
      'info',
      'All content reset to initial verified defaults.',
      'सर्व माहिती सुरुवातीच्या प्रमाणित स्थितीत पुनर्संचयित केली.'
    );
  };

  // Change Admin Email Submit
  const handleChangeEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const trimmedPassword = currentEmailPassword.trim();
    const trimmedNewEmail = newEmail.trim().toLowerCase();
    const trimmedConfirmEmail = confirmEmail.trim().toLowerCase();

    if (!trimmedPassword) {
      setEmailError(
        lang === 'mr'
          ? 'कृपया आपला सध्याचा प्रशासकीय पासवर्ड प्रविष्ट करा.'
          : 'Please enter your current administrator password.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedNewEmail)) {
      setEmailError(
        lang === 'mr'
          ? 'कृपया वैध ईमेल पत्ता प्रविष्ट करा (उदा. name@example.com).'
          : 'Please enter a valid email address (e.g. name@example.com).'
      );
      return;
    }

    if (trimmedNewEmail !== trimmedConfirmEmail) {
      setEmailError(
        lang === 'mr'
          ? 'दोन्ही नवीन ईमेल पत्ते जुळत नाहीत. कृपया पुन्हा तपासा.'
          : 'New email addresses do not match. Please re-check.'
      );
      return;
    }

    if (trimmedNewEmail === currentAdminEmail.toLowerCase()) {
      setEmailError(
        lang === 'mr'
          ? 'नवीन ईमेल सध्याच्या नोंदणीकृत ईमेलसारखाच असू शकत नाही.'
          : 'New email cannot be identical to your current registered email.'
      );
      return;
    }

    setIsChangingEmail(true);

    try {
      const res = await authService.changeAdminEmail(trimmedPassword, trimmedNewEmail);
      if (res.success && res.email) {
        // Synchronize with application profile database
        saveBusinessInfo({
          ...businessInfo,
          email: res.email
        });

        setCurrentAdminEmail(res.email);
        setCurrentEmailPassword('');
        setNewEmail('');
        setConfirmEmail('');
        setEmailSuccess(
          lang === 'mr'
            ? `प्रशासकीय ईमेल यशस्वीरित्या बदलला: ${res.email}. आता हा ईमेल लॉगिन आणि पासवर्ड रिकव्हरीसाठी वापरला जाईल.`
            : `Admin email successfully updated to: ${res.email}. This will be used for sign-in and password recovery.`
        );
        onShowToast(
          'success',
          `Admin email updated to ${res.email}.`,
          `प्रशासकीय ईमेल ${res.email} वर अद्यतनित केला.`
        );
      } else {
        const err = lang === 'mr' ? (res.errorMr || 'ईमेल बदलता आला नाही.') : (res.errorEn || 'Failed to update email.');
        setEmailError(err);
        onShowToast('error', res.errorEn || 'Failed to update email.', res.errorMr || 'ईमेल बदलता आला नाही.');
      }
    } catch {
      setEmailError(
        lang === 'mr'
          ? 'प्रशासकीय ईमेल बदलताना अनपेक्षित त्रुटी आली.'
          : 'An unexpected error occurred while updating email.'
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Change Password Submit
  const handleChangePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedCurrent) {
      setPasswordError(
        lang === 'mr'
          ? 'कृपया आपला सध्याचा पासवर्ड प्रविष्ट करा.'
          : 'Please enter your current password.'
      );
      return;
    }

    if (trimmedNew.length < 12) {
      setPasswordError(
        lang === 'mr'
          ? 'नवीन पासवर्ड किमान १२ अक्षरांचा असणे आवश्यक आहे.'
          : 'New password must be at least 12 characters long.'
      );
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setPasswordError(
        lang === 'mr'
          ? 'दोन्ही नवीन पासवर्ड जुळत नाहीत. कृपया पुन्हा तपासा.'
          : 'New passwords do not match. Please re-check.'
      );
      return;
    }

    if (trimmedCurrent === trimmedNew) {
      setPasswordError(
        lang === 'mr'
          ? 'नवीन पासवर्ड सध्याच्या पासवर्डसारखाच असू शकत नाही.'
          : 'New password cannot be identical to current password.'
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await authService.changePassword(trimmedCurrent, trimmedNew);
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(
          lang === 'mr'
            ? 'प्रशासकीय पासवर्ड यशस्वीरित्या बदलला. पुढील लॉगिन करताना नवीन पासवर्ड वापरा.'
            : 'Admin password changed successfully. Your new password will be active for next login.'
        );
        onShowToast(
          'success',
          'Admin password changed successfully.',
          'प्रशासकीय पासवर्ड यशस्वीरित्या बदलला.'
        );
      } else {
        const err = lang === 'mr' ? (res.errorMr || 'पासवर्ड बदलता आला नाही.') : (res.errorEn || 'Failed to change password.');
        setPasswordError(err);
        onShowToast('error', res.errorEn || 'Failed to change password.', res.errorMr || 'पासवर्ड बदलता आला नाही.');
      }
    } catch {
      setPasswordError(
        lang === 'mr'
          ? 'पासवर्ड बदलताना अनपेक्षित त्रुटी आली.'
          : 'An unexpected error occurred while changing password.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Architecture and Security Notice */}
      <div className="bg-emerald-50/90 border border-emerald-200 p-5 sm:p-6 rounded-2xl text-emerald-950 space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-900">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="leading-relaxed overflow-visible">
            {lang === 'mr' ? 'सुरक्षित सर्व्हर प्रमाणीकरण प्रणाली (Server-Side Auth)' : 'Server-Side Authentication System'}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-emerald-900">
          {lang === 'mr'
            ? 'प्रशासकीय खात्याची सुरक्षा (पासवर्ड, ईमेल, सिंगल-युझ रीसेट टोकन्स) सुरक्षित सर्व्हर-साइड bcrypt अल्गोरिदम आणि बॅकएंड API द्वारे नियंत्रित केली जाते. ब्राऊझरमध्ये कोणतेही पासवर्ड किंवा क्रिप्टोग्राफिक हॅश साठवले जात नाहीत.'
            : 'Administrative account security (bcrypt password hashing, registered email, rate limiting, and single-use password reset tokens) is strictly managed by the backend server API. Credential hashes and recovery tokens are never stored on the client.'}
        </p>
      </div>

      {/* SECTION 1: Change Admin Email */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-5">
        <div className="border-b border-stone-100 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2 leading-relaxed overflow-visible">
              <Mail className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'mr' ? 'प्रशासकीय ईमेल पत्ता बदला (Change Admin Email)' : 'Change Administrator Email'}</span>
            </h3>
            <p className="text-2xs text-stone-500 leading-relaxed">
              {lang === 'mr'
                ? 'प्रशासक लॉगिन आणि पासवर्ड रीसेटसाठी नोंदणीकृत ईमेल अद्यतनित करा. सुरक्षेसाठी सध्याचा पासवर्ड आवश्यक आहे.'
                : 'Update the registered email used for portal sign-in and password recovery. Requires your current password.'}
            </p>
          </div>

          {/* Current Registered Email Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-3xs text-stone-500 font-medium">
              {lang === 'mr' ? 'सध्याचा ईमेल:' : 'Current Email:'}
            </span>
            <span className="text-2xs font-mono font-bold text-stone-900 truncate max-w-[200px]">
              {currentAdminEmail || 'Loading...'}
            </span>
          </div>
        </div>

        {/* Feedback Alerts for Email Form */}
        {emailError && (
          <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{emailError}</span>
          </div>
        )}

        {emailSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{emailSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangeEmailSubmit} className="max-w-xl space-y-4">
          {/* Current Admin Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'सध्याचा प्रशासकीय पासवर्ड (Current Password)' : 'Current Administrator Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showEmailPassword ? 'text' : 'password'}
                required
                value={currentEmailPassword}
                onChange={(e) => {
                  setEmailError(null);
                  setEmailSuccess(null);
                  setCurrentEmailPassword(e.target.value);
                }}
                placeholder={lang === 'mr' ? 'सध्याचा पासवर्ड प्रविष्ट करा' : 'Enter current admin password'}
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50/50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowEmailPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                aria-label={showEmailPassword ? 'Hide password' : 'Show password'}
              >
                {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Email */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                {lang === 'mr' ? 'नवीन ईमेल पत्ता' : 'New Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => {
                    setEmailError(null);
                    setEmailSuccess(null);
                    setNewEmail(e.target.value);
                  }}
                  placeholder={lang === 'mr' ? 'उदा. newadmin@gmail.com' : 'e.g. newadmin@gmail.com'}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>

            {/* Confirm New Email */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                {lang === 'mr' ? 'नवीन ईमेलची पुष्टी करा' : 'Confirm New Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={confirmEmail}
                  onChange={(e) => {
                    setEmailError(null);
                    setEmailSuccess(null);
                    setConfirmEmail(e.target.value);
                  }}
                  placeholder={lang === 'mr' ? 'नवीन ईमेल पुन्हा प्रविष्ट करा' : 'Re-enter new email'}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingEmail}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs hover:shadow active:scale-98"
            >
              {isChangingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="leading-relaxed">{lang === 'mr' ? 'अद्यतनित होत आहे...' : 'Updating Email...'}</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span className="leading-relaxed">{lang === 'mr' ? 'ईमेल पत्ता जतन करा' : 'Save New Email'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Change Password */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-5">
        <div className="border-b border-stone-100 pb-3.5">
          <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2 leading-relaxed overflow-visible">
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'mr' ? 'प्रशासकीय पासवर्ड बदला (Change Admin Password)' : 'Change Administrator Password'}</span>
          </h3>
          <p className="text-2xs text-stone-500 leading-relaxed">
            {lang === 'mr'
              ? 'प्रशासकीय खात्यासाठी नवीन संकेतांक सेट करा. सुरक्षेसाठी सध्याचा पासवर्ड आवश्यक आहे.'
              : 'Update your administrative passcode. Requires verification of your current password.'}
          </p>
        </div>

        {/* Feedback Alerts for Password Form */}
        {passwordError && (
          <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePasswordSubmit} className="max-w-xl space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
              {lang === 'mr' ? 'सध्याचा पासवर्ड (Current Password)' : 'Current Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setCurrentPassword(e.target.value);
                }}
                placeholder={lang === 'mr' ? 'सध्याचा पासवर्ड प्रविष्ट करा' : 'Enter current password'}
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50/50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                {lang === 'mr' ? 'नवीन पासवर्ड (किमान १२ अक्षरे)' : 'New Password (min 12 chars)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={12}
                  value={newPassword}
                  onChange={(e) => {
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    setNewPassword(e.target.value);
                  }}
                  placeholder={lang === 'mr' ? 'नवीन पासवर्ड' : 'New password'}
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50/50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 leading-relaxed">
                {lang === 'mr' ? 'नवीन पासवर्डची पुष्टी करा' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={12}
                  value={confirmPassword}
                  onChange={(e) => {
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    setConfirmPassword(e.target.value);
                  }}
                  placeholder={lang === 'mr' ? 'पुन्हा प्रविष्ट करा' : 'Confirm new password'}
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50/50 border border-stone-200 focus:border-emerald-600 focus:bg-white rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs hover:shadow active:scale-98"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="leading-relaxed">{lang === 'mr' ? 'बदलत आहे...' : 'Updating Password...'}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="leading-relaxed">{lang === 'mr' ? 'पासवर्ड अद्यतनित करा' : 'Update Password'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Backup and Restore Controls */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-5">
        <div className="border-b border-stone-100 pb-3.5">
          <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2 leading-relaxed overflow-visible">
            <Database className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'mr' ? 'डेटा बॅकअप व पुनर्प्राप्ती (Backup & Restore)' : 'Database Backup & Restore'}</span>
          </h3>
          <p className="text-2xs text-stone-500 leading-relaxed">
            {lang === 'mr'
              ? 'सर्व उत्पादने, शेती नोंदी आणि व्यवसाय माहितीचा JSON बॅकअप घ्या किंवा जुना बॅकअप पुन्हा आणा.'
              : 'Export or import your entire catalog, observations, and business profile in portable JSON format.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/70 flex flex-col justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-stone-900 flex items-center gap-2 mb-1 leading-relaxed">
                <Download className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'mr' ? 'JSON बॅकअप डाउनलोड करा' : 'Export JSON Backup'}</span>
              </div>
              <p className="text-2xs text-stone-500 leading-relaxed">
                {lang === 'mr'
                  ? 'सर्व अद्ययावत माहिती संगणकावर सुरक्षित साठवण्यासाठी डाउनलोड करा.'
                  : 'Download complete state snapshot to your computer.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer self-start flex items-center gap-1.5 shadow-xs hover:shadow active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="leading-relaxed">{lang === 'mr' ? 'बॅकअप डाउनलोड करा' : 'Export Backup'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/70 flex flex-col justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-stone-900 flex items-center gap-2 mb-1 leading-relaxed">
                <Upload className="w-4 h-4 text-blue-700" />
                <span>{lang === 'mr' ? 'JSON बॅकअप आयात करा' : 'Import JSON Backup'}</span>
              </div>
              <p className="text-2xs text-stone-500 leading-relaxed">
                {lang === 'mr'
                  ? 'यापूर्वी घेतलेला JSON बॅकअप मजकूर येथे पेस्ट करून डेटा पुनर्संचयित करा.'
                  : 'Paste previously exported JSON to restore state.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer self-start flex items-center gap-1.5 shadow-xs hover:shadow active:scale-98"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="leading-relaxed">{lang === 'mr' ? 'बॅकअप आयात करा' : 'Import Backup'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: Danger Zone / Reset to Seed Defaults */}
      <div className="bg-red-50/30 p-6 rounded-2xl border border-red-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-red-500/[0.05] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-950 font-serif leading-relaxed overflow-visible">
                {lang === 'mr' ? 'डेंजर झोन: मूळ स्थितीत पुनर्संचयित' : 'Danger Zone: Reset Database to Seed State'}
              </h3>
              <p className="text-2xs text-red-800/80 leading-relaxed mt-0.5">
                {lang === 'mr'
                  ? 'सुरुवातीच्या मूळ माहितीत परत जाण्यासाठी हा पर्याय वापरा. केलेले सर्व बदल नष्ट होतील.'
                  : 'Restores initial verified products, categories, and business details from project source.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            {lang === 'mr' ? 'डेटा रीसेट करा' : 'Reset to Defaults'}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        lang={lang}
        titleEn="Reset All Content to Initial Defaults?"
        titleMr="सर्व सामग्री सुरुवातीच्या स्थितीत पुनर्संचयित करायची आहे का?"
        messageEn="This will discard any local edits made during this session and restore the initial sample products, categories, and verified business defaults."
        messageMr="यामुळे आपण केलेले सर्व स्थानिक बदल पुसले जातील आणि सुरुवातीची मूळ उत्पादने व माहिती पूर्ववत होईल."
        confirmLabelEn="Yes, Reset Everything"
        confirmLabelMr="होय, सर्व पूर्ववत करा"
        cancelLabelEn="Cancel"
        cancelLabelMr="रद्द करा"
        isDestructive={true}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Import Modal */}
      {isImportModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200/90 p-6 space-y-4 ring-1 ring-black/[0.03]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                {lang === 'mr' ? 'JSON बॅकअप मजकूर पेस्ट करा' : 'Paste JSON Backup Content'}
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste valid JSON string here..."
              className="w-full p-3.5 text-xs font-mono rounded-xl border border-stone-200 bg-stone-50/50 focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98"
              >
                {lang === 'mr' ? 'आयात करा' : 'Import JSON'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
