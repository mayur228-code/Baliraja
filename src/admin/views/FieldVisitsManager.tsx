import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Camera, 
  Sparkles,
  X
} from 'lucide-react';
import type { FieldVisitItem, Language } from '../../types';
import { useContentStore } from '../data/contentStore';
import { FieldVisitEditorModal } from './FieldVisitEditorModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyStateView } from '../../components/common/StateViews';

interface FieldVisitsManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const FieldVisitsManager: FC<FieldVisitsManagerProps> = ({ lang, onShowToast }) => {
  const { 
    fieldVisits, 
    createFieldVisit, 
    updateFieldVisit, 
    deleteFieldVisit, 
    moveFieldVisitOrder 
  } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<FieldVisitItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FieldVisitItem | null>(null);

  // Filter visits
  const filteredVisits = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return fieldVisits;
    return fieldVisits.filter((v) => {
      const matchEn = v.titleEn.toLowerCase().includes(q);
      const matchMr = v.titleMr.includes(q);
      const matchId = v.id.toLowerCase().includes(q);
      return matchEn || matchMr || matchId;
    });
  }, [fieldVisits, searchQuery]);

  const handleOpenAdd = () => {
    setEditingVisit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: FieldVisitItem) => {
    setEditingVisit(item);
    setIsEditorOpen(true);
  };

  const handleSave = (visit: FieldVisitItem) => {
    const res = editingVisit 
      ? updateFieldVisit(editingVisit.id, visit)
      : createFieldVisit(visit);

    if (res.success) {
      setIsEditorOpen(false);
      setEditingVisit(null);
      onShowToast(
        'success',
        `Field visit "${visit.titleEn}" saved successfully.`,
        `"${visit.titleMr}" शेत भेट छायाचित्र यशस्वीरित्या जतन केले.`
      );
    } else {
      onShowToast(
        'error',
        res.error || 'Failed to save field visit.',
        'शेत भेट जतन करताना त्रुटी आली.'
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const titleEn = deleteTarget.titleEn;
    const titleMr = deleteTarget.titleMr;
    const res = deleteFieldVisit(deleteTarget.id);
    setDeleteTarget(null);

    if (res.success) {
      onShowToast(
        'success',
        `Field visit "${titleEn}" removed.`,
        `"${titleMr}" शेत भेट यशस्वीरित्या काढण्यात आली.`
      );
    } else {
      onShowToast('error', res.error || 'Failed to delete.', 'शेत भेट हटवणे अयशस्वी.');
    }
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    moveFieldVisitOrder(id, direction);
    onShowToast(
      'info',
      'Field visit display order updated.',
      'शेत भेटीचा क्रम अद्ययावत झाला.'
    );
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200 antialiased">
      {/* ── Top Summary & Action Bar ── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif flex items-center gap-2 leading-normal overflow-visible">
              <Camera className="w-5 h-5 text-emerald-700" />
              <span>{lang === 'mr' ? 'शेत भेट छायाचित्रे व्यवस्थापन' : 'Field Visits Gallery Management'}</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed overflow-visible">
              {lang === 'mr'
                ? `एकूण ${fieldVisits.length} शेत भेटीची छायाचित्रे मुख्यपृष्ठावर प्रगतीशील कॅरोसेलमध्ये दर्शविली जात आहेत.`
                : `${fieldVisits.length} field visit photos currently live in the website progressive carousel.`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'mr' ? 'नवीन शेत भेट जोडा' : 'Add Field Visit'}</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative pt-2 border-t border-stone-100">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'mr' 
                ? 'शीर्षक किंवा आयडीने शोधा...' 
                : 'Search by photo caption or ID...'
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
      </div>

      {/* ── Field Visits Cards Grid ── */}
      {filteredVisits.length === 0 ? (
        <EmptyStateView
          type={searchQuery ? 'search' : 'field_visits'}
          lang={lang}
          searchQuery={searchQuery}
          onAction={searchQuery ? () => setSearchQuery('') : () => { setEditingVisit(null); setIsEditorOpen(true); }}
          actionLabelEn={searchQuery ? 'Clear Search' : '+ Add Field Visit'}
          actionLabelMr={searchQuery ? 'शोध रद्द करा' : '+ नवीन शेत भेट जोडा'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVisits.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredVisits.length - 1;
            const primaryTitle = lang === 'mr' ? item.titleMr : item.titleEn;
            const secondaryTitle = lang === 'mr' ? item.titleEn : item.titleMr;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Photograph Preview */}
                  <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.imageSrc}
                      alt={primaryTitle}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 select-none"
                      loading="lazy"
                    />

                    {/* Sequence Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/95 text-stone-900 backdrop-blur-md border border-stone-200 shadow-xs">
                        #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                      </span>
                    </div>

                    {/* Tag badge */}
                    {item.tagEn && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-emerald-950 backdrop-blur-md border border-white/60 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{lang === 'mr' ? (item.tagMr || 'शेत भेट') : (item.tagEn || 'Field Visit')}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Information Body */}
                  <div className="p-4 sm:p-5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span>ID: {item.id}</span>
                      {item.order && <span>Order: #{item.order}</span>}
                    </div>

                    {/* Primary Title */}
                    <h3 className="text-sm font-bold text-stone-900 leading-snug line-clamp-1 font-serif">
                      {primaryTitle}
                    </h3>

                    {/* Secondary Title */}
                    <p className="text-xs text-stone-500 line-clamp-1 leading-relaxed overflow-visible">
                      {secondaryTitle}
                    </p>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveOrder(item.id, 'up')}
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
                      onClick={() => handleMoveOrder(item.id, 'down')}
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

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 hover:text-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{lang === 'mr' ? 'संपादित करा' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors cursor-pointer shadow-2xs"
                      title={lang === 'mr' ? 'काढून टाका (Delete)' : 'Delete Field Visit'}
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

      {/* Field Visit Editor Modal */}
      <FieldVisitEditorModal
        key={editingVisit ? `edit-${editingVisit.id}` : 'create-new'}
        isOpen={isEditorOpen}
        lang={lang}
        mode={editingVisit ? 'edit' : 'create'}
        visit={editingVisit}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingVisit(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          lang={lang}
          titleEn={`Delete Field Visit "${deleteTarget.titleEn}"?`}
          titleMr={`"${deleteTarget.titleMr}" शेत भेट काढून टाकायची?`}
          messageEn={`Are you sure you want to delete this field visit? This will remove the image and title from the public website.`}
          messageMr={`तुम्हाला खात्री आहे की तुम्ही ही शेत भेट हटवू इच्छिता? यामुळे हे छायाचित्र आणि शीर्षक थेट संकेतस्थळावरून काढून टाकले जाईल.`}
          confirmLabelEn="Delete Field Visit"
          confirmLabelMr="शेत भेट हटवा"
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
