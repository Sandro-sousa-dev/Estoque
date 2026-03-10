import { useState, useMemo } from 'react';
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  ScaleIcon,
  ExclamationCircleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@/components/StatCard';
import { exportEstoqueCSV } from '@/lib/csv-export';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  unidade: string;
  estoque_minimo: number;
  quantidade_atual: number;
}

export default function TabEstoque({ produtos }: { produtos: Produto[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [sortBy, setSortBy] = useState('nome');

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const filtered = produtos.filter(produto => {
      const matchesSearch = !term ||
        produto.nome?.toLowerCase().includes(term) ||
        produto.codigo?.toLowerCase().includes(term);

      const matchesStock = !filterLowStock || produto.quantidade_atual <= produto.estoque_minimo;
      return matchesSearch && matchesStock;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'nome') return a.nome.localeCompare(b.nome);
      if (sortBy === 'codigo') return a.codigo.localeCompare(b.codigo);
      if (sortBy === 'quantidade') return b.quantidade_atual - a.quantidade_atual;
      return 0;
    });
  }, [produtos, searchTerm, filterLowStock, sortBy]);

  const stats = useMemo(() => ({
    totalItems: produtos.length,
    totalQuantity: produtos.reduce((acc, produto) => acc + (produto.quantidade_atual || 0), 0),
    lowStockItems: produtos.filter(produto => produto.quantidade_atual <= produto.estoque_minimo).length,
    outOfStock: produtos.filter(produto => produto.quantidade_atual === 0).length,
  }), [produtos]);

  const handlePrint = () => window.print();

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 no-print">
        <div>
          <h2 className="text-3xl font-black">Estoque</h2>
          <p className="text-muted-foreground text-sm">Visão completa de todos os materiais</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={handlePrint} className="bg-secondary text-foreground px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm border hover:bg-secondary/80 transition-colors">
            <PrinterIcon className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={() => exportEstoqueCSV(filteredProducts)} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition-all active:scale-95">
            <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 no-print">
        <StatCard title="Total de Itens" value={stats.totalItems} subtitle="Tipos diferentes" icon={<ArchiveBoxIcon className="w-4 h-4 text-primary" />} iconBg="bg-accent" />
        <StatCard title="Quantidade Total" value={stats.totalQuantity} subtitle="Unidades em estoque" icon={<ScaleIcon className="w-4 h-4 text-success" />} iconBg="bg-success/10" />
        <StatCard title="Estoque Baixo" value={stats.lowStockItems} subtitle="Abaixo do mínimo" icon={<ExclamationTriangleIcon className="w-4 h-4 text-warning" />} iconBg="bg-warning/10" />
        <StatCard title="Em Falta" value={stats.outOfStock} subtitle="Sem unidades" icon={<ExclamationCircleIcon className="w-4 h-4 text-destructive" />} iconBg="bg-destructive/10" />
      </div>

      <div className="bg-card p-4 rounded-lg border mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Buscar por nome, código..."
              className="w-full bg-secondary p-3 pl-10 rounded-lg outline-none text-foreground text-sm"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`p-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 text-sm ${filterLowStock ? 'bg-warning text-warning-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            <ExclamationTriangleIcon className="w-4 h-4" /> Estoque Baixo
          </button>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="bg-secondary p-3 rounded-lg outline-none text-foreground font-semibold text-sm"
          >
            <option value="nome">Ordenar por Nome</option>
            <option value="codigo">Ordenar por Código</option>
            <option value="quantidade">Ordenar por Quantidade</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden print-area">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/70 border-b">
              <tr>
                {['Status', 'Código', 'Material', 'Unidade', 'Mínimo', 'Atual', '%', 'Estado'].map(header => (
                  <th key={header} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">{header}</th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    <ArchiveBoxIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum material encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(produto => {
                  const percent = Math.min((produto.quantidade_atual / (produto.estoque_minimo * 2 || 10)) * 100, 100);
                  const isLow = produto.quantidade_atual <= produto.estoque_minimo;
                  const isOut = produto.quantidade_atual === 0;

                  return (
                    <tr key={produto.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isOut ? 'bg-destructive' : isLow ? 'bg-warning' : 'bg-success'}`} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{produto.codigo}</td>
                      <td className="px-4 py-3 font-semibold text-sm">{produto.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">{produto.unidade}</td>
                      <td className="px-4 py-3 text-sm">{produto.estoque_minimo}</td>
                      <td className="px-4 py-3">
                        <span className={`text-base font-black ${isOut ? 'text-destructive' : isLow ? 'text-warning' : 'text-success'}`}>
                          {produto.quantidade_atual}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-16 bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${isOut ? 'bg-destructive' : isLow ? 'bg-warning' : 'bg-success'}`} style={{ width: `${percent}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                          isOut ? 'bg-destructive/10 text-destructive' : isLow ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        }`}>
                          {isOut ? 'Falta' : isLow ? 'Crítico' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-secondary/50 border-t text-xs text-muted-foreground no-print">
          Mostrando {filteredProducts.length} de {produtos.length} materiais
        </div>
      </div>
    </div>
  );
}
