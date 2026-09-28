import type { FC, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { 
  AlertTriangle, 
  Search, 
  Package, 
  Layers, 
  Building2, 
  Camera, 
  Award, 
  RefreshCw, 
  ArrowLeft, 
  Home, 
  Lock, 
  ShieldAlert, 
  WifiOff, 
  ServerCrash, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import type { Language, NavCategory } from '../../types';
import logoImg from '../../assets/logo.png';

/**
 * ─────────────────────────────────────────────────────────────
 * 1. EmptyStateView: Unified Empty State Component
 * ─────────────────────────────────────────────────────────────
 */
export interface EmptyStateViewProps {
  type?: 'products' | 'categories' | 'brands' | 'field_visits' | 'results' | 'search' | 'generic';
  lang?: Language;
  title?: string;
  titleEn?: string;
  titleMr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionMr?: string;
  searchQuery?: string;
  actionLabel?: string;
  actionLabelEn?: string;
  actionLabelMr?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionLabelEn?: string;
  secondaryActionLabelMr?: string;
  onSecondaryAction?: () => void;
  icon?: ReactNode;
  className?: string;
  isCompact?: boolean;
}

export const EmptyStateView: FC<EmptyStateViewProps> = ({
  type = 'generic',
  lang = 'mr',
  title,
  titleEn,
  titleMr,
  description,
  descriptionEn,
  descriptionMr,
  searchQuery,
  actionLabel,
  actionLabelEn,
  actionLabelMr,
  onAction,
  secondaryActionLabel,
  secondaryActionLabelEn,
  secondaryActionLabelMr,
  onSecondaryAction,
  icon,
  className = '',
  isCompact = false
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Default localized strings based on type
  const getDefaultStrings = () => {
    switch (type) {
      case 'products':
        return {
          title: lang === 'mr' ? 'कोणतीही उत्पादने सापडली नाहीत' : 'No Products Available',
          desc: lang === 'mr' 
            ? 'या वर्गवारीत किंवा निकषांमध्ये सध्या उत्पादने उपलब्ध नाहीत. लवकरच नवीन साठा जोडला जाईल.' 
            : 'No products match this selection right now. New inventory will arrive soon.',
          action: lang === 'mr' ? 'फिल्टर्स पूर्ववत करा' : 'Reset Filters',
          Icon: Package
        };
      case 'categories':
        return {
          title: lang === 'mr' ? 'कोणतीही वर्गवारी सापडली नाही' : 'No Categories Found',
          desc: lang === 'mr' 
            ? 'सध्या कोणतीही वर्गवारी उपलब्ध नाही.' 
            : 'No categories are currently configured in this section.',
          action: lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Back to Home',
          Icon: Layers
        };
      case 'brands':
        return {
          title: lang === 'mr' ? 'अद्याप कोणतेही ब्रँड्स जोडलेले नाहीत' : 'No Brands Configured',
          desc: lang === 'mr' 
            ? 'अधिकृत कृषी भागीदार ब्रँड्स लवकरच जोडले जातील.' 
            : 'Partner agricultural brands will appear here once configured.',
          action: lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Back to Home',
          Icon: Building2
        };
      case 'field_visits':
        return {
          title: lang === 'mr' ? 'कोणतीही शेत भेट छायाचित्रे उपलब्ध नाहीत' : 'No Field Visit Records',
          desc: lang === 'mr' 
            ? 'शेत भेट छायाचित्रे व माहिती लवकरच येथे प्रदर्शित केली जाईल.' 
            : 'Field visit photographs and farmer guidance records will appear here soon.',
          action: lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Back to Home',
          Icon: Camera
        };
      case 'results':
        return {
          title: lang === 'mr' ? 'कोणतेही शेतकरी निकाल उपलब्ध नाहीत' : 'No Farmer Yield Results',
          desc: lang === 'mr' 
            ? 'शेतकरी पीक निकालांची छायाचित्रे लवकरच येथे प्रदर्शित केली जातील.' 
            : 'Real farmer crop yield success records will appear here soon.',
          action: lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Back to Home',
          Icon: Award
        };
      case 'search':
        return {
          title: searchQuery 
            ? (lang === 'mr' ? `"${searchQuery}" साठी काहीही सापडले नाही` : `No results found for "${searchQuery}"`)
            : (lang === 'mr' ? 'कोणताही शोध निकाल सापडला नाही' : 'No matching results found'),
          desc: lang === 'mr' 
            ? 'कृपया वेगळा शोध शब्द वापरा किंवा फिल्टर्स रीसेट करून पुन्हा प्रयत्न करा.' 
            : 'Try checking for spelling errors or adjusting your filter criteria.',
          action: lang === 'mr' ? 'शोध पुसा व सर्व दाखवा' : 'Clear Search & Show All',
          Icon: Search
        };
      case 'generic':
      default:
        return {
          title: lang === 'mr' ? 'कोणतीही माहिती उपलब्ध नाही' : 'No Data Available',
          desc: lang === 'mr' 
            ? 'या विभागामध्ये सध्या कोणतीही माहिती उपलब्ध नाही.' 
            : 'There is currently no data available in this view.',
          action: lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Back to Home',
          Icon: Package
        };
    }
  };

  const defaults = getDefaultStrings();
  const displayTitle = (lang === 'mr' ? titleMr : titleEn) || title || defaults.title;
  const displayDesc = (lang === 'mr' ? descriptionMr : descriptionEn) || description || defaults.desc;
  const displayActionLabel = (lang === 'mr' ? actionLabelMr : actionLabelEn) || (actionLabel !== undefined ? actionLabel : defaults.action);
  const displaySecondaryActionLabel = (lang === 'mr' ? secondaryActionLabelMr : secondaryActionLabelEn) || secondaryActionLabel;
  const DefaultIcon = defaults.Icon;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`bg-white rounded-3xl border border-stone-200/90 text-center shadow-xs mx-auto ${
        isCompact ? 'p-6 sm:p-8 max-w-md' : 'p-8 sm:p-12 max-w-lg'
      } ${className}`}
      role="region"
      aria-label={displayTitle}
    >
      {/* Icon Badge */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-2xs">
        {icon || <DefaultIcon className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" />}
      </div>

      {/* Heading & Details */}
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-snug">
          {displayTitle}
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          {displayDesc}
        </p>
      </div>

      {/* Action Buttons */}
      {(onAction || onSecondaryAction) && (
        <div className="pt-5 flex flex-wrap items-center justify-center gap-3">
          {onAction && displayActionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="flow-btn px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{displayActionLabel}</span>
            </button>
          )}

          {onSecondaryAction && displaySecondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="flow-btn flow-btn-light px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-stone-200"
            >
              <span>{displaySecondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 2. NotFoundView: 404 Page Not Found (Global Route Fallback)
 * ─────────────────────────────────────────────────────────────
 */
export interface NotFoundViewProps {
  lang: Language;
  onGoHome: () => void;
  onBrowseProducts?: () => void;
  requestedPath?: string;
}

export const NotFoundView: FC<NotFoundViewProps> = ({
  lang,
  onGoHome,
  onBrowseProducts,
  requestedPath
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 select-none text-left">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-xl p-8 sm:p-12 text-center space-y-6"
      >
        {/* Brand Logo Watermark */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200/90 p-2 flex items-center justify-center shadow-2xs mx-auto">
            <img
              src={logoImg}
              alt="Baliraja Krishi Seva Kendra"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full border-2 border-white shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* 404 Status Code Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-2xs font-extrabold uppercase tracking-wider shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{lang === 'mr' ? 'त्रुटी ४०४ • पृष्ठ आढळले नाही' : 'Error 404 • Page Not Found'}</span>
        </div>

        {/* Title & Detailed Message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-emerald-950 tracking-tight">
            {lang === 'mr' ? 'हे पृष्ठ अस्तित्वात नाही' : 'This Page Could Not Be Found'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            {lang === 'mr'
              ? 'आपण शोधत असलेले पृष्ठ हलवले गेले असावे किंवा त्याचा पत्ता बदलला असावा. कृपया मुख्यपृष्ठावर परत जा किंवा उत्पादनांचा कॅटलॉग पहा.'
              : "The page or link you followed may have been moved, renamed, or is temporarily unavailable. Return to the home catalog to browse products."}
          </p>
          {requestedPath && (
            <div className="pt-2">
              <span className="inline-block px-3 py-1 rounded-lg text-3xs font-mono bg-stone-100 border border-stone-200 text-stone-600">
                {requestedPath}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'mr' ? 'मुख्यपृष्ठावर परत जा' : 'Go to Homepage'}</span>
          </button>

          {onBrowseProducts && (
            <button
              type="button"
              onClick={onBrowseProducts}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-stone-200 active:scale-98"
            >
              <Package className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'mr' ? 'सर्व उत्पादने पहा' : 'Browse All Products'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 3. CategoryNotFoundView: Dedicated Category 404 View
 * ─────────────────────────────────────────────────────────────
 */
export interface CategoryNotFoundViewProps {
  lang: Language;
  requestedCategoryId: string;
  categories: NavCategory[];
  onBackToHome: () => void;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryNotFoundView: FC<CategoryNotFoundViewProps> = ({
  lang,
  requestedCategoryId,
  categories,
  onBackToHome,
  onSelectCategory
}) => {
  return (
    <div className="space-y-8 py-6 text-left">
      {/* Top back navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'mr' ? '← मुख्यपृष्ठावर परत जा' : '← Back to Home'}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 text-center space-y-6 max-w-2xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
          <Layers className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-900 uppercase tracking-wider">
            {lang === 'mr' ? 'वर्गवारी आढळली नाही' : 'Category Not Found'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
            {lang === 'mr'
              ? `"${requestedCategoryId}" ही वर्गवारी उपलब्ध नाही`
              : `Category "${requestedCategoryId}" does not exist`}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            {lang === 'mr'
              ? 'कृपया खालील उपलब्ध कृषी वर्गवाऱ्यांमधून निवडा किंवा मुख्यपृष्ठावर जाऊन इतर उत्पादने शोधा.'
              : 'Choose from our verified agricultural categories below or return to the main catalog.'}
          </p>
        </div>

        {/* Available Categories Grid Chips */}
        {categories && categories.length > 0 && (
          <div className="pt-2">
            <h4 className="text-2xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              {lang === 'mr' ? 'उपलब्ध वर्गवाऱ्या निवडा:' : 'Available Categories:'}
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCategory(c.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-900 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                >
                  {lang === 'mr' ? c.nameMr : c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-stone-100 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="flow-btn px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>{lang === 'mr' ? 'मुख्य कॅटलॉगवर परत जा' : 'Return to Home Catalog'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 4. ErrorStateView: Server 500 / 503 / Network / API Failure
 * ─────────────────────────────────────────────────────────────
 */
export interface ErrorStateViewProps {
  type?: 'network' | 'server' | 'service_unavailable' | 'unknown';
  lang?: Language;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export const ErrorStateView: FC<ErrorStateViewProps> = ({
  type = 'network',
  lang = 'mr',
  title,
  message,
  onRetry,
  onGoHome,
  className = ''
}) => {
  const getDetails = () => {
    switch (type) {
      case 'server':
        return {
          title: lang === 'mr' ? 'सर्व्हर त्रुटी आली (500 Server Error)' : 'Server Error (500)',
          message: lang === 'mr'
            ? 'सर्व्हरशी संपर्क साधताना अडचण आली. कृपया काही वेळाने पुन्हा प्रयत्न करा.'
            : 'The server encountered an unexpected condition. Please try again shortly.',
          Icon: ServerCrash
        };
      case 'service_unavailable':
        return {
          title: lang === 'mr' ? 'सेवा तात्पुरती अनुपलब्ध (503 Service Unavailable)' : 'Service Unavailable (503)',
          message: lang === 'mr'
            ? 'सर्व्हर सध्या व्यस्त किंवा मेंटेनन्स मोडमध्ये आहे. कृपया थोड्या वेळाने प्रयत्न करा.'
            : 'The service is temporarily overloaded or undergoing maintenance. Please retry.',
          Icon: ServerCrash
        };
      case 'network':
      default:
        return {
          title: lang === 'mr' ? 'इंटरनेट / नेटवर्क कनेक्शन त्रुटी' : 'Network / Connection Failure',
          message: lang === 'mr'
            ? 'सर्व्हरशी संपर्क साधता आला नाही. कृपया आपले इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.'
            : 'Unable to reach the server. Please check your internet connection and retry.',
          Icon: WifiOff
        };
    }
  };

  const details = getDetails();
  const IconComp = details.Icon;

  return (
    <div className={`p-8 sm:p-12 rounded-3xl bg-white border border-red-200 text-center space-y-5 max-w-lg mx-auto shadow-xs ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
        <IconComp className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
          {title || details.title}
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
          {message || details.message}
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flow-btn px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'mr' ? 'पुन्हा प्रयत्न करा (Retry)' : 'Try Again'}</span>
          </button>
        )}

        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-stone-200"
          >
            {lang === 'mr' ? 'मुख्यपृष्ठावर जा' : 'Back to Home'}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 5. UnauthorizedStateView: 401 / 403 Session Expired State
 * ─────────────────────────────────────────────────────────────
 */
export interface UnauthorizedStateViewProps {
  lang?: Language;
  onLoginClick: () => void;
  onBackToHome: () => void;
  message?: string;
}

export const UnauthorizedStateView: FC<UnauthorizedStateViewProps> = ({
  lang = 'mr',
  onLoginClick,
  onBackToHome,
  message
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-white border border-amber-200 text-center space-y-5 max-w-md mx-auto shadow-sm my-8">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-3xs font-extrabold uppercase tracking-wider">
          {lang === 'mr' ? 'प्रवेशासाठी प्रमाणीकरण आवश्यक (401/403)' : 'Authentication Required (401/403)'}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
          {lang === 'mr' ? 'प्रशासक सत्र कालबाह्य झाले आहे' : 'Administrator Session Expired'}
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          {message || (lang === 'mr'
            ? 'सुरक्षेच्या कारणास्तव आपले सत्र संपले आहे. कृपया प्रशासकीय पोर्टलवर पुन्हा लॉगिन करा.'
            : 'For security reasons, your active session has expired. Please sign in again to continue managing the portal.')}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onLoginClick}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{lang === 'mr' ? 'पुन्हा लॉगिन करा' : 'Sign In Again'}</span>
        </button>

        <button
          type="button"
          onClick={onBackToHome}
          className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-stone-200"
        >
          {lang === 'mr' ? 'मुख्य संकेतस्थळ' : 'Public Website'}
        </button>
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * 6. SuccessStateView: Action Completed Feedback State
 * ─────────────────────────────────────────────────────────────
 */
export interface SuccessStateViewProps {
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const SuccessStateView: FC<SuccessStateViewProps> = ({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}) => {
  return (
    <div className={`p-8 sm:p-10 rounded-3xl bg-white border border-emerald-200 text-center space-y-5 max-w-md mx-auto shadow-xs ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200/90 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-snug">
          {title}
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed">
          {description}
        </p>
      </div>

      {(onPrimaryAction || onSecondaryAction) && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {onPrimaryAction && primaryActionLabel && (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>{primaryActionLabel}</span>
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-stone-200"
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
