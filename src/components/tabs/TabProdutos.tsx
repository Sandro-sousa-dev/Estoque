import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Pencil, X, Check, Plus, Ruler } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  estoque_minimo: number;
  quantidade_atual: number;
}

interface Unidade {
  id: string;
  nome: string;
  sigla: string;
}

interface Props {
  produtos: Produto[];
  unidades: Unidade[];
  onRefresh: () => void;
}

export default function TabProdutos({ produtos, unidades, onRefresh }: Props) {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [minimo, setMinimo] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCodigo, setEditCodigo] = useState('');
  const [editNome, setEditNome] = useState('');
  const [editUnidade, setEditUnidade] = useState('');
  const [editMinimo, setEditMinimo] = useState('');

  // Unit management
  const [showUnits, setShowUnits] = useState(false);
  const [newUnitNome, setNewUnitNome] = useState('');
  const [newUnitSigla, setNewUnitSigla] = useState('');
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!codigo || !nome || !minimo) return toast.error('Preencha os campos!');
    const { error } = await supabase.from('produtos').insert({
      codigo, nome, unidade, estoque_minimo: parseInt(minimo), quantidade_atual: 0
    });
    if (error) return toast.error('Erro ao guardar');
    toast.success('Material guardado!');
    setCodigo(''); setNome(''); setMinimo('');
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('produtos').delete().eq('id', deleteId);
    toast.success('Material removido!');
    setDeleteId(null);
    onRefresh();
  };

  const startEdit = (p: Produto) => {
    setEditId(p.id);
    setEditCodigo(p.codigo);
    setEditNome(p.nome);
    setEditUnidade(p.unidade);
    setEditMinimo(String(p.estoque_minimo));
  };

  const handleEdit = async () => {
    if (!editId || !editCodigo || !editNome || !editMinimo) return toast.error('Preencha todos os campos!');
    const { error } = await supabase.from('produtos').update({
      codigo: editCodigo, nome: editNome, unidade: editUnidade, estoque_minimo: parseInt(editMinimo),
    }).eq('id', editId);
    if (error) return toast.error('Erro ao atualizar');
    toast.success('Material atualizado!');
    setEditId(null);
    onRefresh();
  };

  const handleAddUnit = async () => {
    if (!newUnitNome || !newUnitSigla) return toast.error('Preencha nome e sigla!');
    const { error } = await supabase.from('unidades').insert({ nome: newUnitNome, sigla: newUnitSigla });
    if (error) return toast.error('Erro ao adicionar unidade. Sigla pode já existir.');
    toast.success('Unidade adicionada!');
    setNewUnitNome(''); setNewUnitSigla('');
    onRefresh();
  };

  const handleDeleteUnit = async () => {
    if (!deleteUnitId) return;
    await supabase.from('unidades').delete().eq('id', deleteUnitId);
    toast.success('Unidade removida!');
    setDeleteUnitId(null);
    onRefresh();
  };

  const unitOptions = unidades.length > 0 ? unidades : [
    { id: '1', nome: 'Unidade', sigla: 'un' },
    { id: '2', nome: 'Par', sigla: 'Par' },
    { id: '3', nome: 'Metro', sigla: 'm' },
    { id: '4', nome: 'Quilograma', sigla: 'kg' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black tracking-tight">Catálogo de Materiais</h2>
        <button onClick={() => setShowUnits(!showUnits)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${showUnits ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
          <Ruler className="w-4 h-4" /> Unidades
        </button>
      </div>

      {/* Unit Management */}
      {showUnits && (
        <div className="bg-card p-5 rounded-lg border mb-6 animate-fade-in">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" /> Gestão de Unidades de Medida
          </h3>
          <div className="flex gap-2 mb-4">
            <input placeholder="Nome (ex: Litro)" className="flex-1 bg-secondary p-3 rounded-lg outline-none text-foreground text-sm" value={newUnitNome} onChange={e => setNewUnitNome(e.target.value)} />
            <input placeholder="Sigla (ex: L)" className="w-28 bg-secondary p-3 rounded-lg outline-none text-foreground text-sm" value={newUnitSigla} onChange={e => setNewUnitSigla(e.target.value)} />
            <button onClick={handleAddUnit} className="bg-primary text-primary-foreground px-4 py-3 rounded-lg font-bold text-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {unitOptions.map(u => (
              <div key={u.id} className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg text-sm">
                <span className="font-bold">{u.sigla}</span>
                <span className="text-muted-foreground text-xs">({u.nome})</span>
                <button onClick={() => setDeleteUnitId(u.id)} className="text-muted-foreground/40 hover:text-destructive ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product */}
      <div className="bg-card p-5 rounded-lg border mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input placeholder="ID/Cód" className="bg-secondary p-3 rounded-lg outline-none text-foreground font-semibold text-sm" value={codigo} onChange={e => setCodigo(e.target.value)} />
          <input placeholder="Nome do Material" className="bg-secondary p-3 rounded-lg outline-none text-foreground font-semibold text-sm" value={nome} onChange={e => setNome(e.target.value)} />
          <select className="bg-secondary p-3 rounded-lg outline-none text-foreground font-semibold text-sm" value={unidade} onChange={e => setUnidade(e.target.value)}>
            {unitOptions.map(u => (
              <option key={u.id} value={u.sigla}>{u.nome} ({u.sigla})</option>
            ))}
          </select>
          <input type="number" placeholder="Estoque Mínimo" className="bg-secondary p-3 rounded-lg outline-none text-foreground font-semibold text-sm" value={minimo} onChange={e => setMinimo(e.target.value)} />
        </div>
        <button onClick={handleAdd} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg shadow-sm transition-all active:scale-[0.98] text-sm">
          Guardar Material
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {produtos.map(p => (
          <div key={p.id} className="bg-card p-4 rounded-lg border flex justify-between items-center transition-all hover:shadow-md">
            {editId === p.id ? (
              <div className="flex-1 space-y-2 mr-2">
                <input className="w-full bg-secondary p-2 rounded-lg outline-none text-foreground font-semibold text-sm" value={editCodigo} onChange={e => setEditCodigo(e.target.value)} placeholder="Código" />
                <input className="w-full bg-secondary p-2 rounded-lg outline-none text-foreground font-semibold text-sm" value={editNome} onChange={e => setEditNome(e.target.value)} placeholder="Nome" />
                <select className="w-full bg-secondary p-2 rounded-lg outline-none text-foreground font-semibold text-sm" value={editUnidade} onChange={e => setEditUnidade(e.target.value)}>
                  {unitOptions.map(u => (
                    <option key={u.id} value={u.sigla}>{u.nome} ({u.sigla})</option>
                  ))}
                </select>
                <input type="number" className="w-full bg-secondary p-2 rounded-lg outline-none text-foreground font-semibold text-sm" value={editMinimo} onChange={e => setEditMinimo(e.target.value)} placeholder="Estoque Mínimo" />
              </div>
            ) : (
              <div>
                <p className="font-bold text-sm">{p.nome}</p>
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">
                  Cód: {p.codigo} • {p.unidade} • Mín: {p.estoque_minimo}
                </p>
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {editId === p.id ? (
                <>
                  <button onClick={handleEdit} className="text-success hover:text-success/80 transition-colors p-1.5"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditId(null)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(p)} className="text-muted-foreground/40 hover:text-primary transition-colors p-1.5"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(p.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors p-1.5"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {deleteId && <ConfirmModal message="Remover este material?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {deleteUnitId && <ConfirmModal message="Remover esta unidade?" onConfirm={handleDeleteUnit} onCancel={() => setDeleteUnitId(null)} />}
    </div>
  );
}
