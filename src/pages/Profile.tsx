import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useProfile, useUpdateProfile, isUsernameAvailable } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Check, Copy, KeyRound, LogOut, ShieldCheck, ShieldAlert, User as UserIcon, AtSign, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Password section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setUsername(profile.username ?? '');
    }
  }, [profile]);

  // Live username validation (debounced)
  useEffect(() => {
    if (!profile) return;
    const trimmed = username.trim().toLowerCase();
    if (trimmed === profile.username) {
      setUsernameError(null);
      return;
    }
    if (!USERNAME_RE.test(trimmed)) {
      setUsernameError('3-30 caracteres: letras minúsculas, números e _');
      return;
    }
    setUsernameError(null);
    setCheckingUsername(true);
    const t = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(trimmed);
        if (!available) setUsernameError('Esse username já está em uso');
      } catch {
        setUsernameError('Não foi possível validar o username');
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
    return () => { clearTimeout(t); setCheckingUsername(false); };
  }, [username, profile]);

  const dirty = !!profile && (
    (displayName.trim() !== (profile.display_name ?? '')) ||
    (username.trim().toLowerCase() !== profile.username)
  );

  const usernameChanged = !!profile && username.trim().toLowerCase() !== profile.username;

  const handleSaveProfile = async () => {
    if (!profile) return;
    if (!displayName.trim()) {
      toast.error('Nome não pode ficar vazio');
      return;
    }
    if (usernameError) {
      toast.error(usernameError);
      return;
    }
    if (usernameChanged) {
      // Confirm sensitive change
      setConfirmOpen(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        username,
      });
      toast.success('Perfil atualizado!');
    } catch (err: any) {
      const msg = err?.message?.includes('duplicate') ? 'Esse username já está em uso' : (err?.message || 'Erro ao salvar');
      toast.error(msg);
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleCopyUsername = async () => {
    if (!profile?.username) return;
    try {
      await navigator.clipboard.writeText(profile.username);
      toast.success('Username copiado!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (!user?.email) {
      toast.error('Sessão inválida');
      return;
    }
    setSavingPassword(true);
    try {
      // Re-authenticate to confirm current password
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signErr) {
        toast.error('Senha atual incorreta');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      // Track password change time on profile
      await supabase
        .from('profiles')
        .update({ password_changed_at: new Date().toISOString() })
        .eq('user_id', user.id);
      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  };

  // Password recently updated indicator
  const passwordRecent = (() => {
    if (!profile?.password_changed_at) return false;
    const days = (Date.now() - new Date(profile.password_changed_at).getTime()) / 86400000;
    return days <= 30;
  })();

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
          <Skeleton className="h-10 w-40" />
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-base sm:text-lg font-bold tracking-tight">Meu Perfil</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Profile Card */}
        <section className="glass-card p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-4">
            <UserAvatar name={profile?.display_name} email={user?.email} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {profile?.display_name || user?.email}
                </h2>
                {!roleLoading && (
                  <Badge variant={isAdmin ? 'default' : 'secondary'} className="gap-1">
                    {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    {isAdmin ? 'Admin' : 'Usuário'}
                  </Badge>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopyUsername}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <AtSign className="h-3.5 w-3.5" />
                <span className="font-mono">{profile?.username}</span>
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Conta criada em {formatDate(profile?.created_at)}</span>
            </div>
          </div>

          <div className="border-t border-border pt-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Editar Perfil
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Nome</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    maxLength={30}
                    className="pl-8 font-mono"
                    placeholder="seu_username"
                  />
                </div>
                {usernameError ? (
                  <p className="text-xs text-destructive">{usernameError}</p>
                ) : checkingUsername ? (
                  <p className="text-xs text-muted-foreground">Verificando...</p>
                ) : usernameChanged && username ? (
                  <p className="text-xs text-primary flex items-center gap-1"><Check className="h-3 w-3" /> Disponível</p>
                ) : (
                  <p className="text-xs text-muted-foreground">3-30 caracteres: a-z, 0-9, _</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={!dirty || !!usernameError || checkingUsername || updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="glass-card p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">Segurança da Conta</h3>
            </div>
            <Badge variant={passwordRecent ? 'default' : 'secondary'} className="gap-1">
              {passwordRecent ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              {profile?.password_changed_at
                ? `Senha atualizada em ${formatDate(profile.password_changed_at)}`
                : 'Senha nunca atualizada por aqui'}
            </Badge>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Nova</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {savingPassword ? 'Atualizando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>

          <div className="border-t border-border pt-4 flex justify-between items-center flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">Encerrar sessão neste dispositivo</p>
            <Button variant="outline" onClick={() => signOut()} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </section>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar username?</AlertDialogTitle>
            <AlertDialogDescription>
              Você poderá fazer login com o novo username <span className="font-mono font-semibold">{username}</span>.
              O username antigo ficará disponível para outros usuários. Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doSave}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
