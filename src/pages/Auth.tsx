import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Package, Eye, EyeOff, Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        toast.success('Bem-vindo de volta!');
      } else {
        await signUp(email, password);
        toast.success('Conta criada com sucesso! Aguarde aprovação do administrador.');
      }
    } catch {
      toast.error(mode === 'login' ? 'Credenciais inválidas. Verifique e-mail e senha.' : 'Erro ao criar conta. E-mail pode já estar em uso.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-primary text-primary-foreground flex items-center justify-center rounded-3xl shadow-2xl mb-4">
            <Package className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">ESTOQUE</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão de Materiais</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl shadow-2xl border animate-fade-in overflow-hidden">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 border-b">
            <button
              onClick={() => setMode('login')}
              className={`py-4 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'login' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
            <button
              onClick={() => setMode('register')}
              className={`py-4 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'register' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground ml-1">E-mail</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full bg-input text-input-foreground p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground border border-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground ml-1">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-input text-input-foreground p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 pr-12 transition-all placeholder:text-muted-foreground border border-border"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" /> Entrar
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Solicitar Acesso
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sistema protegido por autenticação segura
        </p>
      </div>
    </main>
  );
}
