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

const ITEM_TAG_REGEX = /\[ITEM:(.+?)\]/;

const escapeCsv = (value: string | number | null | undefined) => {
  const sanitized = String(value ?? '').replace(/"/g, '""');
  return `"${sanitized}"`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const extractTaggedItemName = (observacao: string | null) => {
  const match = observacao?.match(ITEM_TAG_REGEX);
  return match?.[1]?.trim() || null;
};

const cleanObservacao = (observacao: string | null) => {
  if (!observacao) return '';
  return observacao.replace(ITEM_TAG_REGEX, '').trim();
};

const getStockState = (produto?: Produto) => {
  if (!produto) return 'Sem referência';
  if (produto.quantidade_atual === 0) return 'Falta';
  if (produto.quantidade_atual <= produto.estoque_minimo) return 'Crítico';
  return 'Normal';
};

const buildCsv = (headers: string[], rows: (string | number)[][]) => {
  const BOM = '\uFEFF';
  return BOM + [headers, ...rows].map(row => row.map(escapeCsv).join(';')).join('\n');
};

const downloadCsv = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function exportEstoqueCSV(produtos: Produto[]) {
  const headers = ['Código', 'Material', 'Unidade', 'Estoque Mínimo', 'Quantidade Atual', 'Estado'];
  const rows = produtos.map(produto => [
    produto.codigo,
    produto.nome,
    produto.unidade,
    produto.estoque_minimo,
    produto.quantidade_atual,
    getStockState(produto),
  ]);

  const csv = buildCsv(headers, rows);
  downloadCsv(csv, `estoque_${new Date().toISOString().slice(0, 10)}.csv`);
}

interface HistoricoCSVParams {
  movimentacoes: Movimentacao[];
  produtos: Produto[];
  funcionarios: Funcionario[];
  empresas: Empresa[];
}

const generateHistoricoCSV = ({ movimentacoes, produtos, funcionarios, empresas }: HistoricoCSVParams) => {
  const produtoMap = new Map(produtos.map(produto => [produto.id, produto]));
  const funcionarioMap = new Map(funcionarios.map(funcionario => [funcionario.id, funcionario]));
  const empresaMap = new Map(empresas.map(empresa => [empresa.id, empresa]));

  const headers = [
    'Número da Movimentação',
    'ID Completo',
    'Tipo',
    'Nome do Item',
    'Código do Item',
    'Quantidade da Movimentação',
    'Unidade',
    'Responsável',
    'Matrícula do Responsável',
    'Empresa',
    'Data',
    'Hora',
    'Validade do Lote',
    'Quantidade Atual em Estoque',
    'Estoque Mínimo',
    'Estado do Estoque',
    'Observações',
  ];

  const rows = movimentacoes.map(movimentacao => {
    const produto = produtoMap.get(movimentacao.produto_id);
    const funcionario = funcionarioMap.get(movimentacao.funcionario_id);
    const empresa = movimentacao.empresa_id ? empresaMap.get(movimentacao.empresa_id) : null;

    const nomeItem = produto?.nome || extractTaggedItemName(movimentacao.observacoes) || 'Item removido';

    return [
      movimentacao.id.slice(0, 8).toUpperCase(),
      movimentacao.id,
      movimentacao.tipo === 'entrada' ? 'Carga' : 'Retirada',
      nomeItem,
      produto?.codigo || '—',
      movimentacao.quantidade,
      produto?.unidade || '—',
      funcionario?.nome || 'N/A',
      funcionario?.matricula || '—',
      empresa?.nome || '—',
      formatDate(movimentacao.created_at),
      formatTime(movimentacao.created_at),
      movimentacao.validade_lote ? formatDate(movimentacao.validade_lote) : '—',
      produto?.quantidade_atual ?? '—',
      produto?.estoque_minimo ?? '—',
      getStockState(produto),
      cleanObservacao(movimentacao.observacoes) || '—',
    ];
  });

  return buildCsv(headers, rows);
};

export function exportHistoricoCSV(params: HistoricoCSVParams) {
  const csv = generateHistoricoCSV(params);
  downloadCsv(csv, `historico_movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`);
}

interface SendHistoricoCsvEmailParams extends HistoricoCSVParams {
  toEmail: string;
}

export function sendHistoricoCsvByEmail({ toEmail, ...params }: SendHistoricoCsvEmailParams) {
  const csv = generateHistoricoCSV(params);
  downloadCsv(csv, `historico_movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`);

  const produtosCriticos = params.produtos.filter(
    produto => produto.quantidade_atual === 0 || produto.quantidade_atual <= produto.estoque_minimo,
  ).length;

  const lotesComValidade = params.movimentacoes.filter(movimentacao => movimentacao.validade_lote).length;

  const subject = encodeURIComponent('Relatório CSV detalhado de estoque e movimentações');
  const body = encodeURIComponent(
    [
      'Segue relatório detalhado de estoque e histórico.',
      '',
      `Total de movimentações: ${params.movimentacoes.length}`,
      `Itens em estado crítico/falta: ${produtosCriticos}`,
      `Registos com validade de lote: ${lotesComValidade}`,
      '',
      'O arquivo CSV foi baixado automaticamente para anexar neste e-mail.',
    ].join('\n'),
  );

  window.location.href = `mailto:${encodeURIComponent(toEmail)}?subject=${subject}&body=${body}`;
}
