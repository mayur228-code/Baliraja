import { useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Save, 
  AlertCircle,
  Trash2,
  Building2,
  RefreshCw
} from 'lucide-react';
import type { Brand, Language } from '../../types';
import { uploadImageToServer } from '../services/uploadService';

interface BrandEditorModalProps {
  isOpen: boolean;
  brand: Brand | null;
  lang: Language;
  nextOrder: number;
  onClose: () => void;
  onSave: (brand: Brand) => void;
}

export const BrandEditorModal: FC<BrandEditorModalProps> = ({
  isOpen,
  brand,
  lang,
  nextOrder,
  onClose,
  onSave,
}) => {
  const isEdit = Boolean(brand);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<Brand>(() => {
    if (brand) return { ...brand };
    return {
      id: `brand-${Date.now()}`,
      name: '',
      logo: '',
      order: nextOrder,
    };
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setValidationError(null);
    if (!file.type.startsWith('image/')) {
      setValidationError(
        lang === 'mr'
          ? 'कृपया केवळ प्रतिमा फाइल (PNG, SVG, JPG, WebP) निवडा.'
          : 'Please select an image file (PNG, SVG, JPG, WebP).'
      );
      return;
    }

    setIsUploading(true);
    try {
      const uploadRes = await uploadImageToServer(file, 'brand');
      if (uploadRes.success && uploadRes.url) {
        setFormData((prev) => ({ ...prev, logo: uploadRes.url! }));
      } else {
        setValidationError(
          uploadRes.error || (lang === 'mr' ? 'लोगो अपलोड अयशस्वी.' : 'Logo upload failed.')
        );
      }
    } catch {
      setValidationError(
        lang === 'mr'
          ? 'फाइल अपलोड करण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
          : 'Failed to upload logo file. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.name.trim()) {
      setValidationError(
        lang === 'mr' ? 'ब्रँडचे नाव प्रविष्ट करणे आवश्यक आहे.' : 'Brand name is required.'
      );
      return;
    }

    if (!formData.logo.trim()) {
      setValidationError(
        lang === 'mr' ? 'ब्रँडचा लोगो अपलोड करणे किंवा मार्ग देणे आवश्यक आहे.' : 'Brand logo is required.'
      );
      return;
    }

    let finalLogo = formData.logo.trim();
    if (finalLogo.startsWith('data:image/')) {
      try {
        const up = await uploadImageToServer(finalLogo, 'brand');
        if (up.success && up.url) {
          finalLogo = up.url;
        }
      } catch {
        // preserve
      }
    }

    onSave({
      ...formData,
      logo: finalLogo,
      name: formData.name.trim(),
      order: Number(formData.order) || nextOrder,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-modal-title"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-stone-50/80 border-b border-stone-200/80 text-stone-900 flex items-center justify-between">
          <div>
            <h2 id="brand-modal-title" className="text-base sm:text-lg font-bold font-serif flex items-center gap-2 leading-normal overflow-visible text-stone-900">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <span>
                {isEdit
                  ? (lang === 'mr' ? 'ब्रँड तपशील संपादित करा' : 'Edit Partner Brand')
                  : (lang === 'mr' ? 'नवीन ब्रँड जोडा' : 'Add New Partner Brand')}
              </span>
              {isEdit && (
                <span className="text-[10px] font-mono bg-emerald-50 px-2 py-0.5 rounded-full text-emerald-800 border border-emerald-200">
                  ID: {formData.id}
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed overflow-visible">
              {lang === 'mr'
                ? 'बळीराजा कृषी सेवा केंद्रामार्फत विक्री होणाऱ्या कंपनीचा लोगो व तपशील भरा.'
                : 'Configure agricultural partner brand logos featured on the Home showcase.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/70 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{validationError}</span>
            </div>
          )}

          {/* Brand Name & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {lang === 'mr' ? 'ब्रँड / कंपनीचे नाव *' : 'Brand / Company Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setValidationError(null);
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                }}
                placeholder="e.g. Katyayani Organics, Bayer, Syngenta"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
              <p className="mt-1 text-[11px] text-stone-500 leading-relaxed">
                {lang === 'mr'
                  ? 'कंपनी किंवा ब्रँडचे नाव एकदाच भरा (ट्रेडमार्क इंग्रजी व मराठी दोन्ही आवृत्तींमध्ये सुरक्षित राहतो).'
                  : 'Enter brand name once (official trade names and logos are preserved across both languages).'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-900 mb-1.5">
                {lang === 'mr' ? 'प्रदर्शन क्रम (Order)' : 'Display Sequence'}
              </label>
              <input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 1 }))}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
              />
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-900">
              {lang === 'mr' ? 'कंपनीचा लोगो (Logo Image) *' : 'Company Logo Image *'}
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Drag & Drop or Click Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isUploading
                  ? 'border-emerald-400 bg-emerald-50/40 text-emerald-800 opacity-75'
                  : isDragOver
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900'
                  : 'border-stone-300 hover:border-emerald-400 bg-stone-50/70 hover:bg-emerald-50/30 text-stone-600'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs border border-stone-200 flex items-center justify-center text-emerald-700">
                  {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <div className="text-xs font-bold text-stone-800">
                  {isUploading
                    ? (lang === 'mr' ? 'लोगो अपलोड होत आहे...' : 'Uploading logo...')
                    : lang === 'mr'
                    ? 'लोगो अपलोड करण्यासाठी येथे क्लिक करा किंवा ड्रॅग करा'
                    : 'Click to upload logo or drag & drop file'}
                </div>
                <div className="text-[11px] text-stone-500">
                  PNG, SVG, JPG, WebP (Transparent background recommended)
                </div>
              </div>
            </div>

            {/* Direct asset path or URL */}
            <div>
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">
                {lang === 'mr' ? 'किंवा प्रतिमेचा मार्ग / URL प्रविष्ट करा:' : 'Or enter image asset path / URL:'}
              </div>
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => {
                  setValidationError(null);
                  setFormData((prev) => ({ ...prev, logo: e.target.value }));
                }}
                placeholder="/assets/brand/sample-brand.png or data:image/..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 font-mono text-stone-700 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Live Logo Preview Card matching public website display */}
            {formData.logo && (
              <div className="p-4 rounded-2xl bg-stone-100/80 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'mr' ? 'थेट कार्ड पूर्वावलोकन (Live Preview)' : 'Live Showcase Preview'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                    className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'काढा' : 'Remove'}</span>
                  </button>
                </div>

                <div className="flex justify-center p-4">
                  <div className="w-48 h-24 flex items-center justify-center p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                    <img
                      src={formData.logo}
                      alt="Brand preview"
                      className="max-h-full max-w-[150px] w-auto h-auto object-contain"
                      onError={() => {
                        setValidationError(
                          lang === 'mr'
                            ? 'दिलेली प्रतिमा लोड करता आली नाही. कृपया मार्ग तपासा.'
                            : 'Failed to load preview image from provided path.'
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>
                {isEdit
                  ? (lang === 'mr' ? 'बदल जतन करा' : 'Save Changes')
                  : (lang === 'mr' ? 'ब्रँड जोडा' : 'Add Brand')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandEditorModal;
