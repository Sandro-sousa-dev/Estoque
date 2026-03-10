import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Produto { id: string; codigo: string; nome: string; unidade: string; estoque_minimo: number; quantidade_atual: number; }
interface Funcionario { id: string; nome: string; matricula: string; funcao: string | null; }
interface Empresa { id: string; nome: string; }

interface Props {
  produtos: Produto[];
  funcionarios: Funcionario[];
  empresas: Empresa[];
  onRefresh: () => void;
}

export default function TabMovimentacoes({ produtos, funcionarios, empresas, onRefresh }: Props) {
  const [tipo, setTipo] = useState<'saida' | 'entrada'>('saida');
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [funcionarioId, setFuncionarioId] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [validadeLote, setValidadeLote] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = async () => {
    const q = parseInt(quantidade);
    if (!produtoId || !q || !funcionarioId) return toast.error('Preencha os dados obrigatórios!');
    const prod = produtos.find(p => p.id === produtoId);
    if (!prod) return;
    if (tipo === 'saida' && prod.quantidade_atual < q) return toast.error('Saldo insuficiente!');

    const newQty = tipo === 'entrada' ? prod.quantidade_atual + q : prod.quantidade_atual - q;

    const { error: e1 } = await supabase.from('produtos').update({ quantidade_atual: newQty }).eq('id', produtoId);
    if (e1) return toast.error('Erro ao atualizar estoque');

    const observacaoComItem = observacoes.trim()
      ? `[ITEM:${prod.nome}] ${observacoes.trim()}`
      : `[ITEM:${prod.nome}]`;

    const { error: e2 } = await supabase.from('movimentacoes').insert({
      tipo,
      produto_id: produtoId,
      quantidade: q,
      funcionario_id: funcionarioId,
      empresa_id: empresaId || null,
      validade_lote: validadeLote || null,
      observacoes: observacaoComItem,
    });
    if (e2) return toast.error('Erro ao registar movimentação');

    toast.success('Lançamento realizado!');
    setQuantidade(''); setObservacoes('');
    onRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-black mb-6 tracking-tight">Lançar Movimento</h2>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTipo('saida')}
          className={`flex-1 p-5 rounded-lg border-2 font-black text-lg transition-all ${
            tipo === 'saida'
              ? 'border-destructive bg-destructive/5 text-destructive'
              : 'border-transparent bg-card text-muted-foreground opacity-50'
          }`}
        >
          RETIRADA
        </button>
        <button
          onClick={() => setTipo('entrada')}
          className={`flex-1 p-5 rounded-lg border-2 font-black text-lg transition-all ${
            tipo === 'entrada'
              ? 'border-success bg-success/5 text-success'
              : 'border-transparent bg-card text-muted-foreground opacity-50'
          }`}
        >
          CARGA
        </button>
      </div>

      <div className="bg-card p-6 rounded-lg border space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Produto</label>
          <select className="w-full bg-secondary p-4 rounded-lg text-foreground outline-none font-semibold text-sm" value={produtoId} onChange={e => setProdutoId(e.target.value)}>
            <option value="">Selecione o Material</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (Saldo: {p.quantidade_atual})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Quantidade</label>
            <input type="number" placeholder="0" className="w-full bg-secondary p-4 rounded-lg text-foreground outline-none font-black text-xl" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Validade do Lote</label>
            <input type="date" className="w-full bg-secondary p-4 rounded-lg text-foreground outline-none font-semibold text-sm" value={validadeLote} onChange={e => setValidadeLote(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Responsável</label>
            <select className="w-full bg-secondary p-4 rounded-lg text-foreground outline-none font-semibold text-sm" value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)}>
              <option value="">Quem retira/traz?</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} ({f.matricula})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Empresa</label>
            <select className="w-full bg-secondary p-4 rounded-lg text-foreground outline-none font-semibold text-sm" value={empresaId} onChange={e => setEmpresaId(e.target.value)}>
              <option value="">Empresa Vinculada</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Observações</label>
          <textarea rows={3} placeholder="Anote detalhes importantes..." className="w-full bg-secondary p-4 rounded-lg text-foreground outline-none font-medium resize-none text-sm" value={observacoes} onChange={e => setObservacoes(e.target.value)} />
        </div>

        <button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground font-black py-4 rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm uppercase tracking-wider">
          Efetuar Lançamento
        </button>
      </div>
    </div>
  );
}
