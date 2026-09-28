import { useState } from 'react';
import type { FC } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Package,
  X
} from 'lucide-react';
import type { Product, Language } from '../../types';
import { useContentStore } from '../data/contentStore';
import { ProductEditorModal } from './ProductEditorModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { navigationCategories } from '../../data/navigationData';
import { EmptyStateView } from '../../components/common/StateViews';

interface ProductManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const ProductManager: FC<ProductManagerProps> = ({ lang, onShowToast }) => {
  const { 
    products, 
    allCategories,
    createProduct,
    updateProduct, 
    deleteProduct, 
    toggleProductAvailability, 
    toggleProductFeatured 
  } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      p.nameEnglish.toLowerCase().includes(query) ||
      p.nameMarathi.includes(query) ||
      p.descriptionEnglish.toLowerCase().includes(query) ||
      p.descriptionMarathi.includes(query) ||
      p.id.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesAvail = selectedAvailability === 'all' || p.availability === selectedAvailability;

    return matchesSearch && matchesCategory && matchesAvail;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsEditorOpen(true);
  };

  const handleSave = (prod: Product) => {
    let res;
    if (editingProduct) {
      res = updateProduct(editingProduct.id, prod);
    } else {
      res = createProduct(prod);
    }

    if (res.success) {
      setIsEditorOpen(false);
      onShowToast(
        'success',
        `Product "${prod.nameEnglish}" saved successfully.`,
        `"${prod.nameMarathi}" उत्पादन यशस्वीरित्या जतन केले.`
      );
    } else {
      onShowToast(
        'error',
        res.error || 'Failed to save product.',
        'उत्पादन जतन करण्यात त्रुटी आली.'
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const res = deleteProduct(deleteTarget.id);
    if (res.success) {
      onShowToast(
        'success',
        `Product "${deleteTarget.nameEnglish}" was deleted.`,
        `"${deleteTarget.nameMarathi}" उत्पादन हटवले.`
      );
      setDeleteTarget(null);
    } else {
      onShowToast(
        'error',
        res.error || 'Cannot delete product.',
        'उत्पादन हटवता आले नाही. संदर्भ तपासा.'
      );
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 text-left antialiased">
      {/* ── Top Bar: Header, Action & Search & Filters ── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2 leading-normal overflow-visible">
              <Package className="w-5 h-5 text-emerald-700" />
              <span>{lang === 'mr' ? 'कृषी निविष्ठा सूची व साठा' : 'Product Inventory Catalog'}</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed overflow-visible">
              {lang === 'mr' 
                ? `एकूण ${products.length} उत्पादने नोंदवलेली आहेत (फिल्टर केलेले: ${filteredProducts.length}).` 
                : `${products.length} total product records published (Showing ${filteredProducts.length}).`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'mr' ? 'नवीन उत्पादन जोडा' : 'Add New Product'}</span>
          </button>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-stone-100">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'mr' ? 'नाव, पीक किंवा आयडीने शोधा...' : 'Search by name, crop or product ID...'}
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

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">
                {lang === 'mr' ? 'सर्व वर्ग (All Categories)' : 'All Categories'}
              </option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'mr' ? c.nameMr : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">
                {lang === 'mr' ? 'सर्व उपलब्धता स्थिती' : 'All Availability'}
              </option>
              <option value="available">
                {lang === 'mr' ? 'उपलब्ध (In Stock)' : 'Available Only'}
              </option>
              <option value="out_of_stock">
                {lang === 'mr' ? 'अनुपलब्ध (Out of Stock)' : 'Out of Stock Only'}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Product List Table ── */}
      {filteredProducts.length === 0 ? (
        <EmptyStateView
          type={searchQuery || selectedCategory !== 'all' || selectedAvailability !== 'all' ? 'search' : 'products'}
          lang={lang}
          searchQuery={searchQuery}
          title={lang === 'mr' ? 'कोणतीही उत्पादने सापडली नाहीत.' : 'No products matched your criteria.'}
          description={lang === 'mr' ? 'शोध शब्द बदला किंवा फिल्टर रीसेट करा.' : 'Try changing search keywords or resetting the category and stock filters.'}
          actionLabel={searchQuery || selectedCategory !== 'all' || selectedAvailability !== 'all' ? (lang === 'mr' ? 'फिल्टर रीसेट करा' : 'Clear Filters') : undefined}
          onAction={searchQuery || selectedCategory !== 'all' || selectedAvailability !== 'all' ? () => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedAvailability('all');
          } : undefined}
          secondaryActionLabel={lang === 'mr' ? 'नवीन उत्पादन जोडा' : 'Add New Product'}
          onSecondaryAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] uppercase tracking-wider font-bold text-stone-600">
                  <th className="py-3.5 px-4">{lang === 'mr' ? 'उत्पादन तपशील' : 'Product Details'}</th>
                  <th className="py-3.5 px-4">{lang === 'mr' ? 'वर्ग' : 'Category'}</th>
                  <th className="py-3.5 px-4">{lang === 'mr' ? 'किंमत' : 'Price'}</th>
                  <th className="py-3.5 px-4">{lang === 'mr' ? 'उपलब्धता' : 'Availability'}</th>
                  <th className="py-3.5 px-4 text-center">{lang === 'mr' ? 'विशेष' : 'Featured'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'mr' ? 'कृती' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredProducts.map((prod) => {
                  const cat = allCategories.find((c) => c.id === prod.categoryId || c.slug === prod.categoryId) || 
                    navigationCategories.find((c) => c.id === prod.categoryId);
                  const isAvail = prod.availability === 'available';

                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors group">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            <img 
                              src={prod.image} 
                              alt={prod.nameEnglish} 
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/categories/fertilizers.png';
                              }}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 leading-snug truncate font-serif">
                              {lang === 'mr' ? prod.nameMarathi : prod.nameEnglish}
                            </div>
                            <div className="text-xs text-stone-500 font-medium truncate mt-0.5 leading-relaxed overflow-visible">
                              {lang === 'mr' ? prod.nameEnglish : prod.nameMarathi}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                ID: {prod.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200/70">
                          {lang === 'mr' ? cat?.nameMr || prod.categoryId : cat?.name || prod.categoryId}
                        </span>
                      </td>

                      {/* Independent Price */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 font-serif tabular-nums">
                          {prod.price !== undefined && prod.price !== null && prod.price !== ''
                            ? (typeof prod.price === 'number' ? `₹${prod.price.toLocaleString('en-IN')}` : (String(prod.price).startsWith('₹') ? prod.price : `₹${prod.price}`))
                            : (lang === 'mr' ? 'चौकशीवर' : 'On Request')}
                        </span>
                      </td>

                      {/* Availability (Quick Toggle) */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            toggleProductAvailability(prod.id);
                            onShowToast(
                              'info',
                              `Availability updated for ${prod.nameEnglish}`,
                              `${prod.nameMarathi} ची उपलब्धता बदलली`
                            );
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            isAvail
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200'
                          }`}
                          title={lang === 'mr' ? 'उपलब्धता स्थिती बदलण्यासाठी क्लिक करा' : 'Click to toggle availability'}
                        >
                          {isAvail ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{lang === 'mr' ? 'उपलब्ध' : 'In Stock'}</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
                              <span>{lang === 'mr' ? 'अनुपलब्ध' : 'Out of Stock'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Featured status (Quick toggle) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const res = toggleProductFeatured(prod.id);
                            if (res && res.success === false) {
                              onShowToast('error', res.error || 'Failed to update featured status', 'वैशिष्ट्यीकृत स्वरूप बदलता आले नाही');
                            } else {
                              const willBeFeatured = !prod.featured;
                              onShowToast(
                                'success',
                                willBeFeatured
                                  ? `"${prod.nameEnglish}" marked as Featured.`
                                  : `"${prod.nameEnglish}" removed from Featured.`,
                                willBeFeatured
                                  ? `"${prod.nameMarathi}" वैशिष्ट्यीकृत उत्पादनांमध्ये जोडले.`
                                  : `"${prod.nameMarathi}" वैशिष्ट्यीकृत उत्पादनांमधून काढले.`
                              );
                            }
                          }}
                          className={`inline-flex items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                            prod.featured
                              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              : 'text-stone-300 hover:text-amber-500 hover:bg-stone-100 border-transparent'
                          }`}
                          title={prod.featured ? (lang === 'mr' ? 'वैशिष्ट्यीकृत (काढण्यासाठी क्लिक करा)' : 'Featured (Click to unfeature)') : (lang === 'mr' ? 'वैशिष्ट्यीकृत करा' : 'Mark as Featured')}
                          aria-label={prod.featured ? 'Remove from featured' : 'Mark as featured'}
                          aria-pressed={Boolean(prod.featured)}
                        >
                          <Star className={`w-4 h-4 transition-transform duration-150 active:scale-90 ${prod.featured ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-2 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                            aria-label="Edit product"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(prod)}
                            className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            aria-label="Delete product"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Editor Modal */}
      {isEditorOpen && (
        <ProductEditorModal
          key={editingProduct?.id || 'new'}
          isOpen={isEditorOpen}
          lang={lang}
          product={editingProduct}
          categories={allCategories}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        lang={lang}
        titleEn="Delete Product Record?"
        titleMr="हा उत्पादन रेकॉर्ड हटवायचा आहे का?"
        messageEn={`Are you sure you want to delete "${deleteTarget?.nameEnglish}"? This action removes the product from the public catalog. Existing stable IDs are protected.`}
        messageMr={`आपणास नक्की "${deleteTarget?.nameMarathi}" हटवायचे आहे का? हे उत्पादन सार्वजनिक सूचीमधून काढले जाईल.`}
        confirmLabelEn="Delete Product"
        confirmLabelMr="उत्पादन हटवा"
        cancelLabelEn="Cancel"
        cancelLabelMr="रद्द करा"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
