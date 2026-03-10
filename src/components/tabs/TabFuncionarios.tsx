import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserMinus } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Funcionario { id: string; nome: string; matricula: string; funcao: string | null; }

export default function TabFuncionarios({ funcionarios, onRefresh }: { funcionarios: Funcionario[]; onRefresh: () => void }) {
  const [matricula, setMatricula] = useState('');
  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!matricula || !nome) return toast.error('Preencha ID e Nome!');
    const { error } = await supabase.from('funcionarios').insert({ matricula, nome, funcao: funcao || null });
    if (error) return toast.error('Erro ao cadastrar');
    toast.success('Membro cadastrado!');
    setMatricula(''); setNome(''); setFuncao('');
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('funcionarios').delete().eq('id', deleteId);
    toast.success('Membro removido!');
    setDeleteId(null);
    onRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-black mb-8 tracking-tight">Equipe</h2>
      <div className="bg-card p-8 rounded-3xl shadow-sm border mb-8 space-y-4">
        <input placeholder="ID / Matrícula" className="w-full bg-secondary p-5 rounded-2xl outline-none text-foreground font-bold" value={matricula} onChange={e => setMatricula(e.target.value)} />
        <input placeholder="Nome Completo" className="w-full bg-secondary p-5 rounded-2xl outline-none text-foreground font-bold" value={nome} onChange={e => setNome(e.target.value)} />
        <input placeholder="Função / Cargo" className="w-full bg-secondary p-5 rounded-2xl outline-none text-foreground font-bold" value={funcao} onChange={e => setFuncao(e.target.value)} />
        <button onClick={handleAdd} className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95">
          Registar Membro
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {funcionarios.map(f => (
          <div key={f.id} className="bg-card p-5 rounded-3xl border flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-primary text-xl">
                {f.nome[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{f.nome}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Mat: {f.matricula} • {f.funcao || 'N/A'}
                </p>
              </div>
            </div>
            <button onClick={() => setDeleteId(f.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {deleteId && <ConfirmModal message="Remover este membro?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  );
}
