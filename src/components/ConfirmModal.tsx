import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-card p-10 rounded-3xl shadow-2xl max-w-xs w-full text-center border">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-6" />
        <h3 className="text-xl font-bold mb-8">{message}</h3>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-3 font-bold text-muted-foreground tracking-widest text-[10px] uppercase">
            Não
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-destructive text-destructive-foreground font-black rounded-2xl shadow-lg transition-all active:scale-95">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
