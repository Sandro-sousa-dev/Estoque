import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Auth = lazy(() => import('@/pages/Auth'));
const PendingApproval = lazy(() => import('@/pages/PendingApproval'));
const AppLayout = lazy(() => import('@/components/AppLayout'));
const TabDashboard = lazy(() => import('@/components/tabs/TabDashboard'));
const TabEstoque = lazy(() => import('@/components/tabs/TabEstoque'));
const TabProdutos = lazy(() => import('@/components/tabs/TabProdutos'));
const TabMovimentacoes = lazy(() => import('@/components/tabs/TabMovimentacoes'));
const TabHistorico = lazy(() => import('@/components/tabs/TabHistorico'));
const TabFuncionarios = lazy(() => import('@/components/tabs/TabFuncionarios'));
const TabEmpresas = lazy(() => import('@/components/tabs/TabEmpresas'));
const TabAdmin = lazy(() => import('@/components/tabs/TabAdmin'));

export default function Index() {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataLoading, setDataLoading] = useState(true);

  const [produtos, setProdutos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setDataLoading(true);

    try {
      const results = await Promise.allSettled([
        supabase.from('produtos').select('*').order('nome'),
        supabase.from('funcionarios').select('*').order('nome'),
        supabase.from('empresas').select('*').order('nome'),
        supabase.from('movimentacoes').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at'),
        supabase.from('unidades').select('*').order('nome'),
        supabase.from('alert_config').select('*').limit(1),
      ]);

      const [pRes, fRes, eRes, mRes, uRes, unRes, acRes] = results;

      setProdutos(pRes.status === 'fulfilled' ? pRes.value.data || [] : []);
      setFuncionarios(fRes.status === 'fulfilled' ? fRes.value.data || [] : []);
      setEmpresas(eRes.status === 'fulfilled' ? eRes.value.data || [] : []);
      setMovimentacoes(mRes.status === 'fulfilled' ? mRes.value.data || [] : []);
      setUsuarios(uRes.status === 'fulfilled' ? uRes.value.data || [] : []);
      setUnidades(unRes.status === 'fulfilled' ? unRes.value.data || [] : []);
      setAlertConfig(acRes.status === 'fulfilled' ? acRes.value.data?.[0] || null : null);

      results.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Erro ao carregar dados:', result.reason);
        }
      });
    } finally {
      if (showLoader) setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.ativo) {
      fetchData();
      return;
    }

    setDataLoading(false);
  }, [profile, fetchData]);

  useEffect(() => {
    if (!profile?.ativo) return;

    const channels = [
      supabase.channel('produtos-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => fetchData(false)).subscribe(),
      supabase.channel('movimentacoes-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'movimentacoes' }, () => fetchData(false)).subscribe(),
      supabase.channel('funcionarios-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'funcionarios' }, () => fetchData(false)).subscribe(),
      supabase.channel('empresas-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, () => fetchData(false)).subscribe(),
      supabase.channel('profiles-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData(false)).subscribe(),
      supabase.channel('unidades-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'unidades' }, () => fetchData(false)).subscribe(),
      supabase.channel('alert-config-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'alert_config' }, () => fetchData(false)).subscribe(),
    ];

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [profile, fetchData]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const fallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!user) return <Suspense fallback={fallback}><Auth /></Suspense>;
  if (!profile?.ativo) return <Suspense fallback={fallback}><PendingApproval /></Suspense>;

  return (
    <Suspense fallback={fallback}>
      <AppLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchData={{ produtos, funcionarios, empresas }}
      >
        {dataLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            {activeTab === 'dashboard' && <TabDashboard produtos={produtos} movimentacoes={movimentacoes} alertConfig={alertConfig} />}
            {activeTab === 'estoque' && <TabEstoque produtos={produtos} />}
            {activeTab === 'produtos' && <TabProdutos produtos={produtos} unidades={unidades} onRefresh={fetchData} />}
            {activeTab === 'movimentacoes' && <TabMovimentacoes produtos={produtos} funcionarios={funcionarios} empresas={empresas} onRefresh={fetchData} />}
            {activeTab === 'historico' && <TabHistorico movimentacoes={movimentacoes} produtos={produtos} funcionarios={funcionarios} empresas={empresas} alertEmail={alertConfig?.email_alerta || 'sousasandro419@gmail.com'} />}
            {activeTab === 'funcionarios' && <TabFuncionarios funcionarios={funcionarios} onRefresh={fetchData} />}
            {activeTab === 'empresas' && <TabEmpresas empresas={empresas} onRefresh={fetchData} />}
            {activeTab === 'admin' && <TabAdmin usuarios={usuarios} alertConfig={alertConfig} onRefresh={fetchData} />}
          </Suspense>
        )}
      </AppLayout>
    </Suspense>
  );
}
