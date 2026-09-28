import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import type { Language } from '../../types';
import type { AdminSection } from '../types/adminTypes';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ToastNotification, type ToastMessage } from './ToastNotification';

interface AdminLayoutProps {
  currentSection: AdminSection;
  lang: Language;
  onSelectSection: (section: AdminSection) => void;
  onToggleLang: () => void;
  onLogout: () => void;
  onViewPublicSite: () => void;
  toasts: ToastMessage[];
  onDismissToast: (id: string) => void;
  children: ReactNode;
}

export const AdminLayout: FC<AdminLayoutProps> = ({
  currentSection,
  lang,
  onSelectSection,
  onToggleLang,
  onLogout,
  onViewPublicSite,
  toasts,
  onDismissToast,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans text-stone-900 selection:bg-emerald-100 selection:text-emerald-900 antialiased">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <AdminSidebar
        currentSection={currentSection}
        lang={lang}
        onSelectSection={onSelectSection}
        onLogout={onLogout}
        onViewPublicSite={onViewPublicSite}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          currentSection={currentSection}
          lang={lang}
          onToggleLang={onToggleLang}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastNotification
        toasts={toasts}
        lang={lang}
        onDismiss={onDismissToast}
      />
    </div>
  );
};
