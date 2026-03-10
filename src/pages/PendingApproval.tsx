import { Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PendingApproval() {
  const { signOut } = useAuth();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm w-full bg-card p-12 rounded-3xl shadow-2xl text-center border animate-fade-in">
        <Lock className="w-16 h-16 text-warning mx-auto mb-6" />
        <h2 className="text-2xl font-black mb-2">Pendente</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          O administrador precisa aprovar o seu acesso.
        </p>
        <button
          onClick={signOut}
          className="w-full bg-secondary text-foreground font-bold py-4 rounded-2xl"
        >
          Voltar
        </button>
      </div>
    </main>
  );
}
