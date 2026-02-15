import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, DollarSign, Settings, CreditCard, Shield, LogOut, Menu, X, Globe } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.nav.dashboard },
    { id: 'products', icon: Package, label: t.nav.products },
    { id: 'sales', icon: ShoppingCart, label: t.nav.sales },
    { id: 'reports', icon: TrendingUp, label: t.nav.reports },
    { id: 'expenses', icon: DollarSign, label: t.nav.expenses },
    { id: 'subscription', icon: CreditCard, label: t.nav.subscription },
    { id: 'settings', icon: Settings, label: t.nav.settings },
  ];

  if (profile?.role === 'admin') {
    menuItems.push({ id: 'admin', icon: Shield, label: t.nav.admin });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden bg-blue-600 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.common.appName}</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 flex flex-col`}>
          <div className="p-6 border-b hidden md:block">
            <h1 className="text-2xl font-bold text-blue-600">{t.common.appName}</h1>
            <p className="text-sm text-gray-600 mt-1">{profile?.business_name}</p>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t space-y-2">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">{t.settings.language}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-lg">
                  {[{ code: 'en', name: 'English' }, { code: 'ur', name: 'اردو' }, { code: 'ps', name: 'پښتو' }].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as 'en' | 'ur' | 'ps');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${language === lang.code ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t.auth.logout}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
