import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Empresa { id: string; nome: string; }

export default function TabEmpresas({ empresas, onRefresh }: { empresas: Empresa[]; onRefresh: () => void }) {
  const [nome, setNome] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!nome) return toast.error('Preencha o nome!');
    const { error } = await supabase.from('empresas').insert({ nome });
    if (error) return toast.error('Erro ao guardar');
    toast.success('Empresa salva!');
    setNome('');
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('empresas').delete().eq('id', deleteId);
    toast.success('Empresa removida!');
    setDeleteId(null);
    onRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-black mb-8 tracking-tight">Empresas</h2>
      <div className="bg-card p-8 rounded-3xl shadow-sm border mb-8 space-y-4">
        <input placeholder="Nome / Razão Social" className="w-full bg-secondary p-5 rounded-2xl outline-none text-foreground font-bold" value={nome} onChange={e => setNome(e.target.value)} />
        <button onClick={handleAdd} className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95">
          Salvar Empresa
        </button>
      </div>
      <div className="space-y-3">
        {empresas.map(e => (
          <div key={e.id} className="bg-card p-5 rounded-3xl border flex justify-between items-center shadow-sm">
            <p className="font-bold flex items-center gap-4">
              <Building2 className="w-5 h-5 text-muted-foreground" />{e.nome}
            </p>
            <button onClick={() => setDeleteId(e.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {deleteId && <ConfirmModal message="Remover empresa?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  );
}
