import { useState, useRef } from 'react';
import type { FC, FormEvent, ChangeEvent } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  AlertCircle, 
  Eye, 
  Plus, 
  Loader2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import type { NavCategory, NavSubcategory, Language } from '../../types';
import { AVAILABLE_CATEGORY_ICONS } from '../../lib/categoryIcons';
import { CategoryCard } from '../../components/products/CategoryCard';
import { translateText } from '../services/translationService';
import { uploadImageToServer } from '../services/uploadService';

interface CategoryEditorModalProps {
  isOpen: boolean;
  lang: Language;
  mode?: 'create' | 'edit';
  category: NavCategory | null; // null = create new
  existingCategories: NavCategory[];
  onClose: () => void;
  onSave: (cat: NavCategory) => void | Promise<void>;
}

const PRESET_IMAGES = [
  { id: 'fertilizers', labelEn: 'Fertilizers', url: '/assets/categories/fertilizers.png' },
  { id: 'seeds', labelEn: 'Seeds', url: '/assets/categories/seeds.png' },
  { id: 'crop-protection', labelEn: 'Crop Protection', url: '/assets/categories/crop-protection.png' },
  { id: 'combos', labelEn: 'Combo Kits', url: '/assets/categories/combos.png' },
];

export const CategoryEditorModal: FC<CategoryEditorModalProps> = ({
  isOpen,
  lang,
  mode,
  category,
  existingCategories,
  onClose,
  onSave
}) => {
  const isEdit = mode === 'edit' || Boolean(category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview language toggle inside modal
  const [previewLang, setPreviewLang] = useState<Language>(lang);
  const [isTranslating, setIsTranslating] = useState(false);

  const [formData, setFormData] = useState<NavCategory>(() => {
    const isFeatured = Boolean(category?.featured || category?.highlight);
    if (category) {
      return { 
        ...category,
        featured: isFeatured,
        highlight: isFeatured,
        subcategories: category.subcategories ? [...category.subcategories] : []
      };
    }
    const maxOrder = existingCategories.reduce((max, c) => Math.max(max, c.order || 0), 0);
    return {
      id: '',
      slug: '',
      name: '',
      nameMr: '',
      image: '/assets/categories/fertilizers.png',
      icon: 'Layers',
      shortDesc: '',
      shortDescMr: '',
      subcategories: [],
      featured: false,
      highlight: false,
      order: maxOrder + 1,
      active: true
    };
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [newSubcatEn, setNewSubcatEn] = useState('');
  const [newSubcatMr, setNewSubcatMr] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  if (!isOpen) return null;

  // Handle file upload -> upload directly to secure server storage
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError(
        lang === 'mr' 
          ? 'कृपया वैध प्रतिमा फाईल निवडा (PNG, JPG, WebP, SVG).' 
          : 'Please select a valid image file (PNG, JPG, WebP, SVG).'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError(
        lang === 'mr' 
          ? 'प्रतिमेचा आकार १०MB पेक्षा कमी असावा.' 
          : 'Image file size should be less than 10MB.'
      );
      return;
    }

    setIsUploadingImage(true);
    setValidationError(null);

    try {
      const uploadRes = await uploadImageToServer(file, 'cat');
      if (uploadRes.success && uploadRes.url) {
        setFormData((prev) => ({ ...prev, image: uploadRes.url! }));
      } else {
        setValidationError(
          uploadRes.error || (lang === 'mr' ? 'प्रतिमा अपलोड अयशस्वी.' : 'Image upload failed.')
        );
      }
    } catch {
      setValidationError(lang === 'mr' ? 'प्रतिमा अपलोड करताना त्रुटी आली.' : 'Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Add subcategory
  const handleAddSubcategory = () => {
    if (!newSubcatEn.trim()) return;
    const subId = newSubcatEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSub: NavSubcategory = {
      id: subId,
      name: newSubcatEn.trim(),
      nameMr: newSubcatMr.trim() || newSubcatEn.trim()
    };
    setFormData((prev) => ({
      ...prev,
      subcategories: [...(prev.subcategories || []), newSub]
    }));
    setNewSubcatEn('');
    setNewSubcatMr('');
  };

  const handleRemoveSubcategory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subcategories: (prev.subcategories || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const nameEn = formData.name.trim();

    if (!nameEn) {
      setValidationError(lang === 'mr' ? 'इंग्रजी नाव आवश्यक आहे.' : 'Category English name is required.');
      return;
    }

    // English name duplicate check
    const duplicate = existingCategories.some((c) => {
      if (isEdit && category && (c.id === category.id || c.slug === category.id)) return false;
      return c.name.toLowerCase().trim() === nameEn.toLowerCase();
    });
    if (duplicate) {
      setValidationError(
        lang === 'mr'
          ? `"${nameEn}" या नावाची वर्गवारी आधीच अस्तित्वात आहे. कृपया वेगळे नाव द्या.`
          : `A category named "${nameEn}" already exists. Please choose a distinct name.`
      );
      return;
    }

    // Determine ID (strictly immutable when editing)
    let finalId = '';
    if (isEdit && category) {
      finalId = category.id; // STRICTLY IMMUTABLE
    } else {
      finalId = formData.id.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!finalId) finalId = `cat-${Date.now()}`;
      if (existingCategories.some((c) => c.id === finalId)) {
        setValidationError(
          lang === 'mr'
            ? `"${finalId}" आयडी असलेली श्रेणी आधीच अस्तित्वात आहे.`
            : `A category with ID "${finalId}" already exists. Please choose a distinct name or ID.`
        );
        return;
      }
    }

    setIsTranslating(true);
    let finalNameMr = '';
    try {
      finalNameMr = await translateText(nameEn, 'en', 'mr');
    } catch {
      finalNameMr = (isEdit && category?.nameMr) ? category.nameMr : nameEn;
    }

    let finalShortDescMr = formData.shortDescMr?.trim() || '';
    if (formData.shortDesc?.trim() && (!finalShortDescMr || formData.shortDesc.trim() !== category?.shortDesc)) {
      try {
        finalShortDescMr = await translateText(formData.shortDesc.trim(), 'en', 'mr');
      } catch {
        finalShortDescMr = finalShortDescMr || formData.shortDesc.trim();
      }
    }

    let finalImage = formData.image;
    if (finalImage && finalImage.startsWith('data:image/')) {
      try {
        const up = await uploadImageToServer(finalImage, 'cat');
        if (up.success && up.url) {
          finalImage = up.url;
        }
      } catch {
        // preserve
      }
    }

    const finalCategory: NavCategory = {
      ...formData,
      image: finalImage,
      id: finalId, // Guaranteed immutable when isEdit
      slug: (isEdit && category?.slug) ? category.slug : finalId,
      name: nameEn,
      nameMr: finalNameMr || nameEn,
      shortDesc: formData.shortDesc?.trim() || '',
      shortDescMr: finalShortDescMr,
      order: Number(formData.order) || 1,
      active: formData.active !== false,
      featured: Boolean(formData.featured || formData.highlight),
      highlight: Boolean(formData.highlight || formData.featured),
      subcategories: Array.isArray(formData.subcategories) ? formData.subcategories : []
    };

    try {
      await onSave(finalCategory);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-stone-50/80 border-b border-stone-200/80 text-stone-900 flex items-center justify-between">
          <div>
            <h2 id="category-modal-title" className="text-base sm:text-lg font-bold font-serif flex items-center gap-2 leading-normal overflow-visible text-stone-900">
              <span>
                {isEdit 
                  ? (lang === 'mr' ? 'वर्गवारी संपादित करा' : 'Edit Category')
                  : (lang === 'mr' ? 'नवीन वर्गवारी जोडा' : 'Add New Category')
                }
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {formData.id || (lang === 'mr' ? 'नवीन' : 'New')}
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed overflow-visible">
              {lang === 'mr' 
                ? 'येथे केलेला बदल मुख्यपृष्ठ, नेव्हिगेशन मेनू, फिल्टर्स आणि कॅटलॉगमध्ये तात्काळ परावर्तित होईल.' 
                : 'Changes saved here sync immediately across Home cards, Navbar dropdown, and Product filters.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/70 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {validationError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{validationError}</span>
            </div>
          )}

          {/* 2-Column Layout: Form Controls on Left, Live Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Category Attributes (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Category Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  {lang === 'mr' ? 'वर्गवारी नाव (इंग्रजी) *' : 'Category Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setValidationError(null);
                    const val = e.target.value;
                    setFormData((prev) => ({ 
                      ...prev, 
                      name: val,
                      id: isEdit ? prev.id : (prev.id || val.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                    }));
                  }}
                  placeholder="e.g. Bio-Fertilizers"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
                />

                {/* Auto-Translation Information Pill */}
                <div className="p-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate leading-relaxed">
                      {lang === 'mr'
                        ? 'मराठी नाव जतन करताना स्वयंचलितपणे तयार केले जाईल.'
                        : 'Marathi name will be automatically translated on save.'}
                    </span>
                  </div>
                  {formData.nameMr && (
                    <span className="font-bold text-emerald-950 px-2 py-0.5 bg-white rounded-md border border-emerald-300/60 shrink-0 text-xs">
                      {formData.nameMr}
                    </span>
                  )}
                </div>
              </div>

              {/* Unique ID & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    {lang === 'mr' ? 'श्रेणी आयडी (Unique ID) *' : 'Category ID (System Key) *'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEdit}
                    value={formData.id}
                    onChange={(e) => {
                      setValidationError(null);
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
                      setFormData((prev) => ({ ...prev, id: clean }));
                    }}
                    placeholder="e.g. bio-fertilizers"
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono ${
                      isEdit
                        ? 'bg-stone-100 text-stone-500 border-stone-200 cursor-not-allowed'
                        : 'border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                    }`}
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    {isEdit 
                      ? (lang === 'mr' ? 'उत्पादनांशी जोडणी कायम ठेवण्यासाठी आयडी सुरक्षित ठेवला जातो.' : 'Locked to preserve product associations.')
                      : (lang === 'mr' ? 'केवळ लहान इंग्रजी अक्षरे व हायफन वापरा.' : 'Used in URLs and product linking.')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    {lang === 'mr' ? 'प्रदर्शन क्रम (Display Order)' : 'Display Sequence'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    {lang === 'mr' ? 'कमी क्रमांक आधी दिसेल (उदा. १, २, ३...)' : 'Lower numbers appear first on the website.'}
                  </span>
                </div>
              </div>

              {/* Short Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    {lang === 'mr' ? 'संक्षिप्त वर्णन (इंग्रजी)' : 'Short Description (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.shortDesc || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shortDesc: e.target.value }))}
                    placeholder="e.g. High-efficiency bio-stimulants and microbial inputs"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    {lang === 'mr' ? 'संक्षिप्त वर्णन (मराठी)' : 'Short Description (Marathi)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.shortDescMr || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shortDescMr: e.target.value }))}
                    placeholder="उदा. उच्च कार्यक्षम जैविक खते व सूक्ष्मजीवाणू संवर्धक"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  {lang === 'mr' ? 'कृषी चिन्ह निवडा (Agricultural Icon)' : 'Select Category Icon'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-2xl border border-stone-200">
                  {AVAILABLE_CATEGORY_ICONS.map((opt) => {
                    const isSelected = (formData.icon || 'Layers') === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon: opt.id }))}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs ring-1 ring-emerald-600'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-300' : 'text-emerald-700'}`} />
                        <span className="text-[10px] font-bold truncate">
                          {lang === 'mr' ? opt.nameMr : opt.nameEn.split('/')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Image Upload / Preset Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-stone-900">
                  {lang === 'mr' ? 'वर्गवारी छायाचित्र (Category Image)' : 'Category Image'}
                </label>

                {/* Upload or URL Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-2xs"
                  >
                    {isUploadingImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span>
                      {isUploadingImage
                        ? (lang === 'mr' ? 'अपलोड होत आहे...' : 'Uploading...')
                        : (lang === 'mr' ? 'फोटो अपलोड करा' : 'Upload Image')}
                    </span>
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={formData.image || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                      placeholder="/assets/categories/... or https://..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Preset Fast Picker */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] text-stone-500 font-semibold">
                    {lang === 'mr' ? 'किंवा तयार फोटो निवडा:' : 'Or choose preset:'}
                  </span>
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        formData.image === preset.url
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {preset.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories Editor */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-900">
                    {lang === 'mr' ? 'उपवर्ग सूची (नेव्हिगेशन मेनूसाठी)' : 'Subcategories (For Mega Menu)'}
                  </label>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {formData.subcategories?.length || 0} subcategories
                  </span>
                </div>

                {/* Existing Subcategories Pills */}
                {formData.subcategories && formData.subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.subcategories.map((sub, idx) => (
                      <span
                        key={sub.id || idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 shadow-2xs"
                      >
                        <span className="font-semibold">{sub.name}</span>
                        <span className="text-stone-300">/</span>
                        <span className="text-emerald-800 font-bold leading-relaxed">{sub.nameMr}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(idx)}
                          className="text-stone-400 hover:text-red-600 p-0.5 cursor-pointer ml-1"
                          title="Remove subcategory"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 italic leading-relaxed">
                    {lang === 'mr' 
                      ? 'या श्रेणीमध्ये अद्याप कोणतेही उपवर्ग जोडलेले नाहीत.' 
                      : 'No subcategories defined yet (optional).'}
                  </p>
                )}

                {/* Add Subcategory Inputs */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubcatEn}
                    onChange={(e) => setNewSubcatEn(e.target.value)}
                    placeholder="Subcategory (EN)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                  <input
                    type="text"
                    value={newSubcatMr}
                    onChange={(e) => setNewSubcatMr(e.target.value)}
                    placeholder="उपवर्ग (MR)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'जोडा' : 'Add'}</span>
                  </button>
                </div>
              </div>

              {/* Active Toggle & Highlight */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active !== false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded-md border-stone-300 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      {lang === 'mr' ? 'सक्रिय श्रेणी (Active on Website)' : 'Active Category'}
                    </span>
                    <span className="text-[11px] text-stone-500 block leading-relaxed">
                      {lang === 'mr'
                        ? 'सक्रिय असताना ही श्रेणी मुख्यपृष्ठावर, नेव्हिगेशनमध्ये व उत्पादनांमध्ये थेट दिसेल.'
                        : 'When checked, this category appears publicly across the site.'}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer pt-2.5 border-t border-stone-200/80">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.featured || formData.highlight)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({ 
                        ...prev, 
                        featured: checked,
                        highlight: checked 
                      }));
                    }}
                    className="w-4 h-4 text-emerald-600 rounded-md border-stone-300 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      {lang === 'mr' ? 'विशेष वर्गवारी (Featured Category)' : 'Featured / Highlight Category'}
                    </span>
                    <span className="text-[11px] text-stone-500 block leading-relaxed">
                      {lang === 'mr'
                        ? 'मुख्यपृष्ठावरील कार्डवर "विशेष" (Featured) बॅज दर्शवतो.'
                        : 'Displays a distinctive "Featured" badge and glowing accent on website cards.'}
                    </span>
                  </div>
                </label>
              </div>

            </div>

            {/* Right Column: Live Card Preview (5 cols on lg) */}
            <div className="lg:col-span-5 bg-stone-100/70 p-5 rounded-3xl border border-stone-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>{lang === 'mr' ? 'थेट कार्ड पूर्वावलोकन' : 'Live Frontend Preview'}</span>
                  </div>

                  {/* Language switch for preview */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setPreviewLang('mr')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        previewLang === 'mr' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      मराठी
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLang('en')}
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        previewLang === 'en' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 my-2 leading-relaxed">
                  {lang === 'mr'
                    ? 'मुख्यपृष्ठावरील "Explore Our Category" विभागात हे कार्ड अगदी असेच दिसेल.'
                    : 'Rendered with live storefront component to guarantee 100% visual fidelity.'}
                </p>

                {/* Render identical CategoryCard component */}
                <div className="flex justify-center items-center py-4">
                  <div className="w-[280px] max-w-full">
                    <CategoryCard
                      category={formData}
                      lang={previewLang}
                      isSelected={true}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Status:</span>
                  <span className={`font-bold ${formData.active !== false ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {formData.active !== false ? 'Active (Live on Website)' : 'Inactive (Hidden)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Slug:</span>
                  <span className="font-mono text-stone-600">/category/{formData.id || 'new'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isTranslating}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600/70 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'mr' ? 'मराठी भाषांतर होत आहे...' : 'Translating to Marathi & Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {isEdit
                      ? (lang === 'mr' ? 'बदल जतन करा' : 'Save Changes')
                      : (lang === 'mr' ? 'वर्गवारी जोडा' : 'Add Category')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
