import { useState } from 'react';
import type { FC } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Building2, 
  Sparkles,
  X
} from 'lucide-react';
import type { Brand, Language } from '../../types';
import { useContentStore } from '../data/contentStore';
import { BrandEditorModal } from './BrandEditorModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyStateView } from '../../components/common/StateViews';

interface BrandManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

const POPULAR_AGRI_BRANDS: Omit<Brand, 'id'>[] = [
  {
    name: 'Katyayani Organics',
    order: 1,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <circle cx="35" cy="35" r="22" fill="#15803d"/>
        <path d="M35 19 C35 19 46 27 46 36 C46 42 41 47 35 47 C29 47 24 42 24 36 C24 27 35 19 35 19 Z" fill="#fef08a"/>
        <path d="M35 24 L35 42 M29 33 C32 30 35 30 35 30 M41 36 C38 33 35 33 35 33" stroke="#15803d" stroke-width="2" stroke-linecap="round"/>
        <text x="68" y="36" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#14532d" letter-spacing="1">KATYAYANI</text>
        <text x="69" y="50" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="10" fill="#16a34a" letter-spacing="3">ORGANICS</text>
      </svg>
    `)}`
  },
  {
    name: 'Bayer CropScience',
    order: 2,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <circle cx="35" cy="35" r="22" fill="#0284c7"/>
        <circle cx="35" cy="35" r="20" fill="#ffffff"/>
        <text x="35" y="32" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" fill="#0284c7" text-anchor="middle">B</text>
        <text x="35" y="42" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" fill="#0284c7" text-anchor="middle">A</text>
        <text x="25" y="37" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" fill="#0284c7" text-anchor="middle">Y</text>
        <text x="45" y="37" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" fill="#0284c7" text-anchor="middle">E</text>
        <text x="68" y="36" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="21" fill="#0f172a" letter-spacing="0.5">BAYER</text>
        <text x="69" y="50" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="10" fill="#0284c7" letter-spacing="2">CROPSCIENCE</text>
      </svg>
    `)}`
  },
  {
    name: 'Syngenta India',
    order: 3,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <g transform="translate(16, 14)">
          <path d="M12 28 C12 18 20 12 30 12 C30 22 22 28 12 28 Z" fill="#059669"/>
          <path d="M30 12 C40 12 48 18 48 28 C38 28 30 22 30 12 Z" fill="#0284c7"/>
          <circle cx="30" cy="20" r="4" fill="#f59e0b"/>
        </g>
        <text x="74" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#047857" letter-spacing="1">syngenta</text>
        <text x="75" y="51" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="9" fill="#0284c7" letter-spacing="2">INNOVATION</text>
      </svg>
    `)}`
  },
  {
    name: 'Mahyco Seeds',
    order: 4,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <circle cx="35" cy="35" r="22" fill="#b91c1c"/>
        <path d="M26 35 L31 23 L35 31 L39 23 L44 35" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M25 41 L45 41" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <text x="68" y="36" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#b91c1c" letter-spacing="1">mahyco</text>
        <text x="69" y="50" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="10" fill="#78350f" letter-spacing="2">PIONEER IN SEEDS</text>
      </svg>
    `)}`
  },
  {
    name: 'UPL Limited',
    order: 5,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <circle cx="35" cy="35" r="22" fill="#ea580c"/>
        <text x="35" y="42" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">UPL</text>
        <text x="68" y="37" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#ea580c" letter-spacing="1">UPL</text>
        <text x="69" y="50" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="9.5" fill="#475569" letter-spacing="1">OpenAg™</text>
      </svg>
    `)}`
  },
  {
    name: 'Dhanuka Agritech',
    order: 6,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <circle cx="35" cy="35" r="22" fill="#047857"/>
        <path d="M35 18 C30 26 25 35 35 46 C45 35 40 26 35 18 Z" fill="#fbbf24"/>
        <text x="68" y="36" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#047857" letter-spacing="0.5">dhanuka</text>
        <text x="69" y="50" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="9" fill="#b45309" letter-spacing="1.5">AGRITECH LIMITED</text>
      </svg>
    `)}`
  },
  {
    name: 'Coromandel International',
    order: 7,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <circle cx="35" cy="35" r="22" fill="#1e3a8a"/>
        <path d="M25 35 A10 10 0 0 1 45 35" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
        <circle cx="35" cy="27" r="3" fill="#ffffff"/>
        <text x="68" y="35" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="17" fill="#1e3a8a" letter-spacing="0.5">Coromandel</text>
        <text x="69" y="49" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="8.5" fill="#d97706" letter-spacing="1.5">FUTUREING FARMING</text>
      </svg>
    `)}`
  },
  {
    name: 'Rallis India (Tata)',
    order: 8,
    logo: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70">
        <rect width="280" height="70" rx="10" fill="transparent"/>
        <circle cx="35" cy="35" r="22" fill="#0369a1"/>
        <text x="35" y="41" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle">TATA</text>
        <text x="68" y="35" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="19" fill="#0369a1" letter-spacing="1">RALLIS</text>
        <text x="69" y="49" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="9" fill="#475569" letter-spacing="1">A TATA ENTERPRISE</text>
      </svg>
    `)}`
  }
];

export const BrandManager: FC<BrandManagerProps> = ({ lang, onShowToast }) => {
  const { 
    brands, 
    saveBrand, 
    deleteBrand, 
    moveBrandOrder 
  } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  // Filter brands by name or order
  const filteredBrands = brands.filter((b) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return b.name.toLowerCase().includes(query) || b.id.toLowerCase().includes(query);
  });

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsEditorOpen(true);
  };

  const handleSave = (brand: Brand) => {
    const res = saveBrand(brand);
    if (res.success) {
      setIsEditorOpen(false);
      onShowToast(
        'success',
        `Brand "${brand.name}" saved successfully.`,
        `"${brand.name}" ब्रँड यशस्वीरित्या जतन केला.`
      );
    } else {
      onShowToast(
        'error',
        res.error || 'Failed to save brand.',
        'ब्रँड जतन करण्यात त्रुटी आली.'
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const res = deleteBrand(deleteTarget.id);
    if (res.success) {
      onShowToast(
        'success',
        `Brand "${deleteTarget.name}" removed from Connected Brands.`,
        `"${deleteTarget.name}" ब्रँड जोडलेल्या ब्रँड्समधून हटवला.`
      );
      setDeleteTarget(null);
    }
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const res = moveBrandOrder(id, direction);
    if (res.success) {
      onShowToast(
        'info',
        'Display order updated.',
        'प्रदर्शन क्रम अद्यतनित केला.'
      );
    }
  };

  const handleQuickSeedBrands = () => {
    POPULAR_AGRI_BRANDS.forEach((brandSeed, idx) => {
      saveBrand({
        ...brandSeed,
        id: `brand-seed-${idx + 1}`,
      });
    });
    onShowToast(
      'success',
      'Popular agricultural brands added to Connected Brands.',
      'लोकप्रिय कृषी कंपन्यांचे ब्रँड्स जोडले गेले.'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 antialiased">
      {/* ── Top Bar: Action & Search ── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2 leading-normal overflow-visible">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <span>
                {lang === 'mr' ? 'जोडलेले ब्रँड्स व्यवस्थापन' : 'Connected Brands Management'}
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed overflow-visible">
              {lang === 'mr'
                ? `एकूण ${brands.length} ब्रँड्स मुख्य पानावर "आमच्याशी जोडलेले ब्रँड्स" विभागात दर्शवले आहेत.`
                : `${brands.length} total partner brands featured in the showcase carousel on Home page.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {brands.length === 0 && (
              <button
                type="button"
                onClick={handleQuickSeedBrands}
                className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Add popular agricultural brands with clean SVG vector logos"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {lang === 'mr' ? 'प्रसिद्ध ब्रँड्स भरा (Quick Seed)' : 'Seed Popular Agri Brands'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'mr' ? 'नवीन ब्रँड जोडा' : 'Add Brand'}</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        {brands.length > 0 && (
          <div className="relative pt-2 border-t border-stone-100">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'mr'
                  ? 'ब्रँड अथवा कंपनीचे नाव शोधा...'
                  : 'Search by brand or company name...'
              }
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Brands Grid ── */}
      {brands.length === 0 ? (
        <EmptyStateView
          type="brands"
          lang={lang}
          title={lang === 'mr' ? 'अद्याप कोणतेही ब्रँड्स जोडलेले नाहीत' : 'No Brands Configured Yet'}
          description={
            lang === 'mr'
              ? 'मुख्य पृष्ठावर "आमच्याशी जोडलेले ब्रँड्स" विभागात सध्या रिक्त संदेश दर्शवला जात आहे. नवीन ब्रँड जोडण्यासाठी वरील बटणावर क्लिक करा.'
              : 'Click "Add Brand" above or use quick-seed to populate genuine partner agricultural brands.'
          }
          actionLabel={lang === 'mr' ? 'पहिला ब्रँड जोडा' : 'Add First Brand'}
          onAction={handleOpenAdd}
          secondaryActionLabel={lang === 'mr' ? 'प्रसिद्ध ब्रँड्स भरा' : 'Seed Popular Agri Brands'}
          onSecondaryAction={handleQuickSeedBrands}
        />
      ) : filteredBrands.length === 0 ? (
        <EmptyStateView
          type="search"
          lang={lang}
          searchQuery={searchQuery}
          title={lang === 'mr' ? 'कोणताही ब्रँड सापडला नाही' : 'No Brands Found'}
          description={
            lang === 'mr'
              ? `"${searchQuery}" शी जुळणारा कोणताही ब्रँड सापडला नाही.`
              : `No brands match query "${searchQuery}".`
          }
          actionLabel={lang === 'mr' ? 'शोध पुसा' : 'Clear Search'}
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBrands.map((brand, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredBrands.length - 1;

            return (
              <div
                key={brand.id}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all duration-200 flex flex-col justify-between gap-3 group"
              >
                {/* Logo Preview Container */}
                <div className="w-full h-24 rounded-2xl bg-stone-50 border border-stone-100 p-3 flex items-center justify-center overflow-hidden shadow-2xs">
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    className="max-h-full max-w-[150px] w-auto h-auto object-contain transition-transform group-hover:scale-105 duration-200"
                  />
                </div>

                {/* Info & Order */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-stone-900 truncate" title={brand.name}>
                      {brand.name}
                    </h3>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-600 border border-stone-200">
                      #{brand.order ?? index + 1}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                    ID: {brand.id}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveOrder(brand.id, 'up')}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isFirst
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-emerald-700 shadow-2xs'
                      }`}
                      title={lang === 'mr' ? 'वर हलवा (Move Up)' : 'Move Up'}
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveOrder(brand.id, 'down')}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isLast
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-emerald-700 shadow-2xs'
                      }`}
                      title={lang === 'mr' ? 'खाली हलवा (Move Down)' : 'Move Down'}
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(brand)}
                      className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer shadow-2xs border border-stone-200"
                      title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                      aria-label="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(brand)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shadow-2xs border border-stone-200"
                      title={lang === 'mr' ? 'हटवा' : 'Delete'}
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Brand Editor Modal */}
      {isEditorOpen && (
        <BrandEditorModal
          isOpen={isEditorOpen}
          brand={editingBrand}
          lang={lang}
          nextOrder={brands.length + 1}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={Boolean(deleteTarget)}
          lang={lang}
          titleEn="Delete Brand"
          titleMr="ब्रँड हटवा"
          messageEn={`Are you sure you want to remove "${deleteTarget.name}" from Connected Brands? This will immediately remove it from the Home page.`}
          messageMr={`तुम्हाला खात्री आहे का की तुम्हाला "${deleteTarget.name}" हा ब्रँड जोडलेल्या ब्रँड्समधून काढायचा आहे? तो मुख्य पृष्ठावरून लगेच काढला जाईल.`}
          confirmLabelEn="Delete Brand"
          confirmLabelMr="ब्रँड हटवा"
          cancelLabelEn="Cancel"
          cancelLabelMr="रद्द करा"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default BrandManager;
