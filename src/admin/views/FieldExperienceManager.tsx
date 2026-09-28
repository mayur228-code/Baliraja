import { useState } from 'react';
import type { FC } from 'react';
import { 
  Plus, 
  Search, 
  Sprout, 
  Edit, 
  Trash2, 
  Package, 
  Calendar, 
  Eye
} from 'lucide-react';
import type { FieldExperience, Language } from '../../types';
import { useContentStore } from '../data/contentStore';
import { FieldExperienceEditorModal } from './FieldExperienceEditorModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyStateView } from '../../components/common/StateViews';

interface FieldExperienceManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const FieldExperienceManager: FC<FieldExperienceManagerProps> = ({ lang, onShowToast }) => {
  const { fieldExperiences, products, saveFieldExperience, deleteFieldExperience } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FieldExperience | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FieldExperience | null>(null);

  const filteredItems = fieldExperiences.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.cropNameEnglish.toLowerCase().includes(q) ||
      item.cropNameMarathi.includes(q) ||
      item.titleEnglish.toLowerCase().includes(q) ||
      item.titleMarathi.includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: FieldExperience) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleSave = (item: FieldExperience) => {
    const res = saveFieldExperience(item);
    if (res.success) {
      setIsEditorOpen(false);
      onShowToast(
        'success',
        `Field record "${item.titleEnglish}" saved.`,
        `"${item.titleMarathi}" शेती अनुभव नोंद जतन केली.`
      );
    } else {
      onShowToast('error', res.error || 'Failed to save record.', 'नोंद जतन करण्यात त्रुटी आली.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteFieldExperience(deleteTarget.id);
    onShowToast(
      'success',
      `Field record "${deleteTarget.titleEnglish}" deleted.`,
      `"${deleteTarget.titleMarathi}" नोंद हटवली.`
    );
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* ── Top Header & Summary Bar ── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-emerald-700 shadow-xs shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                  {lang === 'mr' ? 'शेतकरी अनुभव व पीक निरीक्षण व्यवस्थापन' : 'Field Experience & Crop Observations'}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {fieldExperiences.length} {lang === 'mr' ? 'नोंदी' : 'Records'}
                </span>
              </div>
              <p className="text-2xs text-stone-500 mt-0.5 leading-relaxed">
                {lang === 'mr' 
                  ? `एकूण ${fieldExperiences.length} शेती नोंदी आणि पीक निरीक्षणे प्रकाशित.` 
                  : `${fieldExperiences.length} total field records and agronomic observations published.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="leading-relaxed">{lang === 'mr' ? 'नवीन अनुभव नोंद जोडा' : 'Add Field Record'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative pt-2 border-t border-stone-100">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'mr' ? 'पीक, शीर्षक किंवा आयडीने शोधा...' : 'Search by crop, title, or record ID...'}
            className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors shadow-xs leading-relaxed"
          />
        </div>
      </div>

      {/* Cards List */}
      {filteredItems.length === 0 ? (
        <EmptyStateView
          type={searchQuery ? 'search' : 'generic'}
          lang={lang}
          titleEn={searchQuery ? `No field records matching "${searchQuery}"` : 'No field experience records found.'}
          titleMr={searchQuery ? `"${searchQuery}" शी जुळणाऱ्या कोणत्याही नोंदी नाहीत.` : 'अजून कोणतीही शेती अनुभव नोंद सापडली नाही.'}
          descriptionEn={searchQuery ? 'Try searching with a different crop name, record title, or ID.' : 'Click Add Field Record to register a new observation.'}
          descriptionMr={searchQuery ? 'कृपया वेगळे पीक किंवा शीर्षक शोधून पहा.' : 'नवीन नोंद जोडण्यासाठी वरील बटणावर क्लिक करा.'}
          onAction={searchQuery ? () => setSearchQuery('') : handleOpenAdd}
          actionLabelEn={searchQuery ? 'Clear Search' : '+ Add Field Record'}
          actionLabelMr={searchQuery ? 'शोध रद्द करा' : '+ नवीन नोंद जोडा'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const relatedCount = (item.relatedProductIds || []).length;

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md ring-1 ring-black/[0.02] space-y-4 flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-2xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        {lang === 'mr' ? item.cropNameMarathi : item.cropNameEnglish}
                      </span>
                      {item.isSample && (
                        <span className="px-2 py-0.5 rounded-md text-3xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Sample
                        </span>
                      )}
                    </div>

                    <span className="text-3xs font-mono text-stone-400">
                      ID: {item.id}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                    {lang === 'mr' ? item.titleMarathi : item.titleEnglish}
                  </h3>
                  <div className="text-2xs text-stone-400 mt-0.5 leading-relaxed">
                    {lang === 'mr' ? item.titleEnglish : item.titleMarathi}
                  </div>

                  {/* Stage & Season */}
                  {(item.stageEnglish || item.seasonEnglish) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-2xs text-stone-600">
                      {item.stageEnglish && (
                        <span className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg text-3xs font-medium">
                          <Eye className="w-3 h-3 text-stone-500" />
                          <span>{lang === 'mr' ? item.stageMarathi : item.stageEnglish}</span>
                        </span>
                      )}
                      {item.seasonEnglish && (
                        <span className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg text-3xs font-medium">
                          <Calendar className="w-3 h-3 text-stone-500" />
                          <span>{lang === 'mr' ? item.seasonMarathi : item.seasonEnglish}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Observation Snippet */}
                  <p className="mt-3 text-xs text-stone-600 line-clamp-2 leading-relaxed bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
                    {lang === 'mr' ? item.observationMarathi : item.observationEnglish}
                  </p>
                </div>

                {/* Footer with related products & actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-2xs text-stone-500 font-medium">
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {lang === 'mr' 
                        ? `${relatedCount} संबंधित उत्पादने` 
                        : `${relatedCount} linked inputs`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-800 bg-stone-50 hover:bg-emerald-50 rounded-lg border border-stone-200 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="leading-relaxed">{lang === 'mr' ? 'संपादित करा' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer active:scale-95"
                      title="Delete"
                      aria-label="Delete field record"
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

      {/* Editor Modal */}
      {isEditorOpen && (
        <FieldExperienceEditorModal
          key={editingItem?.id || 'new'}
          isOpen={isEditorOpen}
          lang={lang}
          experience={editingItem}
          products={products}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        lang={lang}
        titleEn="Delete Field Experience Record?"
        titleMr="शेती अनुभव नोंद हटवायची आहे का?"
        messageEn={`Are you sure you want to delete "${deleteTarget?.titleEnglish}"? This record will no longer appear in the farmer results section.`}
        messageMr={`आपणास नक्की "${deleteTarget?.titleMarathi}" नोंद हटवायची आहे का?`}
        confirmLabelEn="Delete Record"
        confirmLabelMr="नोंद हटवा"
        cancelLabelEn="Cancel"
        cancelLabelMr="रद्द करा"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
