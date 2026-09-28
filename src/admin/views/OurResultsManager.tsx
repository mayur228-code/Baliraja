import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Award, 
  User,
  MapPin,
  Sparkles
} from 'lucide-react';
import type { FarmerResult, Language } from '../../types';
import { useContentStore } from '../data/contentStore';
import { ResultEditorModal } from './ResultEditorModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyStateView } from '../../components/common/StateViews';

interface OurResultsManagerProps {
  lang: Language;
  onShowToast: (type: 'success' | 'error' | 'info', en: string, mr: string) => void;
}

export const OurResultsManager: FC<OurResultsManagerProps> = ({ lang, onShowToast }) => {
  const { 
    results, 
    createResult, 
    updateResult, 
    deleteResult, 
    moveResultOrder 
  } = useContentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<FarmerResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FarmerResult | null>(null);

  // Filter results
  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return results;
    return results.filter((r) => {
      const nameEn = (r.name?.en || r.nameEn || '').toLowerCase();
      const nameMr = r.name?.mr || r.nameMr || '';
      const locEn = (r.location?.en || r.locationEn || '').toLowerCase();
      const locMr = r.location?.mr || r.locationMr || '';
      const matchId = r.id.toLowerCase().includes(q);

      return nameEn.includes(q) || nameMr.includes(q) || locEn.includes(q) || locMr.includes(q) || matchId;
    });
  }, [results, searchQuery]);

  const handleOpenAdd = () => {
    setEditingResult(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: FarmerResult) => {
    setEditingResult(item);
    setIsEditorOpen(true);
  };

  const handleSave = (resultItem: FarmerResult) => {
    const res = editingResult 
      ? updateResult(editingResult.id, resultItem)
      : createResult(resultItem);

    if (res.success) {
      setIsEditorOpen(false);
      setEditingResult(null);
      const displayName = lang === 'mr' ? resultItem.name.mr : resultItem.name.en;
      onShowToast(
        'success',
        `Farmer result for "${resultItem.name.en}" saved successfully.`,
        `"${displayName}" शेतकरी निकाल यशस्वीरित्या जतन केला.`
      );
    } else {
      onShowToast(
        'error',
        res.error || 'Failed to save farmer result.',
        'शेतकरी निकाल जतन करताना त्रुटी आली.'
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const nameEn = deleteTarget.name?.en || deleteTarget.nameEn || 'Farmer';
    const nameMr = deleteTarget.name?.mr || deleteTarget.nameMr || 'शेतकरी';
    const res = deleteResult(deleteTarget.id);
    setDeleteTarget(null);

    if (res.success) {
      onShowToast(
        'success',
        `Farmer result "${nameEn}" removed.`,
        `"${nameMr}" शेतकरी निकाल यशस्वीरित्या काढण्यात आला.`
      );
    } else {
      onShowToast('error', res.error || 'Failed to delete.', 'शेतकरी निकाल हटवणे अयशस्वी.');
    }
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    moveResultOrder(id, direction);
    onShowToast(
      'info',
      'Farmer result display order updated.',
      'शेतकरी निकालांचा क्रम अद्ययावत झाला.'
    );
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* ── Top Summary & Action Bar ── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/20 flex items-center justify-center text-amber-700 shadow-xs shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 font-serif leading-relaxed overflow-visible">
                  {lang === 'mr' ? 'आमचे परिणाम व्यवस्थापन' : 'Our Results Management'}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  {results.length} {lang === 'mr' ? 'निकाल' : 'Results'}
                </span>
              </div>
              <p className="text-2xs text-stone-500 mt-0.5 leading-relaxed">
                {lang === 'mr'
                  ? `एकूण ${results.length} शेतकरी निकाल मुख्यपृष्ठावर डावी-उजवी वाहत्या रचनेमध्ये दर्शविले जात आहेत.`
                  : `${results.length} real farmer yield records live on the website in an alternating flow.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="leading-relaxed">{lang === 'mr' ? 'नवीन शेतकरी निकाल जोडा' : 'Add Farmer Result'}</span>
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
                ? 'शेतकऱ्याचे नाव किंवा गावाच्या नावाने शोधा...' 
                : 'Search by farmer name, location or ID...'
            }
            className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors shadow-xs leading-relaxed"
          />
        </div>
      </div>

      {/* ── Results Cards Grid ── */}
      {filteredResults.length === 0 ? (
        <EmptyStateView
          type={searchQuery ? 'search' : 'results'}
          lang={lang}
          searchQuery={searchQuery}
          onAction={searchQuery ? () => setSearchQuery('') : () => { setEditingResult(null); setIsEditorOpen(true); }}
          actionLabelEn={searchQuery ? 'Clear Search' : '+ Add Farmer Result'}
          actionLabelMr={searchQuery ? 'शोध रद्द करा' : '+ नवीन शेतकरी निकाल जोडा'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResults.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === filteredResults.length - 1;
            const primaryName = lang === 'mr' ? (item.name?.mr || item.nameMr) : (item.name?.en || item.nameEn);
            const secondaryName = lang === 'mr' ? (item.name?.en || item.nameEn) : (item.name?.mr || item.nameMr);
            const primaryLoc = lang === 'mr' ? (item.location?.mr || item.locationMr) : (item.location?.en || item.locationEn);
            const secondaryLoc = lang === 'mr' ? (item.location?.en || item.locationEn) : (item.location?.mr || item.locationMr);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md ring-1 ring-black/[0.02] overflow-hidden transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Portrait Photograph Preview with Brand Logo Watermark */}
                  <div className="relative aspect-[3/4] max-h-[300px] w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.image}
                      alt={primaryName}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 select-none"
                      loading="lazy"
                    />

                    {/* Sequence Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-full text-3xs font-extrabold bg-white/95 text-stone-900 backdrop-blur-md border border-stone-200 shadow-xs">
                        #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                      </span>
                    </div>

                    {/* Brand Logo Watermark */}
                    <div className="absolute top-2.5 right-2.5 pointer-events-none">
                      <div className="w-8 h-8 rounded-xl p-1 bg-white/85 backdrop-blur-md border border-white/90 shadow-xs flex items-center justify-center">
                        <img
                          src="/assets/logo.png"
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Information Body */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-3xs text-stone-400 font-mono">
                      <span>ID: {item.id}</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Order #{item.order}</span>
                      </span>
                    </div>

                    {/* Farmer Name */}
                    <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-sm leading-relaxed overflow-visible">
                      <User className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate">{primaryName}</span>
                      {secondaryName && secondaryName !== primaryName && (
                        <span className="text-2xs text-stone-400 font-normal truncate">({secondaryName})</span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-stone-600 text-xs font-medium leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{primaryLoc}</span>
                      {secondaryLoc && secondaryLoc !== primaryLoc && (
                        <span className="text-3xs text-stone-400 font-normal truncate">({secondaryLoc})</span>
                      )}
                    </div>
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
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isFirst
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-emerald-700 active:scale-95'
                      }`}
                      title={lang === 'mr' ? 'वर हलवा (Move Up)' : 'Move Up'}
                      aria-label="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveOrder(item.id, 'down')}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isLast
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-emerald-700 active:scale-95'
                      }`}
                      title={lang === 'mr' ? 'खाली हलवा (Move Down)' : 'Move Down'}
                      aria-label="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 hover:text-emerald-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="leading-relaxed">{lang === 'mr' ? 'संपादित करा' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                      title={lang === 'mr' ? 'काढून टाका (Delete)' : 'Delete Farmer Result'}
                      aria-label="Delete farmer result"
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

      {/* Result Editor Modal */}
      <ResultEditorModal
        key={editingResult ? `edit-${editingResult.id}` : 'create-new'}
        isOpen={isEditorOpen}
        lang={lang}
        mode={editingResult ? 'edit' : 'create'}
        result={editingResult}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingResult(null);
        }}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          lang={lang}
          titleEn={`Delete Result for "${deleteTarget.name?.en || deleteTarget.nameEn}"?`}
          titleMr={`"${deleteTarget.name?.mr || deleteTarget.nameMr}" शेतकरी निकाल काढून टाकायचा?`}
          messageEn={`Are you sure you want to delete this result? This will remove the photo, farmer name, and location from the public website.`}
          messageMr={`तुम्हाला खात्री आहे की तुम्ही हा शेतकरी निकाल हटवू इच्छिता? यामुळे हे छायाचित्र, नाव आणि गाव थेट संकेतस्थळावरून काढून टाकले जाईल.`}
          confirmLabelEn="Delete Result"
          confirmLabelMr="निकाल हटवा"
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
