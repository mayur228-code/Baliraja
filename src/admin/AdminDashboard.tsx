import { useState } from 'react';
import type { FC } from 'react';
import type { Language } from '../types';
import type { AdminSection } from './types/adminTypes';
import { AdminLayout } from './components/AdminLayout';
import type { ToastMessage } from './components/ToastNotification';
import { OverviewView } from './views/OverviewView';
import { CategoryManager } from './views/CategoryManager';
import { ProductManager } from './views/ProductManager';
import { BrandManager } from './views/BrandManager';
import { FieldVisitsManager } from './views/FieldVisitsManager';
import { OurResultsManager } from './views/OurResultsManager';
import { AboutManager } from './views/AboutManager';
import { ContactLocationManager } from './views/ContactLocationManager';
import { SettingsView } from './views/SettingsView';

interface AdminDashboardProps {
  lang: Language;
  onToggleLang: () => void;
  onLogout: () => void;
  onViewPublicSite: () => void;
}

export const AdminDashboard: FC<AdminDashboardProps> = ({
  lang,
  onToggleLang,
  onLogout,
  onViewPublicSite
}) => {
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleShowToast = (type: 'success' | 'error' | 'info', messageEn: string, messageMr: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newToast: ToastMessage = { id, type, messageEn, messageMr };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AdminLayout
      currentSection={currentSection}
      lang={lang}
      onSelectSection={setCurrentSection}
      onToggleLang={onToggleLang}
      onLogout={onLogout}
      onViewPublicSite={onViewPublicSite}
      toasts={toasts}
      onDismissToast={handleDismissToast}
    >
      {currentSection === 'overview' && (
        <OverviewView 
          lang={lang} 
          onNavigateSection={setCurrentSection} 
        />
      )}

      {currentSection === 'categories' && (
        <CategoryManager 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}

      {currentSection === 'products' && (
        <ProductManager 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}

      {currentSection === 'brands' && (
        <BrandManager 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}

      {currentSection === 'field-visits' && (
        <FieldVisitsManager 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}

      {currentSection === 'our-results' && (
        <OurResultsManager 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}

      {currentSection === 'about' && (
        <AboutManager 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}

      {currentSection === 'contact-location' && (
        <ContactLocationManager 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}

      {currentSection === 'settings' && (
        <SettingsView 
          lang={lang} 
          onShowToast={handleShowToast} 
        />
      )}
    </AdminLayout>
  );
};
