import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Trash2, Mail, Bell, Save } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  ativo: boolean;
  created_at?: string;
}

interface AlertConfig {
  id: string;
  email_alerta: string;
  alerta_estoque_baixo: boolean;
  alerta_pre_vencimento: boolean;
  dias_pre_vencimento: number;
}

export default function TabAdmin({ usuarios, alertConfig, onRefresh }: { usuarios: Profile[]; alertConfig: AlertConfig | null; onRefresh: () => void }) {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [addMail, setAddMail] = useState('');
  const [addPass, setAddPass] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Alert config state
  const [alertEmail, setAlertEmail] = useState(alertConfig?.email_alerta || '');
  const [alertEstoque, setAlertEstoque] = useState(alertConfig?.alerta_estoque_baixo ?? true);
  const [alertVencimento, setAlertVencimento] = useState(alertConfig?.alerta_pre_vencimento ?? true);
  const [alertDias, setAlertDias] = useState(String(alertConfig?.dias_pre_vencimento ?? 30));

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMail || addPass.length < 6) return toast.error('E-mail válido e senha mín 6 chars');
    const { error } = await supabase.auth.signUp({ email: addMail, password: addPass });
    if (error) return toast.error('Erro: E-mail já existe ou inválido.');
    toast.success('Utilizador cadastrado!');
    setAddMail(''); setAddPass(''); setShowAdd(false);
    onRefresh();
  };

  const toggleUser = async (u: Profile) => {
    if (u.id === user?.id) return;
    await supabase.from('profiles').update({ ativo: !u.ativo }).eq('id', u.id);
    toast.success('Acesso alterado');
    onRefresh();
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: deleteUserId },
      });
      if (error) throw error;
      toast.success('Utilizador removido permanentemente!');
    } catch {
      // Fallback: just delete profile
      await supabase.from('profiles').delete().eq('id', deleteUserId);
      toast.success('Perfil removido!');
    }
    setDeleteUserId(null);
    onRefresh();
  };

  const saveAlertConfig = async () => {
    if (!alertEmail) return toast.error('Informe o e-mail para alertas');
    const payload = {
      email_alerta: alertEmail,
      alerta_estoque_baixo: alertEstoque,
      alerta_pre_vencimento: alertVencimento,
      dias_pre_vencimento: parseInt(alertDias) || 30,
    };
    if (alertConfig?.id) {
      await supabase.from('alert_config').update(payload).eq('id', alertConfig.id);
    } else {
      await supabase.from('alert_config').insert(payload);
    }
    toast.success('Configuração de alertas salva!');
    onRefresh();
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-black">Administração</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95">
          + Adicionar Membro
        </button>
      </header>

      {showAdd && (
        <div className="bg-card p-5 rounded-lg border animate-fade-in">
          <h3 className="font-bold text-sm mb-4">Novo Utilizador</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <input type="email" placeholder="E-mail" className="p-3 rounded-lg bg-secondary text-foreground outline-none text-sm" value={addMail} onChange={e => setAddMail(e.target.value)} />
            <input type="password" placeholder="Senha provisória" className="p-3 rounded-lg bg-secondary text-foreground outline-none text-sm" value={addPass} onChange={e => setAddPass(e.target.value)} />
            <button type="submit" className="bg-foreground text-background font-bold py-3 rounded-lg text-sm">Criar Conta</button>
          </form>
        </div>
      )}

      {/* Alert Config */}
      <div className="bg-card p-5 rounded-lg border">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-warning" /> Configuração de Alertas por E-mail
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="email"
              placeholder="E-mail para receber alertas"
              className="flex-1 bg-secondary p-3 rounded-lg outline-none text-foreground text-sm"
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 bg-secondary p-3 rounded-lg cursor-pointer">
              <input type="checkbox" checked={alertEstoque} onChange={e => setAlertEstoque(e.target.checked)} className="accent-primary" />
              <span className="text-sm font-semibold">Estoque Baixo</span>
            </label>
            <label className="flex items-center gap-2 bg-secondary p-3 rounded-lg cursor-pointer">
              <input type="checkbox" checked={alertVencimento} onChange={e => setAlertVencimento(e.target.checked)} className="accent-primary" />
              <span className="text-sm font-semibold">Pré-Vencimento</span>
            </label>
            <div className="flex items-center gap-2 bg-secondary p-3 rounded-lg">
              <span className="text-xs text-muted-foreground">Dias antecedência:</span>
              <input type="number" className="w-16 bg-card p-1.5 rounded text-sm font-bold text-center outline-none" value={alertDias} onChange={e => setAlertDias(e.target.value)} />
            </div>
          </div>
          <button onClick={saveAlertConfig} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> Salvar Configuração
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="bg-card p-5 rounded-lg border">
        <h3 className="font-bold text-sm mb-4">Membros Cadastrados</h3>
        <div className="space-y-2">
          {usuarios.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Nenhum utilizador cadastrado</p>
          ) : (
            usuarios.map(u => (
              <div key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 rounded-lg border bg-secondary/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">
                    {u.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{u.email}</p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`font-black uppercase ${u.ativo ? 'text-success' : 'text-destructive'}`}>
                        {u.ativo ? '● Ativo' : '○ Bloqueado'}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {u.role === 'admin' ? '👑 Admin' : '👤 Utilizador'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {u.id !== user?.id && (
                    <>
                      <button
                        onClick={() => toggleUser(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.ativo ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'
                        }`}
                      >
                        {u.ativo ? 'Bloquear' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => setDeleteUserId(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteUserId && (
        <ConfirmModal
          message="Remover permanentemente este utilizador? Esta ação não pode ser desfeita."
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteUserId(null)}
        />
      )}
    </div>
  );
}
