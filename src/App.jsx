import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Users, ArrowRightLeft, Plus, AlertTriangle, 
  CheckCircle, Save, Trash2, Building2, Menu, X, Moon, Sun, Search, History, Loader2
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// AS SUAS CREDENCIAIS OFICIAIS DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyB_1qrbwtPDfcJCgYrEYSSX69lXYcgBTpw",
  authDomain: "sistema-alumar-31898.firebaseapp.com",
  projectId: "sistema-alumar-31898",
  storageBucket: "sistema-alumar-31898.firebasestorage.app",
  messagingSenderId: "493765085873",
  appId: "1:493765085873:web:f174f3ee36f629112bb090",
  measurementId: "G-E82SX7DQ56"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(true);

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const showAlert = (title, message) => setModal({ isOpen: true, title, message, type: 'alert', onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setModal({ isOpen: true, title, message, type: 'confirm', onConfirm });
  const closeModal = () => setModal({ ...modal, isOpen: false });

  const [produtos, setProdutos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);

  const [formProduto, setFormProduto] = useState({ codigo: '', nome: '', unidade: 'Unidade', estoqueMinimo: '', quantidadeInicial: '', validade: '' });
  const [formFuncionario, setFormFuncionario] = useState({ id: '', nome: '', funcao: '', empresaId: '' });
  const [formEmpresa, setFormEmpresa] = useState({ id: '', nome: '', cnpj: '', tipo: 'Fornecedor' });
  const [formMov, setFormMov] = useState({ produtoId: '', funcionarioId: '', empresaId: '', tipo: 'entrada', quantidade: '' });
  
  const [buscaFuncionario, setBuscaFuncionario] = useState('');
  const [buscaProdutoDash, setBuscaProdutoDash] = useState('');
  const [buscaFuncionarioDash, setBuscaFuncionarioDash] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Erro na autenticação:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsDbLoading(true);
    const colecoes = ['produtos', 'empresas', 'funcionarios', 'movimentacoes'];
    const unsubscribers = [];

    colecoes.forEach(nomeColecao => {
      const colRef = collection(db, `alumar_stock_${nomeColecao}`);
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const dados = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        if (nomeColecao === 'produtos') setProdutos(dados);
        if (nomeColecao === 'empresas') setEmpresas(dados);
        if (nomeColecao === 'funcionarios') setFuncionarios(dados);
        if (nomeColecao === 'movimentacoes') setMovimentacoes(dados);
      }, (error) => console.error(`Erro ao carregar ${nomeColecao}:`, error));
      unsubscribers.push(unsubscribe);
    });

    setIsDbLoading(false);
    return () => unsubscribers.forEach(unsub => unsub());
  }, [user]);

  const handleAddProduto = async (e) => {
    e.preventDefault();
    if (!user) return;
    const id = Date.now().toString();
    const novoProduto = { ...formProduto, estoqueAtual: parseInt(formProduto.quantidadeInicial) || 0, estoqueMinimo: parseInt(formProduto.estoqueMinimo) || 0 };
    await setDoc(doc(db, 'alumar_stock_produtos', id), novoProduto);
    setFormProduto({ codigo: '', nome: '', unidade: 'Unidade', estoqueMinimo: '', quantidadeInicial: '', validade: '' });
    showAlert('Sucesso', 'Produto guardado!');
  };

  const handleRemoveProduto = (id) => showConfirm('Atenção', 'Remover este produto?', async () => {
    if (user) await deleteDoc(doc(db, 'alumar_stock_produtos', id.toString()));
  });

  const handleAddFuncionario = async (e) => {
    e.preventDefault();
    if (!user) return;
    const id = Date.now().toString();
    await setDoc(doc(db, 'alumar_stock_funcionarios', id), { ...formFuncionario });
    setFormFuncionario({ id: '', nome: '', funcao: '', empresaId: '' });
    showAlert('Sucesso', 'Funcionário guardado!');
  };

  const handleRemoveFuncionario = (id) => showConfirm('Atenção', 'Remover este funcionário?', async () => {
    if (user) await deleteDoc(doc(db, 'alumar_stock_funcionarios', id.toString()));
  });

  const handleAddEmpresa = async (e) => {
    e.preventDefault();
    if (!user) return;
    const id = Date.now().toString();
    await setDoc(doc(db, 'alumar_stock_empresas', id), { ...formEmpresa });
    setFormEmpresa({ id: '', nome: '', cnpj: '', tipo: 'Fornecedor' });
    showAlert('Sucesso', 'Empresa guardada!');
  };

  const handleRemoveEmpresa = (id) => showConfirm('Atenção', 'Remover esta empresa?', async () => {
    if (user) await deleteDoc(doc(db, 'alumar_stock_empresas', id.toString()));
  });

  const handleMovimentacao = async (e) => {
    e.preventDefault();
    if (!user) return;
    const { produtoId, tipo, quantidade, funcionarioId, empresaId } = formMov;
    const qtd = parseInt(quantidade);

    if (!produtoId || !funcionarioId || isNaN(qtd) || qtd <= 0) return showAlert('Atenção', 'Preencha tudo corretamente.');
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    if (tipo === 'saida' && produto.estoqueAtual < qtd) return showAlert('Stock Insuficiente', `Saldo: ${produto.estoqueAtual}`);

    const novoEstoque = tipo === 'entrada' ? produto.estoqueAtual + qtd : produto.estoqueAtual - qtd;
    await setDoc(doc(db, 'alumar_stock_produtos', produtoId), { ...produto, estoqueAtual: novoEstoque });

    const func = funcionarios.find(f => f.id === funcionarioId);
    let empresaMov = empresas.find(e => e.id === empresaId)?.nome || (func?.empresaId ? empresas.find(e => e.id === func.empresaId)?.nome : 'Não informada');

    const movId = Date.now().toString();
    await setDoc(doc(db, 'alumar_stock_movimentacoes', movId), {
      produto: produto.nome, funcionario: func?.nome, empresa: empresaMov, tipo, quantidade: qtd, data: new Date().toLocaleString('pt-PT')
    });

    setFormMov({ ...formMov, quantidade: '', empresaId: '' });
    showAlert('Sucesso', `Movimentação partilhada!`);
  };

  const getStatusEstoque = (atual, minimo) => {
    if (atual > minimo) return { text: 'Stock OK', color: 'bg-green-100 text-green-800 border-green-200' };
    if (atual === minimo) return { text: 'Atenção', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { text: 'Comprar', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  const handleNavClick = (id) => { setActiveTab(id); setIsSidebarOpen(false); };
  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => handleNavClick(id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}>
      <Icon size={20} /><span className="font-medium">{label}</span>
    </button>
  );

  const movimentacoesOrdenadas = [...movimentacoes].sort((a, b) => parseInt(b.id) - parseInt(a.id));

  if (isDbLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-800">A ligar à Base de Dados Alumar...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
        
        {modal.isOpen && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{modal.title}</h3>
              <p className="text-gray-600 mb-6">{modal.message}</p>
              <div className="flex justify-end gap-3">
                {modal.type === 'confirm' && <button onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>}
                <button onClick={() => { if (modal.onConfirm) modal.onConfirm(); closeModal(); }} className={`px-4 py-2 text-white rounded-lg ${modal.type === 'confirm' ? 'bg-red-600' : 'bg-blue-600'}`}>
                  {modal.type === 'confirm' ? 'Sim, remover' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ0ybM9rlxwg8IVoNpugNiMMUmydUh1_IzeR6sx__oiA&s=10" alt="Logo" className="h-10 w-10 object-contain rounded-md shadow-sm bg-white p-1"/> Alumar
            </h1>
            <button className="md:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Visão Geral" />
            <NavItem id="movimentacao" icon={ArrowRightLeft} label="Entrada / Saída" />
            <NavItem id="produtos" icon={Plus} label="Cadastrar Itens" />
            <NavItem id="funcionarios" icon={Users} label="Funcionários" />
            <NavItem id="empresas" icon={Building2} label="Empresas" />
          </nav>
        </aside>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="md:hidden bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center z-10">
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-3">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ0ybM9rlxwg8IVoNpugNiMMUmydUh1_IzeR6sx__oiA&s=10" alt="Logo" className="h-10 w-10 object-contain rounded-md shadow-sm bg-white p-1"/> Alumar
            </h1>
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={28} /></button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <section>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Visão Geral do Stock</h2>
                    <div className="relative w-full sm:w-72">
                      <input type="text" placeholder="Pesquisar..." value={buscaProdutoDash} onChange={e => setBuscaProdutoDash(e.target.value)} className="w-full p-2.5 pl-10 border border-gray-200 rounded-lg outline-none" />
                      <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                    </div>
                  </div>
                  <p className="md:hidden text-xs text-gray-500 mb-2 flex items-center gap-1"><ArrowRightLeft size={12} /> Deslize a tabela para os lados para ver tudo</p>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                            <th className="p-4">Código</th><th className="p-4">Produto</th><th className="p-4 text-center">Em Stock</th><th className="p-4 text-center">Mínimo</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                          {produtos.filter(p => p.nome.toLowerCase().includes(buscaProdutoDash.toLowerCase()) || p.codigo.includes(buscaProdutoDash)).map(p => {
                            const status = getStatusEstoque(p.estoqueAtual, p.estoqueMinimo);
                            return (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm text-gray-500">{p.codigo}</td>
                                <td className="p-4 font-medium">{p.nome} <span className="text-xs text-gray-400">({p.unidade})</span></td>
                                <td className="p-4 text-center font-bold text-lg">{p.estoqueAtual}</td>
                                <td className="p-4 text-center text-gray-500">{p.estoqueMinimo}</td>
                                <td className="p-4 text-center"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>{status.text}</span></td>
                                <td className="p-4 text-center"><button onClick={() => handleRemoveProduto(p.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18} /></button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section className="pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><History className="text-blue-600" /> Consulta por Funcionário</h2>
                    <div className="relative w-full sm:w-72">
                      <input type="text" placeholder="Nome do funcionário..." value={buscaFuncionarioDash} onChange={e => setBuscaFuncionarioDash(e.target.value)} className="w-full p-2.5 pl-10 border border-gray-200 rounded-lg outline-none" />
                      <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                     <ul className="divide-y divide-gray-100">
                       {movimentacoesOrdenadas.filter(m => m.funcionario && m.funcionario.toLowerCase().includes(buscaFuncionarioDash.toLowerCase())).map(m => (
                         <li key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4">
                           <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-full ${m.tipo === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{m.tipo === 'entrada' ? <Plus size={24} /> : <Trash2 size={24} />}</div>
                             <div>
                               <p className="font-bold text-gray-800 text-lg">{m.produto}</p>
                               <p className="text-sm text-gray-600">👤 {m.funcionario} {m.empresa !== 'Não informada' && ` | 🏢 ${m.empresa}`}</p>
                               <p className="text-xs text-gray-400 mt-1">{m.data}</p>
                             </div>
                           </div>
                           <div className="sm:text-right bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                             <span className={`font-black text-2xl ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}</span>
                           </div>
                         </li>
                       ))}
                     </ul>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'movimentacao' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-gray-800">Adicionar ou Remover Itens</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <form onSubmit={handleMovimentacao} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimentação</label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="tipo" className="peer sr-only" checked={formMov.tipo === 'entrada'} onChange={() => setFormMov({...formMov, tipo: 'entrada'})} />
                          <div className="p-4 text-center rounded-lg border-2 border-transparent bg-gray-50 text-gray-600 peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 font-bold transition-all shadow-sm">🟢 Entrada (Recebimento)</div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="tipo" className="peer sr-only" checked={formMov.tipo === 'saida'} onChange={() => setFormMov({...formMov, tipo: 'saida'})} />
                          <div className="p-4 text-center rounded-lg border-2 border-transparent bg-gray-50 text-gray-600 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 font-bold transition-all shadow-sm">🔴 Saída (Envio/Uso)</div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Produto *</label>
                      <select required value={formMov.produtoId} onChange={e => setFormMov({...formMov, produtoId: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                        <option value="">Selecione...</option>
                        {produtos.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.nome} (Saldo: {p.estoqueAtual})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                      <input type="number" min="1" required value={formMov.quantidade} onChange={e => setFormMov({...formMov, quantidade: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none" placeholder="Ex: 10" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário *</label>
                      <select required value={formMov.funcionarioId} onChange={e => setFormMov({...formMov, funcionarioId: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                        <option value="">Selecione...</option>
                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome} ({f.funcao})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Destino/Origem</label>
                      <select value={formMov.empresaId} onChange={e => setFormMov({...formMov, empresaId: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg outline-none">
                        <option value="">Nenhuma / Automático</option>
                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-2">
                      <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Save size={20} /> Processar Movimentação</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'produtos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-800">Catálogo de Produtos</h2></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <form onSubmit={handleAddProduto} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                      <input required type="text" value={formProduto.codigo} onChange={e => setFormProduto({...formProduto, codigo: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input required type="text" value={formProduto.nome} onChange={e => setFormProduto({...formProduto, nome: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                      <select value={formProduto.unidade} onChange={e => setFormProduto({...formProduto, unidade: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg">
                        <option value="Unidade">Unidade (un)</option><option value="Saco">Saco</option><option value="Lata">Lata</option><option value="m³">m³</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo *</label>
                      <input required type="number" min="0" value={formProduto.estoqueMinimo} onChange={e => setFormProduto({...formProduto, estoqueMinimo: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-bold"><Plus size={20} className="inline mr-2" /> Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'funcionarios' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-gray-800">Equipa e Funcionários</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <form onSubmit={handleAddFuncionario} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">ID *</label><input required type="text" value={formFuncionario.id} onChange={e => setFormFuncionario({...formFuncionario, id: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input required type="text" value={formFuncionario.nome} onChange={e => setFormFuncionario({...formFuncionario, nome: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Função *</label><input required type="text" value={formFuncionario.funcao} onChange={e => setFormFuncionario({...formFuncionario, funcao: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" /></div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Vinculada</label>
                      <select value={formFuncionario.empresaId} onChange={e => setFormFuncionario({...formFuncionario, empresaId: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg">
                        <option value="">Nenhuma</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex justify-end"><button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-bold"><Users size={20} className="inline mr-2" /> Adicionar</button></div>
                  </form>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {funcionarios.map(f => (
                    <div key={f.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4"><div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">{f.nome.charAt(0)}</div><div><p className="font-bold text-gray-800">{f.nome}</p><p className="text-sm text-gray-500">{f.funcao}</p></div></div>
                      <button onClick={() => handleRemoveFuncionario(f.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'empresas' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-gray-800">Empresas</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <form onSubmit={handleAddEmpresa} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label><input required type="text" value={formEmpresa.cnpj} onChange={e => setFormEmpresa({...formEmpresa, cnpj: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input required type="text" value={formEmpresa.nome} onChange={e => setFormEmpresa({...formEmpresa, nome: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg" /></div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select required value={formEmpresa.tipo} onChange={e => setFormEmpresa({...formEmpresa, tipo: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg">
                        <option value="Fornecedor">Fornecedor</option><option value="Cliente">Cliente / Obra</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex justify-end"><button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-bold"><Building2 size={20} className="inline mr-2" /> Cadastrar</button></div>
                  </form>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {empresas.map(emp => (
                    <div key={emp.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4"><div className="h-12 w-12 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center"><Building2 size={24} /></div><div><p className="font-bold text-gray-800">{emp.nome}</p><p className="text-sm text-gray-500">{emp.tipo}</p></div></div>
                      <button onClick={() => handleRemoveEmpresa(emp.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

