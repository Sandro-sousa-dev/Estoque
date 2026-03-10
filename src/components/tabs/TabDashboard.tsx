import { useMemo } from 'react';
import {
  Package, AlertTriangle, TrendingUp, TrendingDown,
  Boxes, CircleAlert, Clock, Bell, ArrowUp, ArrowDown, CalendarClock
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  estoque_minimo: number;
  quantidade_atual: number;
}

interface Movimentacao {
  id: string;
  tipo: string;
  produto_id: string;
  quantidade: number;
  created_at: string;
  validade_lote: string | null;
}

interface Props {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  alertConfig: any;
}

const COLORS = ['hsl(213, 100%, 47%)', 'hsl(140, 48%, 31%)', 'hsl(26, 100%, 45%)', 'hsl(0, 92%, 35%)', 'hsl(280, 65%, 50%)'];

export default function TabDashboard({ produtos, movimentacoes, alertConfig }: Props) {
  const stats = useMemo(() => {
    const totalItems = produtos.length;
    const totalQty = produtos.reduce((a, p) => a + p.quantidade_atual, 0);
    const lowStock = produtos.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0);
    const outOfStock = produtos.filter(p => p.quantidade_atual === 0);
    const entradas = movimentacoes.filter(m => m.tipo === 'entrada');
    const saidas = movimentacoes.filter(m => m.tipo === 'saida');
    return { totalItems, totalQty, lowStock, outOfStock, entradas, saidas };
  }, [produtos, movimentacoes]);

  const chartData = useMemo(() => {
    const days: Record<string, { date: string; entradas: number; saidas: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }), entradas: 0, saidas: 0 };
    }
    movimentacoes.forEach(m => {
      const key = new Date(m.created_at).toISOString().split('T')[0];
      if (days[key]) {
        if (m.tipo === 'entrada') days[key].entradas += m.quantidade;
        else days[key].saidas += m.quantidade;
      }
    });
    return Object.values(days);
  }, [movimentacoes]);

  const topProdutos = useMemo(() => {
    return [...produtos]
      .sort((a, b) => b.quantidade_atual - a.quantidade_atual)
      .slice(0, 5)
      .map(p => ({ name: p.nome.length > 12 ? p.nome.slice(0, 12) + '…' : p.nome, value: p.quantidade_atual }));
  }, [produtos]);

  // Pre-expiration alerts
  const preExpirationAlerts = useMemo(() => {
    const diasConfig = alertConfig?.dias_pre_vencimento || 30;
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + diasConfig);

    const alerts: { produto: Produto | undefined; validade: string; diasRestantes: number; movId: string }[] = [];
    const seen = new Set<string>();

    movimentacoes.forEach(m => {
      if (!m.validade_lote) return;
      const val = new Date(m.validade_lote);
      const key = `${m.produto_id}-${m.validade_lote}`;
      if (seen.has(key)) return;
      seen.add(key);

      if (val <= limit) {
        const diasRestantes = Math.ceil((val.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const prod = produtos.find(p => p.id === m.produto_id);
        alerts.push({ produto: prod, validade: m.validade_lote, diasRestantes, movId: m.id });
      }
    });

    return alerts.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [movimentacoes, produtos, alertConfig]);

  const recentMovs = useMemo(() => movimentacoes.slice(0, 5), [movimentacoes]);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">Visão geral do inventário em tempo real</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(stats.lowStock.length > 0 || stats.outOfStock.length > 0) && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg animate-pulse">
              <Bell className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{stats.lowStock.length + stats.outOfStock.length} alerta(s)</span>
            </div>
          )}
          {preExpirationAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-lg animate-pulse">
              <CalendarClock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{preExpirationAlerts.length} pré-vencimento</span>
            </div>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total de Materiais" value={stats.totalItems} subtitle="Tipos cadastrados" icon={<Boxes className="w-4 h-4 text-primary" />} iconBg="bg-accent" />
        <StatCard title="Unidades em Estoque" value={stats.totalQty.toLocaleString('pt-BR')} subtitle="Quantidade total" icon={<Package className="w-4 h-4 text-success" />} iconBg="bg-success/10" />
        <StatCard title="Estoque Baixo" value={stats.lowStock.length} subtitle="Abaixo do mínimo" icon={<AlertTriangle className="w-4 h-4 text-warning" />} iconBg="bg-warning/10" />
        <StatCard title="Em Falta" value={stats.outOfStock.length} subtitle="Sem nenhuma unidade" icon={<CircleAlert className="w-4 h-4 text-destructive" />} iconBg="bg-destructive/10" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card p-5 rounded-lg border">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Movimentações — Últimos 7 dias
          </h3>
          {chartData.some(d => d.entradas > 0 || d.saidas > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(140, 48%, 31%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 92%, 35%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem movimentações recentes</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card p-5 rounded-lg border">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Top 5 Materiais
          </h3>
          {topProdutos.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={topProdutos} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                  {topProdutos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '10px' }} formatter={(value) => <span className="text-foreground text-xs">{value}</span>} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Nenhum material cadastrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock Alerts */}
        <div className="bg-card p-5 rounded-lg border">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> Alertas de Estoque
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {stats.outOfStock.length === 0 && stats.lowStock.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1 opacity-20" />
                <p className="text-xs">Estoque adequado</p>
              </div>
            ) : (
              <>
                {stats.outOfStock.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2.5 bg-destructive/5 border border-destructive/10 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{p.nome}</p>
                      <p className="text-[10px] text-muted-foreground">Cód: {p.codigo}</p>
                    </div>
                    <span className="text-[10px] font-black text-destructive">FALTA</span>
                  </div>
                ))}
                {stats.lowStock.map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2.5 bg-warning/5 border border-warning/10 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-warning shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{p.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{p.quantidade_atual}/{p.estoque_minimo}</p>
                    </div>
                    <span className="text-[10px] font-black text-warning">BAIXO</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Pre-expiration Alerts */}
        <div className="bg-card p-5 rounded-lg border">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-warning" /> Pré-Vencimento
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {preExpirationAlerts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarClock className="w-6 h-6 mx-auto mb-1 opacity-20" />
                <p className="text-xs">Sem lotes próximos do vencimento</p>
              </div>
            ) : (
              preExpirationAlerts.map(a => (
                <div key={a.movId} className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                  a.diasRestantes <= 0 ? 'bg-destructive/5 border-destructive/10' : a.diasRestantes <= 7 ? 'bg-warning/5 border-warning/10' : 'bg-accent border-primary/10'
                }`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${a.diasRestantes <= 0 ? 'bg-destructive' : a.diasRestantes <= 7 ? 'bg-warning' : 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{a.produto?.nome || 'Desconhecido'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Validade: {new Date(a.validade).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black ${a.diasRestantes <= 0 ? 'text-destructive' : a.diasRestantes <= 7 ? 'text-warning' : 'text-primary'}`}>
                    {a.diasRestantes <= 0 ? 'VENCIDO' : `${a.diasRestantes}d`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-card p-5 rounded-lg border">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Últimas Movimentações
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {recentMovs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="w-6 h-6 mx-auto mb-1 opacity-20" />
                <p className="text-xs">Nenhuma movimentação</p>
              </div>
            ) : (
              recentMovs.map(m => {
                const prod = produtos.find(p => p.id === m.produto_id);
                const isOut = m.tipo === 'saida';
                return (
                  <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isOut ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                      {isOut ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{prod?.nome || 'Removido'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`font-black text-xs ${isOut ? 'text-destructive' : 'text-success'}`}>
                      {isOut ? '-' : '+'}{m.quantidade}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {produtos.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3">Visão por Material</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {produtos.map((p) => {
              const critico = p.quantidade_atual <= p.estoque_minimo;
              const isOut = p.quantidade_atual === 0;
              const percent = Math.min((p.quantidade_atual / (p.estoque_minimo * 2 || 10)) * 100, 100);
              return (
                <div key={p.id} className="bg-card p-4 rounded-lg border transition-all hover:shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{p.codigo}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isOut ? 'bg-destructive/10 text-destructive' : critico ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                    }`}>
                      {isOut ? 'Falta' : critico ? 'Baixo' : 'OK'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1 truncate">{p.nome}</h4>
                  <div className="flex justify-between items-end mb-2">
                    <span className={`text-xl font-black ${isOut ? 'text-destructive' : critico ? 'text-warning' : 'text-foreground'}`}>{p.quantidade_atual}</span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{p.unidade}</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 rounded-full ${isOut ? 'bg-destructive' : critico ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alert Email Config Info */}
      {alertConfig?.email_alerta && (
        <div className="bg-accent/50 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
          <Bell className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-foreground">
            Alertas de estoque configurados para: <strong>{alertConfig.email_alerta}</strong>
            {alertConfig.alerta_pre_vencimento && <> • Pré-vencimento: {alertConfig.dias_pre_vencimento} dias</>}
          </p>
        </div>
      )}
    </div>
  );
}
