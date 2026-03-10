import { useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Package, BarChart3, Warehouse, Boxes, ArrowLeftRight,
  History, Users, Building2, ShieldCheck, Sun, Moon,
  LogOut, Menu, X
} from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';

interface AppLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  searchData?: {
    produtos: any[];
    funcionarios: any[];
    empresas: any[];
  };
}

const navItems = [
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
  { id: 'estoque', icon: Warehouse, label: 'Estoque' },
  { id: 'produtos', icon: Boxes, label: 'Materiais' },
  { id: 'movimentacoes', icon: ArrowLeftRight, label: 'Lançamentos' },
  { id: 'historico', icon: History, label: 'Histórico' },
  { id: 'funcionarios', icon: Users, label: 'Membros' },
  { id: 'empresas', icon: Building2, label: 'Empresas' },
];

export default function AppLayout({ activeTab, onTabChange, children, searchData }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('estoque_darkMode');
    if (stored === 'true') {
      document.documentElement.classList.add('dark');
      return true;
    }
    return false;
  });

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('estoque_darkMode', String(next));
    next ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  };

  const handleNav = (id: string) => {
    onTabChange(id);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - SAP-style dark navy */}
      <header className="h-14 bg-[hsl(207,25%,20%)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-white/70 hover:text-white">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded-lg">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="font-black text-base text-white tracking-tight hidden sm:block">ESTOQUE</h1>
          </div>
        </div>

        {/* Global Search */}
        <div className="flex-1 flex justify-center px-4">
          {searchData && (
            <GlobalSearch
              produtos={searchData.produtos}
              funcionarios={searchData.funcionarios}
              empresas={searchData.empresas}
              onNavigate={handleNav}
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={toggleDark} className="p-2 text-white/60 hover:text-white rounded-lg transition-colors">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={signOut} title="Sair do sistema" className="p-2 text-white/60 hover:text-white rounded-lg transition-colors flex items-center gap-1.5">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Sidebar - SAP dark */}
        <aside className={`absolute lg:static inset-y-0 left-0 z-40 w-60 bg-[hsl(var(--sidebar-background))] border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            {profile?.role === 'admin' && (
              <>
                <div className="border-t border-sidebar-border my-3" />
                <button
                  onClick={() => handleNav('admin')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'admin'
                      ? 'bg-warning text-warning-foreground shadow-lg'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Administração
                </button>
              </>
            )}
          </nav>
        </aside>

        {/* Overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-foreground/40 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
