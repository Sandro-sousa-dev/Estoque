import { useMemo, useState } from 'react';
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  CubeIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  HashtagIcon,
  IdentificationIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { exportHistoricoCSV, sendHistoricoCsvByEmail } from '@/lib/csv-export';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  estoque_minimo: number;
  quantidade_atual: number;
}

interface Funcionario {
  id: string;
  nome: string;
  matricula: string;
}

interface Empresa {
  id: string;
  nome: string;
}

interface Movimentacao {
  id: string;
  tipo: string;
  produto_id: string;
  quantidade: number;
  funcionario_id: string;
  empresa_id: string | null;
  observacoes: string | null;
  created_at: string;
  validade_lote: string | null;
}

interface Props {
  movimentacoes: Movimentacao[];
  produtos: Produto[];
  funcionarios: Funcionario[];
  empresas: Empresa[];
  alertEmail?: string;
}

const ITEM_TAG_REGEX = /\[ITEM:(.+?)\]/;

export default function TabHistorico({
  movimentacoes,
  produtos,
  funcionarios,
  empresas,
  alertEmail = 'sousasandro419@gmail.com',
}: Props) {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showRanking, setShowRanking] = useState(false);

  const produtoMap = useMemo(() => new Map(produtos.map(p => [p.id, p])), [produtos]);
  const funcionarioMap = useMemo(() => new Map(funcionarios.map(f => [f.id, f])), [funcionarios]);
  const empresaMap = useMemo(() => new Map(empresas.map(e => [e.id, e])), [empresas]);

  const getItemName = (mov: Movimentacao) => {
    const produto = produtoMap.get(mov.produto_id);
    if (produto?.nome) return produto.nome;
    const fromTag = mov.observacoes?.match(ITEM_TAG_REGEX)?.[1]?.trim();
    return fromTag || 'Item excluído';
  };

  const getCleanObs = (obs: string | null) => {
    if (!obs) return null;
    const cleaned = obs.replace(ITEM_TAG_REGEX, '').trim();
    return cleaned || null;
  };

  const filtered = useMemo(() => {
    let list = movimentacoes;
    if (filterTipo !== 'todos') list = list.filter(m => m.tipo === filterTipo);
    if (dateFrom) list = list.filter(m => new Date(m.created_at) >= new Date(dateFrom));
    if (dateTo) list = list.filter(m => new Date(m.created_at) <= new Date(`${dateTo}T23:59:59`));
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter(m => {
      const produto = produtoMap.get(m.produto_id);
      const funcionario = funcionarioMap.get(m.funcionario_id);
      const empresa = m.empresa_id ? empresaMap.get(m.empresa_id) : null;
      return (
        getItemName(m).toLowerCase().includes(term) ||
        produto?.codigo?.toLowerCase().includes(term) ||
        funcionario?.nome?.toLowerCase().includes(term) ||
        funcionario?.matricula?.toLowerCase().includes(term) ||
        empresa?.nome?.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term)
      );
    });
  }, [search, filterTipo, dateFrom, dateTo, movimentacoes, produtoMap, funcionarioMap, empresaMap]);

  // Group by funcionario
  const grouped = useMemo(() => {
    const map = new Map<string, Movimentacao[]>();
    for (const m of filtered) {
      const list = map.get(m.funcionario_id) || [];
      list.push(m);
      map.set(m.funcionario_id, list);
    }
    return Array.from(map.entries()).map(([funcId, movs]) => ({
      funcionario: funcionarioMap.get(funcId),
      funcionarioId: funcId,
      movimentacoes: movs,
      totalEntrada: movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.quantidade, 0),
      totalSaida: movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.quantidade, 0),
    }));
  }, [filtered, funcionarioMap]);

  // Ranking: quem retirou mais
  const ranking = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of movimentacoes) {
      if (m.tipo === 'saida') {
        map.set(m.funcionario_id, (map.get(m.funcionario_id) || 0) + m.quantidade);
      }
    }
    return Array.from(map.entries())
      .map(([id, total]) => ({ funcionario: funcionarioMap.get(id), total }))
      .filter(r => r.funcionario)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [movimentacoes, funcionarioMap]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleExportCsv = () => exportHistoricoCSV({ movimentacoes: filtered, produtos, funcionarios, empresas });
  const handleSendEmail = () => sendHistoricoCsvByEmail({ toEmail: alertEmail, movimentacoes: filtered, produtos, funcionarios, empresas });

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-3xl font-black">Histórico de Movimentações</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowRanking(!showRanking)} className="bg-accent text-accent-foreground px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95">
            <TrophyIcon className="w-4 h-4" /> Ranking
          </button>
          <button onClick={handleExportCsv} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95">
            <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV
          </button>
          <button onClick={handleSendEmail} className="bg-secondary text-foreground px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm border hover:bg-secondary/80 transition-colors">
            <EnvelopeIcon className="w-4 h-4" /> Enviar por e-mail
          </button>
        </div>
      </div>

      {/* Ranking */}
      {showRanking && (
        <div className="bg-card p-4 rounded-lg border mb-6">
          <h3 className="font-black text-sm mb-3 flex items-center gap-2"><TrophyIcon className="w-4 h-4 text-warning" /> Top Retiradas por Funcionário</h3>
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma retirada registrada.</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.funcionario!.id} className="flex items-center gap-3 bg-secondary p-2.5 rounded-lg">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-warning text-warning-foreground' : i === 1 ? 'bg-muted text-muted-foreground' : i === 2 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{r.funcionario!.nome}</p>
                    <p className="text-[10px] text-muted-foreground">Mat: {r.funcionario!.matricula}</p>
                  </div>
                  <span className="font-black text-destructive text-lg shrink-0">-{r.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input type="text" placeholder="Buscar por item, responsável, matrícula, empresa ou ID..." className="w-full bg-secondary p-3 pl-10 rounded-lg outline-none text-foreground text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"><XMarkIcon className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex gap-2">
            {(['todos', 'entrada', 'saida'] as const).map(tipo => (
              <button key={tipo} onClick={() => setFilterTipo(tipo)} className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${filterTipo === tipo ? (tipo === 'saida' ? 'bg-destructive text-destructive-foreground' : tipo === 'entrada' ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground') : 'bg-secondary text-muted-foreground'}`}>
                {tipo === 'todos' ? 'Todos' : tipo === 'entrada' ? 'Cargas' : 'Retiradas'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-[10px] font-black uppercase text-muted-foreground">De:</label>
          <input type="date" className="bg-secondary p-2 rounded-lg text-sm outline-none text-foreground" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <label className="text-[10px] font-black uppercase text-muted-foreground">Até:</label>
          <input type="date" className="bg-secondary p-2 rounded-lg text-sm outline-none text-foreground" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-destructive font-bold">Limpar</button>}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4" />
          CSV inclui nome do item, matrícula, validade, quantidade e estado crítico/falta.
        </div>
      </div>

      {search && <p className="text-xs text-muted-foreground mb-3">{filtered.length} resultado(s) para "{search}"</p>}

      {/* Grouped by employee */}
      <div className="space-y-3">
        {grouped.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <InboxStackIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma movimentação encontrada</p>
          </div>
        ) : (
          grouped.map(group => (
            <Collapsible key={group.funcionarioId}>
              <CollapsibleTrigger className="w-full">
                <div className="bg-card p-4 rounded-lg border hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold truncate max-w-[250px] sm:max-w-[400px]">{group.funcionario?.nome || 'Funcionário removido'}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <IdentificationIcon className="w-3 h-3" />
                        <span>Mat: {group.funcionario?.matricula || '—'}</span>
                        <span>•</span>
                        <span>{group.movimentacoes.length} mov.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {group.totalEntrada > 0 && <span className="text-success font-black text-sm">+{group.totalEntrada}</span>}
                      {group.totalSaida > 0 && <span className="text-destructive font-black text-sm">-{group.totalSaida}</span>}
                      <ChevronDownIcon className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="ml-4 border-l-2 border-primary/20 pl-4 mt-1 space-y-2">
                  {group.movimentacoes.map(mov => {
                    const produto = produtoMap.get(mov.produto_id);
                    const empresa = mov.empresa_id ? empresaMap.get(mov.empresa_id) : null;
                    const isOut = mov.tipo === 'saida';
                    const itemName = getItemName(mov);
                    const cleanObs = getCleanObs(mov.observacoes);

                    return (
                      <div key={mov.id} className={`p-4 rounded-lg border transition-all ${isOut ? 'bg-destructive/5 border-destructive/15' : 'bg-success/5 border-success/15'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isOut ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}`}>
                            {isOut ? <ArrowUpIcon className="w-3.5 h-3.5" /> : <ArrowDownIcon className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-bold text-sm truncate max-w-[200px] sm:max-w-[350px]">{itemName}</h4>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isOut ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'}`}>
                                {isOut ? 'Retirada' : 'Carga'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                              <div className="flex items-center gap-1.5 bg-card p-2 rounded border">
                                <HashtagIcon className="w-3 h-3 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[8px] uppercase font-black text-muted-foreground">Nº Mov.</p>
                                  <p className="font-mono font-bold truncate">{mov.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 bg-card p-2 rounded border">
                                <BuildingOffice2Icon className="w-3 h-3 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[8px] uppercase font-black text-muted-foreground">Empresa</p>
                                  <p className="font-bold truncate">{empresa?.nome || '—'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 bg-card p-2 rounded border">
                                <CalendarDaysIcon className="w-3 h-3 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[8px] uppercase font-black text-muted-foreground">Data</p>
                                  <p className="font-bold">{fmtDate(mov.created_at)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 bg-card p-2 rounded border">
                                <ClockIcon className="w-3 h-3 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[8px] uppercase font-black text-muted-foreground">Hora</p>
                                  <p className="font-bold">{fmtTime(mov.created_at)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                              <CubeIcon className="w-3 h-3" />
                              <span>Cód: {produto?.codigo || '—'}</span>
                              {mov.validade_lote && (
                                <span className="text-warning bg-warning/10 px-1.5 py-0.5 rounded font-bold">Val: {fmtDate(mov.validade_lote)}</span>
                              )}
                            </div>

                            {cleanObs && <p className="mt-1.5 text-[10px] italic text-muted-foreground">Obs: {cleanObs}</p>}
                          </div>

                          <span className={`text-xl font-black shrink-0 ${isOut ? 'text-destructive' : 'text-success'}`}>
                            {isOut ? '-' : '+'}{mov.quantidade}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        {filtered.length} movimentação(ões) • Histórico protegido — registros não podem ser removidos
      </div>
    </div>
  );
}
