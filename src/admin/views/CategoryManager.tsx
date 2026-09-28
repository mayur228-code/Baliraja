import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Layers, 
  Package, 
  AlertTriangle,
  Sparkles,
  Star,
  X
} from 'lucide-react';
import type { NavCategory, Language } from '../../types';
import { useContentStore } from '../data/contentStore';
import { CategoryEditorModal } from './CategoryEditorModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { getCategoryIconComponent } from '../../lib/categoryIcons';
import { EmptyStateView } from '../../components/common/StateViews';

interface CategoryManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const CategoryManager: FC<CategoryManagerProps> = ({ lang, onShowToast }) => {
  const { 
    allCategories, 
    products, 
    createCategory, 
    updateCategory, 
    toggleCategoryFeatured, 
    toggleCategoryActive, 
    deleteCategory, 
    moveCategoryOrder 
  } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NavCategory | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<NavCategory | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<{ count: number; catName: string } | null>(null);

  // Counts
  const totalCategories = allCategories.length;
  const activeCount = allCategories.filter((c) => c.active !== false).length;
  const inactiveCount = totalCategories - activeCount;

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allCategories.filter((c) => {
      // Status filter
      if (filterStatus === 'active' && c.active === false) return false;
      if (filterStatus === 'inactive' && c.active !== false) return false;

      // Search query
      if (q) {
        const matchesEn = c.name.toLowerCase().includes(q);
        const matchesMr = c.nameMr.includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesDesc = (c.shortDesc || '').toLowerCase().includes(q) || (c.shortDescMr || '').includes(q);
        return matchesEn || matchesMr || matchesId || matchesDesc;
      }
      return true;
    });
  }, [allCategories, searchQuery, filterStatus]);

  // Product count for a category
  const getProductCount = (catId: string) => {
    return products.filter((p) => p.categoryId === catId).length;
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (cat: NavCategory) => {
    setEditingCategory(cat);
    setIsEditorOpen(true);
  };

  const handleSave = (cat: NavCategory) => {
    const res = editingCategory 
      ? updateCategory(editingCategory.id, cat)
      : createCategory(cat);

    if (res.success) {
      setIsEditorOpen(false);
      setEditingCategory(null);
      onShowToast(
        'success',
        `Category "${cat.name}" saved successfully. Changes are synced everywhere.`,
        `"${cat.nameMr}" वर्गवारी यशस्वीरित्या जतन केली. बदल संपूर्ण संकेतस्थळावर लागू झाले.`
      );
    } else {
      onShowToast('error', res.error || 'Failed to save category.', res.error || 'वर्गवारी जतन करणे अयशस्वी.');
    }
  };

  const handleToggleFeatured = (cat: NavCategory) => {
    const res = toggleCategoryFeatured(cat.id);
    if (res.success) {
      const nowFeatured = !(cat.featured || cat.highlight);
      onShowToast(
        'info',
        nowFeatured
          ? `Category "${cat.name}" is now marked as Featured.`
          : `Category "${cat.name}" is no longer Featured.`,
        nowFeatured
          ? `"${cat.nameMr}" वर्गवारी आता वैशिष्ट्यीकृत (Featured) म्हणून चिन्हांकित केली.`
          : `"${cat.nameMr}" वर्गवारी आता सामान्य म्हणून चिन्हांकित केली.`
      );
    } else {
      onShowToast('error', res.error || 'Failed to toggle featured status.', res.error || 'वैशिष्ट्यीकृत स्थिती बदलणे अयशस्वी.');
    }
  };

  const handleToggleActive = (cat: NavCategory) => {
    const res = toggleCategoryActive(cat.id);
    if (res.success) {
      const nowActive = cat.active === false;
      onShowToast(
        'info',
        nowActive
          ? `Category "${cat.name}" is now Active and visible on the website.`
          : `Category "${cat.name}" is now Hidden from the public website. Associated products remain safe.`,
        nowActive
          ? `"${cat.nameMr}" वर्गवारी आता सक्रिय झाली असून संकेतस्थळावर दिसेल.`
          : `"${cat.nameMr}" वर्गवारी आता लपवण्यात आली आहे. उत्पादने सुरक्षित आहेत.`
      );
    } else {
      onShowToast('error', 'Failed to toggle category state.', 'वर्गवारी स्थिती बदलणे अयशस्वी झाले.');
    }
  };

  const handleRequestDelete = (cat: NavCategory) => {
    const pCount = getProductCount(cat.id);
    if (pCount > 0) {
      setDeleteBlockedReason({ count: pCount, catName: lang === 'mr' ? cat.nameMr : cat.name });
    } else {
      setDeleteTarget(cat);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const catName = deleteTarget.name;
    const catNameMr = deleteTarget.nameMr;
    const res = deleteCategory(deleteTarget.id);
    setDeleteTarget(null);

    if (res.success) {
      onShowToast(
        'success',
        `Category "${catName}" was removed.`,
        `"${catNameMr}" वर्गवारी काढण्यात आली.`
      );
    } else {
      onShowToast('error', res.error || 'Failed to delete category.', res.error || 'वर्गवारी हटवणे अयशस्वी.');
    }
  };

  const handleMoveOrder = (catId: string, direction: 'up' | 'down') => {
    moveCategoryOrder(catId, direction);
    onShowToast(
      'info',
      'Category display sequence updated and synced.',
      'वर्गवारीचा क्रम अद्ययावत झाला.'
    );
  };

  return (
    <div className="space-y-6 text-left antialiased">
      {/* ── Top Summary & Action Bar ── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2 leading-normal overflow-visible">
              <Layers className="w-5 h-5 text-emerald-700" />
              <span>{lang === 'mr' ? 'वर्गवारी व्यवस्थापन' : 'Category Management'}</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed overflow-visible">
              {lang === 'mr' 
                ? 'येथे केलेले बदल मुख्यपृष्ठ, नेव्हिगेशन मेनू, फिल्टर्स आणि कॅटलॉगमध्ये थेट समक्रमित होतात.' 
                : 'Centralized taxonomy: changes sync instantly across Home, Navbar, and Filters.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'mr' ? 'नवीन वर्गवारी जोडा' : 'Add New Category'}</span>
          </button>
        </div>

        {/* Quick Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
              {lang === 'mr' ? 'एकूण वर्गवाऱ्या' : 'Total Categories'}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-stone-900 font-mono">
              {totalCategories}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/70">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
              {lang === 'mr' ? 'सक्रिय (Live)' : 'Active on Site'}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-900 font-mono">
              {activeCount}
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">
              {lang === 'mr' ? 'लपवलेले (Hidden)' : 'Hidden / Inactive'}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-900 font-mono">
              {inactiveCount}
            </span>
          </div>

          <div className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200/80">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
              {lang === 'mr' ? 'एकूण उत्पादने' : 'Assigned Products'}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-stone-900 font-mono">
              {products.length}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'mr' ? 'वर्गवारी नाव किंवा आयडीने शोधा...' : 'Search by category name or ID...'}
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

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                filterStatus === 'all'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {lang === 'mr' ? 'सर्व' : 'All'} ({totalCategories})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                filterStatus === 'active'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {lang === 'mr' ? 'सक्रिय' : 'Active'} ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                filterStatus === 'inactive'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {lang === 'mr' ? 'लपवलेले' : 'Hidden'} ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* ── Categories Cards Grid ── */}
      {filteredCategories.length === 0 ? (
        <EmptyStateView
          type={searchQuery || filterStatus !== 'all' ? 'search' : 'categories'}
          lang={lang}
          searchQuery={searchQuery}
          title={lang === 'mr' ? 'कोणतीही वर्गवारी सापडली नाही' : 'No Categories Found'}
          description={
            searchQuery
              ? (lang === 'mr' ? `"${searchQuery}" शी जुळणारी कोणतीही वर्गवारी नाही.` : `No categories match query "${searchQuery}".`)
              : (lang === 'mr' ? 'सध्या कोणतीही वर्गवारी जोडलेली नाही.' : 'No categories configured yet.')
          }
          actionLabel={searchQuery || filterStatus !== 'all' ? (lang === 'mr' ? 'फिल्टर रीसेट करा' : 'Clear Filters') : undefined}
          onAction={searchQuery || filterStatus !== 'all' ? () => {
            setSearchQuery('');
            setFilterStatus('all');
          } : undefined}
          secondaryActionLabel={lang === 'mr' ? 'नवीन वर्गवारी जोडा' : 'Add New Category'}
          onSecondaryAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCategories.map((cat, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredCategories.length - 1;
            const IconComp = getCategoryIconComponent(cat.icon || cat.id);
            const pCount = getProductCount(cat.id);
            const isActive = cat.active !== false;

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs ${
                  isActive ? 'border-stone-200/90 hover:border-stone-300' : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                {/* Card Top: Thumbnail + Header info */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Thumbnail with Icon Badge */}
                    <div className="relative w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 shadow-2xs">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <Layers className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-700 text-white flex items-center justify-center rounded-tl-xl shadow-2xs">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Titles & Order Badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-sm font-bold text-stone-900 truncate" title={cat.name}>
                          {cat.name}
                        </h3>
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-600 border border-stone-200">
                          #{cat.order ?? index + 1}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-emerald-800 truncate mt-0.5 leading-relaxed overflow-visible" title={cat.nameMr}>
                        {cat.nameMr}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                        ID: {cat.id}
                      </div>
                    </div>
                  </div>

                  {/* Short Description */}
                  {(cat.shortDesc || cat.shortDescMr) && (
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      {lang === 'mr' ? (cat.shortDescMr || cat.shortDesc) : (cat.shortDesc || cat.shortDescMr)}
                    </p>
                  )}

                  {/* Badges: Status, Product Count, Subcategories, Featured */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {/* Active/Inactive Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                      <span>{isActive ? (lang === 'mr' ? 'सक्रिय' : 'Active') : (lang === 'mr' ? 'लपवलेले' : 'Hidden')}</span>
                    </span>

                    {/* Product count badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                      <Package className="w-3 h-3 text-stone-500" />
                      <span>{pCount} {lang === 'mr' ? 'उत्पादने' : 'products'}</span>
                    </span>

                    {/* Subcategories count */}
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                        {cat.subcategories.length} {lang === 'mr' ? 'उपवर्ग' : 'sub-types'}
                      </span>
                    )}

                    {Boolean(cat.featured || cat.highlight) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{lang === 'mr' ? 'विशेष' : 'Featured'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveOrder(cat.id, 'up')}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isFirst
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-emerald-700 shadow-2xs'
                      }`}
                      title={lang === 'mr' ? 'वर हलवा (Move Up)' : 'Move Up'}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveOrder(cat.id, 'down')}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isLast
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-emerald-700 shadow-2xs'
                      }`}
                      title={lang === 'mr' ? 'खाली हलवा (Move Down)' : 'Move Down'}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Active Toggle, Featured Toggle, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    {/* Toggle Visibility */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      className={`p-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                        isActive
                          ? 'border-stone-200 bg-white text-stone-700 hover:bg-amber-50 hover:text-amber-800'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                      title={isActive 
                        ? (lang === 'mr' ? 'लपवा (Deactivate/Hide)' : 'Hide from Public Website')
                        : (lang === 'mr' ? 'सक्रिय करा (Activate)' : 'Make Active on Website')
                      }
                    >
                      {isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    {/* Toggle Featured */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(cat)}
                      className={`p-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                        cat.featured || cat.highlight
                          ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-stone-200 bg-white text-stone-400 hover:bg-amber-50 hover:text-amber-600'
                      }`}
                      title={cat.featured || cat.highlight
                        ? (lang === 'mr' ? 'वैशिष्ट्यीकृत काढून टाका (Unfeature)' : 'Remove from Featured')
                        : (lang === 'mr' ? 'वैशिष्ट्यीकृत करा (Mark Featured)' : 'Mark as Featured')
                      }
                    >
                      <Star className={`w-3.5 h-3.5 ${cat.featured || cat.highlight ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 hover:text-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{lang === 'mr' ? 'संपादित करा' : 'Edit'}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(cat)}
                      className="p-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors cursor-pointer shadow-2xs"
                      title={lang === 'mr' ? 'काढून टाका (Delete)' : 'Delete Category'}
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

      {/* Category Editor Modal */}
      <CategoryEditorModal
        key={editingCategory ? `edit-${editingCategory.id}` : 'create-new'}
        isOpen={isEditorOpen}
        lang={lang}
        mode={editingCategory ? 'edit' : 'create'}
        category={editingCategory}
        existingCategories={allCategories}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal (when safe to delete) */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          lang={lang}
          titleEn={`Delete Category "${deleteTarget.name}"?`}
          titleMr={`"${deleteTarget.nameMr}" वर्गवारी काढून टाकायची?`}
          messageEn={`Are you sure you want to delete "${deleteTarget.name}"? This category currently has 0 associated products.`}
          messageMr={`तुम्हाला खात्री आहे की तुम्ही "${deleteTarget.nameMr}" वर्गवारी हटवू इच्छिता? या वर्गात सध्या ० उत्पादने आहेत.`}
          confirmLabelEn="Delete Category"
          confirmLabelMr="वर्गवारी हटवा"
          cancelLabelEn="Cancel"
          cancelLabelMr="रद्द करा"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Delete Blocked Modal (when category has active products) */}
      {deleteBlockedReason && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-amber-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-stone-900 font-serif leading-snug">
                {lang === 'mr' ? 'वर्गवारी हटवणे प्रतिबंधित आहे' : 'Cannot Delete Category'}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {lang === 'mr'
                  ? `"${deleteBlockedReason.catName}" या वर्गवारीत सध्या ${deleteBlockedReason.count} उत्पादने जोडलेली आहेत. उत्पादने अनाथ (orphaned) होण्यापासून रोखण्यासाठी, तुम्ही वर्गवारी हटवण्यापूर्वी ही उत्पादने दुसऱ्या वर्गात पुनर्निर्देशित करा किंवा उत्पादने हटवा.`
                  : `"${deleteBlockedReason.catName}" currently has ${deleteBlockedReason.count} associated product records. To prevent orphaned products, reassign or remove these products first.`}
              </p>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                {lang === 'mr'
                  ? '💡 टीप: जर तुम्हाला ही वर्गवारी तात्पुरती लपवायची असेल, तर तुम्ही ती "निष्क्रीय (Hide)" करू शकता. यामुळे उत्पादने सुरक्षित राहतील.'
                  : '💡 Tip: You can Deactivate (Hide) this category instead. The products remain safely stored while the category is hidden from the public website.'}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteBlockedReason(null)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                {lang === 'mr' ? 'समजले' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
