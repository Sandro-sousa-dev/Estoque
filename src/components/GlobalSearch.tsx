import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Package, Users, Building2 } from 'lucide-react';

interface Props {
  produtos: any[];
  funcionarios: any[];
  empresas: any[];
  onNavigate: (tab: string) => void;
}

export default function GlobalSearch({ produtos, funcionarios, empresas, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return { produtos: [], funcionarios: [], empresas: [] };
    const t = query.toLowerCase();
    return {
      produtos: produtos.filter(p => p.nome?.toLowerCase().includes(t) || p.codigo?.toLowerCase().includes(t)).slice(0, 5),
      funcionarios: funcionarios.filter(f => f.nome?.toLowerCase().includes(t) || f.matricula?.toLowerCase().includes(t)).slice(0, 5),
      empresas: empresas.filter(e => e.nome?.toLowerCase().includes(t)).slice(0, 5),
    };
  }, [query, produtos, funcionarios, empresas]);

  const hasResults = results.produtos.length + results.funcionarios.length + results.empresas.length > 0;

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center bg-sidebar-accent rounded-lg">
        <Search className="w-4 h-4 text-sidebar-foreground/50 ml-3" />
        <input
          type="text"
          placeholder="Busca global..."
          className="bg-transparent text-sidebar-foreground placeholder:text-sidebar-foreground/40 text-sm p-2.5 pr-8 outline-none w-44 lg:w-64"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2 text-sidebar-foreground/40 hover:text-sidebar-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-card border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto min-w-72">
          {!hasResults ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Nenhum resultado para "{query}"</p>
          ) : (
            <>
              {results.produtos.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider bg-secondary/50">Materiais</p>
                  {results.produtos.map(p => (
                    <button key={p.id} onClick={() => { onNavigate('estoque'); setOpen(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 text-left transition-colors">
                      <Package className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p.nome}</p>
                        <p className="text-[10px] text-muted-foreground">Cód: {p.codigo} • Qtd: {p.quantidade_atual}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.funcionarios.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider bg-secondary/50">Membros</p>
                  {results.funcionarios.map(f => (
                    <button key={f.id} onClick={() => { onNavigate('funcionarios'); setOpen(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 text-left transition-colors">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{f.nome}</p>
                        <p className="text-[10px] text-muted-foreground">Mat: {f.matricula}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.empresas.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[10px] font-black uppercase text-muted-foreground tracking-wider bg-secondary/50">Empresas</p>
                  {results.empresas.map(e => (
                    <button key={e.id} onClick={() => { onNavigate('empresas'); setOpen(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 text-left transition-colors">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-sm font-semibold truncate">{e.nome}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
