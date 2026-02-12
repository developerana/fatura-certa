import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Users, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  roles: string[];
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user?action=list`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    const data = await response.json();
    if (data.users) {
      setUsers(data.users);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sem sessão');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user?action=create`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success('Usuário criado com sucesso!');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja remover ${userEmail}?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sem sessão');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user?action=delete`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success('Usuário removido com sucesso!');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover usuário');
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-sm sm:text-lg font-bold">Gerenciar Usuários</h1>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs sm:text-sm">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Novo Usuário</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="display_name">Nome</Label>
                  <Input
                    id="display_name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="new_email">Email</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new_password">Senha temporária</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loadingUsers ? (
          <p className="text-muted-foreground text-center py-8">Carregando usuários...</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div
                key={u.id}
                className="glass-card p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    {u.roles.includes('admin') ? (
                      <Shield className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider">
                    {u.roles.includes('admin') ? 'Admin' : 'Usuário'}
                  </span>
                  {u.id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(u.id, u.email)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
