import type { FC } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers,
  Building2,
  Camera,
  Award,
  UserCheck, 
  MapPin, 
  Settings, 
  LogOut,
  ExternalLink,
  ShieldCheck,
  X,
  ChevronRight,
  Database
} from 'lucide-react';
import type { AdminSection } from '../types/adminTypes';
import type { Language } from '../../types';
import { useContentStore } from '../data/contentStore';

interface AdminSidebarProps {
  currentSection: AdminSection;
  lang: Language;
  onSelectSection: (section: AdminSection) => void;
  onLogout: () => void;
  onViewPublicSite: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavGroup {
  groupTitleEn: string;
  groupTitleMr: string;
  items: {
    id: AdminSection;
    labelEn: string;
    labelMr: string;
    icon: typeof LayoutDashboard;
    countKey?: 'products' | 'categories' | 'brands' | 'fieldVisits' | 'results';
  }[];
}

export const AdminSidebar: FC<AdminSidebarProps> = ({
  currentSection,
  lang,
  onSelectSection,
  onLogout,
  onViewPublicSite,
  isOpenMobile,
  onCloseMobile
}) => {
  const { products, allCategories, brands, fieldVisits, results } = useContentStore();

  const counts: Record<string, number> = {
    products: products.length,
    categories: allCategories.length,
    brands: brands.length,
    fieldVisits: fieldVisits.length,
    results: results.length
  };

  const navGroups: NavGroup[] = [
    {
      groupTitleEn: 'Main',
      groupTitleMr: 'मुख्य',
      items: [
        { id: 'overview', labelEn: 'Overview', labelMr: 'डॅशबोर्ड सारांश', icon: LayoutDashboard }
      ]
    },
    {
      groupTitleEn: 'Catalog & Inventory',
      groupTitleMr: 'उत्पादने व वर्गवारी',
      items: [
        { id: 'categories', labelEn: 'Categories', labelMr: 'श्रेणी व्यवस्थापन', icon: Layers, countKey: 'categories' },
        { id: 'products', labelEn: 'Products', labelMr: 'उत्पादने व्यवस्थापन', icon: Package, countKey: 'products' },
        { id: 'brands', labelEn: 'Connected Brands', labelMr: 'जोडलेले ब्रँड्स', icon: Building2, countKey: 'brands' }
      ]
    },
    {
      groupTitleEn: 'Media & Field Proof',
      groupTitleMr: 'शेत भेट व निकाल',
      items: [
        { id: 'field-visits', labelEn: 'Field Visits', labelMr: 'शेत भेट छायाचित्रे', icon: Camera, countKey: 'fieldVisits' },
        { id: 'our-results', labelEn: 'Our Results', labelMr: 'आमचे निकाल', icon: Award, countKey: 'results' }
      ]
    },
    {
      groupTitleEn: 'Store Profile & System',
      groupTitleMr: 'दुकान माहिती व सुरक्षा',
      items: [
        { id: 'about', labelEn: 'About & Owner', labelMr: 'परिचय व संचालक', icon: UserCheck },
        { id: 'contact-location', labelEn: 'Contact & Location', labelMr: 'संपर्क व नकाशा', icon: MapPin },
        { id: 'settings', labelEn: 'Settings & Backup', labelMr: 'सेटिंग्ज व डेटा बॅकअप', icon: Settings }
      ]
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white text-stone-700 border-r border-stone-200/90 p-4 sm:p-5 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <a 
            href="/"
            title={lang === 'mr' ? 'मुख्य संकेतस्थळावर जा' : 'Go to Public Home'}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-emerald-500 transition-colors">
              <img
                src="/assets/logo.png"
                alt="Baliraja Logo"
                className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-stone-900 font-serif tracking-tight group-hover:text-emerald-700 transition-colors truncate">
                {lang === 'mr' ? 'बळीराजा कृषी सेवा' : 'Baliraja Krishi Seva'}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>{lang === 'mr' ? 'प्रशासक पोर्टल' : 'Admin Control'}</span>
              </div>
            </div>
          </a>
          
          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live System Status Pill */}
        <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 text-[11px] leading-relaxed flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-700" />
            <div className="truncate">
              <span className="font-bold text-stone-900 block truncate">
                {lang === 'mr' ? 'प्रमाणित सत्र सुरू' : 'Authorized Session'}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">
                {lang === 'mr' ? 'लाइव्ह डेटा सिंक सुरू' : 'Live Client DB Sync'}
              </span>
            </div>
          </div>
          <Database className="w-3.5 h-3.5 text-emerald-700/60 shrink-0" />
        </div>

        {/* Categorized Navigation Groups */}
        <nav className="space-y-5" aria-label="Admin Navigation">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {lang === 'mr' ? group.groupTitleMr : group.groupTitleEn}
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  const count = item.countKey ? counts[item.countKey] : undefined;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectSection(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer text-left group ${
                        isActive
                          ? 'bg-emerald-700 text-white font-bold shadow-xs shadow-emerald-900/10 ring-1 ring-emerald-600/30'
                          : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-stone-400 group-hover:text-emerald-700'
                        }`} />
                        <span className="truncate leading-relaxed">
                          {lang === 'mr' ? item.labelMr : item.labelEn}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {count !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                            isActive
                              ? 'bg-emerald-800 text-white'
                              : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200/80 group-hover:text-stone-900'
                          }`}>
                            {count}
                          </span>
                        )}
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom controls */}
      <div className="pt-4 mt-6 border-t border-stone-100 space-y-2">
        <button
          type="button"
          onClick={onViewPublicSite}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/90 transition-all cursor-pointer group shadow-2xs"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 transition-colors" />
            <span>{lang === 'mr' ? 'मुख्य संकेतस्थळ पहा' : 'View Public Website'}</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-500 group-hover:text-stone-800">
            /
          </span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800 border border-transparent hover:border-rose-200/60 transition-all cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="truncate">{lang === 'mr' ? 'बाहेर पडा (Logout)' : 'Sign Out of Admin'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 shadow-sm z-20">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpenMobile && (
        <div 
          className="lg:hidden fixed inset-0 z-50 flex bg-stone-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-72 max-w-[85vw] h-full animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onCloseMobile} aria-label="Close backdrop" />
        </div>
      )}
    </>
  );
};
