import { useEffect } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  MessageCircle, 
  ArrowLeft, 
  PackageCheck
} from 'lucide-react';
import type { Language, Product, NavCategory } from '../../types';
import { translations } from '../../data/translations';
import { useContentStore } from '../../data/contentStore';

interface ProductDetailModalProps {
  product: Product | null;
  category?: NavCategory;
  lang: Language;
  onClose: () => void;
  onContactClick: () => void;
}

export const ProductDetailModal: FC<ProductDetailModalProps> = ({
  product,
  lang,
  onClose,
  onContactClick
}) => {
  const shouldReduceMotion = useReducedMotion();
  const t = translations[lang];
  const { businessInfo } = useContentStore();

  // Close on Escape key press and lock background scroll
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [product, onClose]);

  if (!product) return null;

  const primaryName = (lang === 'mr' ? product.nameMarathi : product.nameEnglish) || product.nameEnglish || product.nameMarathi || '';
  const secondaryName = (lang === 'mr' ? product.nameEnglish : product.nameMarathi) || '';

  // Independent Product Price Formatter
  const formatDetailPrice = (priceVal: number | string | undefined): { text: string; isReal: boolean } => {
    if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
      if (typeof priceVal === 'number') {
        return { text: `₹${priceVal.toLocaleString('en-IN')}`, isReal: true };
      }
      const str = String(priceVal).trim();
      if (str.startsWith('₹')) return { text: str, isReal: true };
      const num = Number(str.replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 0) return { text: `₹${num.toLocaleString('en-IN')}`, isReal: true };
      return { text: str, isReal: true };
    }
    return { text: lang === 'mr' ? 'दर चौकशी करा' : 'Price on Request', isReal: false };
  };

  const priceInfo = formatDetailPrice(product.price);
  const isAvailable = product.availability === 'available';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-product-title"
      >
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-md cursor-pointer"
          aria-hidden="true"
        />

        {/* Modal Container */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 16 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' as const }}
          className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/80 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100/80 bg-stone-50/80 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>{t.backToCatalog}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={t.closeDetailModal}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Modal Scrollable Body - Clean Minimal Product View (Name + Price + Status) */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 items-center">
              
              {/* Product Image Presentation */}
              <div className="sm:col-span-5 flex justify-center">
                <div className="relative aspect-square w-full max-w-[260px] bg-gradient-to-b from-stone-50/90 to-stone-100/60 rounded-2xl border border-stone-200/80 p-6 flex items-center justify-center shadow-inner select-none">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={primaryName}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <PackageCheck className="w-16 h-16 text-stone-300" aria-hidden="true" />
                  )}
                </div>
              </div>

              {/* Product Core Information: Name, Price, Status */}
              <div className="sm:col-span-7 space-y-4 text-left">
                
                {/* Status / Availability & Featured Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-stone-100 text-stone-600 border-stone-300'
                    }`}
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span>{t.availabilityAvailable}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                        <span>{t.availabilityOutOfStock}</span>
                      </>
                    )}
                  </span>

                  {product.featured && (
                    <span className="inline-flex items-center gap-1 bg-amber-500/95 text-white backdrop-blur-md text-3xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs border border-amber-300/60">
                      ★ {lang === 'mr' ? 'वैशिष्ट्यीकृत' : 'Featured'}
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <div className="space-y-1">
                  <h2 
                    id="modal-product-title" 
                    className="text-xl sm:text-2xl font-bold font-serif text-stone-900 tracking-tight leading-snug"
                  >
                    {primaryName}
                  </h2>
                  {secondaryName && secondaryName !== primaryName && (
                    <p className="text-xs sm:text-sm font-medium text-stone-400">
                      {secondaryName}
                    </p>
                  )}
                </div>

                {/* Product Price Display */}
                <div className="flex items-baseline gap-2.5 pt-1 pb-1">
                  <span className="text-xs font-semibold text-stone-500">{lang === 'mr' ? 'किंमत:' : 'Price:'}</span>
                  <span className={priceInfo.isReal ? 'text-2xl sm:text-3xl font-extrabold font-serif text-emerald-950 tracking-tight' : 'text-sm font-semibold text-stone-600 italic'}>
                    {priceInfo.text}
                  </span>
                  {product.featured && (
                    <span className="ml-2 inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider">
                      ★ {lang === 'mr' ? 'वैशिष्ट्यीकृत' : 'Featured'}
                    </span>
                  )}
                </div>

                {/* Informational Inquiry Actions */}
                <div className="pt-3 border-t border-stone-200 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* Primary Contact Route Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onContactClick();
                      }}
                      className="flow-btn flex-1 inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
                    >
                      <Phone className="w-4 h-4" aria-hidden="true" />
                      <span>{t.inquireProductBtn}</span>
                    </button>

                    {/* Direct WhatsApp Inquiry Link */}
                    <a
                      href={`https://wa.me/91${businessInfo.whatsapp || '9881070520'}?text=${encodeURIComponent(
                        `नमस्ते बळीराजा कृषी सेवा केंद्र, मला या उत्पादनाबाबत अधिक माहिती हवी आहे: ${primaryName}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flow-btn inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl border border-stone-700 cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-hidden"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                      <span>{t.whatsappChat}</span>
                    </a>
                  </div>

                  <p className="text-3xs text-stone-400 text-left">
                    {lang === 'mr' 
                      ? `केंद्राशी थेट संपर्क: ${businessInfo.phone || '9881070520'}`
                      : `Direct Store Contact: ${businessInfo.phone || '9881070520'}`}
                  </p>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
