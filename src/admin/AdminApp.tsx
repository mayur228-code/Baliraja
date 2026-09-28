import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { Language } from '../types';
import { authService } from './auth/authService';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

interface AdminAppProps {
  onExitAdmin: () => void;
}

export const AdminApp: FC<AdminAppProps> = ({ onExitAdmin }) => {
  const [lang, setLang] = useState<Language>('mr');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    authService.checkSession().then((isAuth) => {
      if (isMounted) {
        setIsAuthenticated(isAuth);
        setIsInitializing(false);
      }
    }).catch(() => {
      if (isMounted) {
        setIsInitializing(false);
      }
    });

    const unsubscribe = authService.subscribeToAuth((isAuth) => {
      if (isMounted) {
        setIsAuthenticated(isAuth);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'mr' ? 'en' : 'mr'));
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin
        lang={lang}
        onToggleLang={handleToggleLang}
        onLoginSuccess={handleLoginSuccess}
        onBackToPublicSite={onExitAdmin}
      />
    );
  }

  return (
    <AdminDashboard
      lang={lang}
      onToggleLang={handleToggleLang}
      onLogout={handleLogout}
      onViewPublicSite={onExitAdmin}
    />
  );
};

export default AdminApp;
