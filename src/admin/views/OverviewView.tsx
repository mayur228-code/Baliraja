import type { FC } from 'react';
import { 
  Package, 
  Star, 
  Globe, 
  ShieldCheck, 
  MapPin, 
  History, 
  ArrowRight,
  Building2,
  Layers,
  Camera,
  Award,
  Sparkles,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import type { Language } from '../../types';
import type { AdminSection } from '../types/adminTypes';
import { StatCard } from '../components/StatCard';
import { useContentStore } from '../data/contentStore';

interface OverviewViewProps {
  lang: Language;
  onNavigateSection: (section: AdminSection) => void;
}

export const OverviewView: FC<OverviewViewProps> = ({ lang, onNavigateSection }) => {
  const { products, allCategories, brands, fieldVisits, results, businessInfo, ownerProfile, auditLog } = useContentStore();

  const totalProducts = products.length;
  const categoriesCount = allCategories.length;
  const brandsCount = brands.length;
  const fieldVisitsCount = fieldVisits.length;
  const resultsCount = results.length;
  const availableCount = products.filter((p) => p.availability === 'available').length;
  const outOfStockCount = products.filter((p) => p.availability === 'out_of_stock').length;
  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 antialiased">
      {/* ── Verified Business Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white border border-emerald-600/40 p-6 sm:p-8 shadow-md">
        {/* Subtle background glow */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true" 
        />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-500/40 text-emerald-100 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{lang === 'mr' ? 'प्रमाणित कृषी केंद्र नियंत्रण कक्ष' : 'Verified Agri-Business Dashboard'}</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-bold font-serif tracking-tight leading-normal overflow-visible text-white">
              {lang === 'mr' ? businessInfo.businessNameMr : businessInfo.businessNameEn}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-100/90 font-medium leading-relaxed">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{lang === 'mr' ? `संचालक: ${ownerProfile.nameMr}` : `Proprietor: ${ownerProfile.name}`}</span>
              </span>
              <span className="text-emerald-400 hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>{lang === 'mr' ? businessInfo.shopAddressMr : businessInfo.shopAddressEn}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateSection('products')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{lang === 'mr' ? 'उत्पादने व्यवस्थापन' : 'Manage Products'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateSection('categories')}
              className="px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/90 text-white text-xs font-bold rounded-xl border border-emerald-500/50 shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-emerald-200" />
              <span>{lang === 'mr' ? 'वर्गवारी पहा' : 'View Categories'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Real Factual Content Metrics Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-serif">
              {lang === 'mr' ? 'सामग्री व साठा आकडेवारी' : 'Content & Catalog Metrics'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'mr' ? 'प्रत्यक्ष डेटाबेसमधील वस्तुस्थिती निर्देशक' : 'Authoritative database records live on website'}
            </p>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'mr' ? 'थेट समक्रमित' : 'Live Sync Active'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            labelEn="Total Products"
            labelMr="एकूण उत्पादने"
            value={totalProducts}
            subtextEn={`${availableCount} In Stock • ${outOfStockCount} Out`}
            subtextMr={`${availableCount} उपलब्ध • ${outOfStockCount} अनुपलब्ध`}
            icon={<Package className="w-5 h-5" />}
            lang={lang}
            accent="emerald"
          />

          <StatCard
            labelEn="Categories"
            labelMr="वर्गवाऱ्या"
            value={categoriesCount}
            subtextEn="Agricultural product lines"
            subtextMr="सक्रिय कृषी निविष्ठा श्रेणी"
            icon={<Layers className="w-5 h-5" />}
            lang={lang}
            accent="emerald"
          />

          <StatCard
            labelEn="Featured Inputs"
            labelMr="वैशिष्ट्यीकृत"
            value={featuredCount}
            subtextEn="Home page highlights"
            subtextMr="मुख्य पृष्ठावरील निवडक उत्पादने"
            icon={<Star className="w-5 h-5" />}
            lang={lang}
            accent="amber"
          />

          <StatCard
            labelEn="Connected Brands"
            labelMr="जोडलेले ब्रँड्स"
            value={brandsCount}
            subtextEn="Partner agri companies"
            subtextMr="भागीदार कृषी कंपन्या"
            icon={<Building2 className="w-5 h-5" />}
            lang={lang}
            accent="emerald"
          />

          <StatCard
            labelEn="Field Visits"
            labelMr="शेत भेटी"
            value={fieldVisitsCount}
            subtextEn="Progressive carousel photos"
            subtextMr="कॅरोसेल शेत भेट छायाचित्रे"
            icon={<Camera className="w-5 h-5" />}
            lang={lang}
            accent="blue"
          />

          <StatCard
            labelEn="Farmer Results"
            labelMr="शेतकरी निकाल"
            value={resultsCount}
            subtextEn="Authentic yield showcases"
            subtextMr="प्रत्यक्ष शेतकरी यशोगाथा"
            icon={<Award className="w-5 h-5" />}
            lang={lang}
            accent="stone"
          />
        </div>
      </div>

      {/* ── Two Column Management: Quick Actions & Live Audit Trail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Content Management Grid (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">
                {lang === 'mr' ? 'जलद सामग्री व्यवस्थापन' : 'Quick Management Shortcuts'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {lang === 'mr' ? 'विभागावर थेट जाण्यासाठी क्लिक करा' : 'Jump directly into any section to edit or publish'}
              </p>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              {lang === 'mr' ? 'सर्व विभाग सक्रिय' : 'All Modules Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category System */}
            <button
              type="button"
              onClick={() => onNavigateSection('categories')}
              className="p-4 rounded-2xl border border-stone-200/80 hover:border-emerald-600 bg-stone-50/50 hover:bg-emerald-50/40 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                    {categoriesCount} {lang === 'mr' ? 'श्रेणी' : 'Cats'}
                  </span>
                </div>
                <div className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {lang === 'mr' ? 'वर्गवारी व्यवस्थापन' : 'Category System'}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  {lang === 'mr' 
                    ? 'वर्गवाऱ्या, छायाचित्रे, आयकॉन आणि क्रम बदला.' 
                    : 'Manage categories, photos, icons, and display sequence.'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>{lang === 'mr' ? 'संपादित करा' : 'Open Section'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Products & Stock */}
            <button
              type="button"
              onClick={() => onNavigateSection('products')}
              className="p-4 rounded-2xl border border-stone-200/80 hover:border-emerald-600 bg-stone-50/50 hover:bg-emerald-50/40 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                    {totalProducts} {lang === 'mr' ? 'उत्पादने' : 'Items'}
                  </span>
                </div>
                <div className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {lang === 'mr' ? 'उत्पादने व साठा' : 'Products & Stock'}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  {lang === 'mr' 
                    ? 'उत्पादने जोडा, माहिती संपादित करा किंवा उपलब्धता बदला.' 
                    : 'Update product descriptions, crops, or stock availability.'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>{lang === 'mr' ? 'संपादित करा' : 'Open Section'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Connected Brands */}
            <button
              type="button"
              onClick={() => onNavigateSection('brands')}
              className="p-4 rounded-2xl border border-stone-200/80 hover:border-emerald-600 bg-stone-50/50 hover:bg-emerald-50/40 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                    {brandsCount} {lang === 'mr' ? 'ब्रँड्स' : 'Brands'}
                  </span>
                </div>
                <div className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {lang === 'mr' ? 'जोडलेले ब्रँड्स' : 'Connected Brands'}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  {lang === 'mr' 
                    ? 'कंपनीचे लोगो, नावे व क्रम व्यवस्थापित करा.' 
                    : 'Manage partner brand logos, company names, and display order.'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>{lang === 'mr' ? 'संपादित करा' : 'Open Section'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Field Visits Gallery */}
            <button
              type="button"
              onClick={() => onNavigateSection('field-visits')}
              className="p-4 rounded-2xl border border-stone-200/80 hover:border-emerald-600 bg-stone-50/50 hover:bg-emerald-50/40 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                    {fieldVisitsCount} {lang === 'mr' ? 'फोटो' : 'Photos'}
                  </span>
                </div>
                <div className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {lang === 'mr' ? 'शेत भेट छायाचित्रे' : 'Field Visits Gallery'}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  {lang === 'mr' 
                    ? 'कॅरोसेलसाठी शेत भेटीची छायाचित्रे व शीर्षके व्यवस्थापित करा.' 
                    : 'Manage carousel photos, titles, and sequence.'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>{lang === 'mr' ? 'संपादित करा' : 'Open Section'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Our Results */}
            <button
              type="button"
              onClick={() => onNavigateSection('our-results')}
              className="p-4 rounded-2xl border border-stone-200/80 hover:border-emerald-600 bg-stone-50/50 hover:bg-emerald-50/40 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                    {resultsCount} {lang === 'mr' ? 'निकाल' : 'Results'}
                  </span>
                </div>
                <div className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {lang === 'mr' ? 'आमचे निकाल व्यवस्थापन' : 'Our Results Showcase'}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  {lang === 'mr' 
                    ? 'शेतकरी निकाल छायाचित्रे, नाव व ठिकाण व्यवस्थापित करा.' 
                    : 'Manage yield photos, farmer names, and locations.'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>{lang === 'mr' ? 'संपादित करा' : 'Open Section'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Store & Contact */}
            <button
              type="button"
              onClick={() => onNavigateSection('contact-location')}
              className="p-4 rounded-2xl border border-stone-200/80 hover:border-emerald-600 bg-stone-50/50 hover:bg-emerald-50/40 text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-stone-200 text-stone-800 group-hover:bg-stone-700 group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded-full border border-stone-200">
                    Kaij
                  </span>
                </div>
                <div className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 transition-colors">
                  {lang === 'mr' ? 'संपर्क व नकाशा' : 'Contact & Shop Location'}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mt-1">
                  {lang === 'mr' 
                    ? 'फोन क्रमांक, व्हॉट्सॲप आणि दुकानाचा पत्ता संपादित करा.' 
                    : 'Manage phone, WhatsApp, and Google Maps location.'}
                </p>
              </div>
              <div className="mt-3 flex items-center text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>{lang === 'mr' ? 'संपादित करा' : 'Open Section'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>

        {/* Right: Recent Admin Audit Trail Feed (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-stone-100 text-stone-700">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  {lang === 'mr' ? 'प्रशासक कृती नोंद (Audit Trail)' : 'Recent Admin Audit Trail'}
                </h3>
              </div>
              <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                {auditLog.length} entries
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 pt-3">
              {auditLog.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  {lang === 'mr' ? 'अद्याप कोणतीही नोंद उपलब्ध नाही.' : 'No audit entries recorded yet.'}
                </div>
              ) : (
                auditLog.slice(0, 7).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="p-3 rounded-2xl bg-stone-50/80 border border-stone-200/70 text-xs space-y-1 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span className="uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {entry.itemType}
                      </span>
                      <span className="font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-stone-800 font-medium leading-relaxed">
                      {lang === 'mr' ? entry.actionMr : entry.actionEn}
                    </div>
                    <div className="text-[10px] text-stone-400 font-normal">
                      By {entry.performedBy}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'mr' ? 'स्थानिक व सर्व्हर सिंक' : 'Synchronized with live store'}</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateSection('settings')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
            >
              {lang === 'mr' ? 'बॅकअप सेटिंग्ज →' : 'Backup Settings →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
