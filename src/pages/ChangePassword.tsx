import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function ChangePassword() {
  const { user, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const mustChange = user.user_metadata?.must_change_password === true;
  if (!mustChange) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });

      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      // Force refresh to clear the flag
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Alterar Senha</h1>
          <p className="text-sm text-muted-foreground">
            Você precisa criar uma nova senha para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new_password">Nova Senha</Label>
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
          <div>
            <Label htmlFor="confirm_password">Confirmar Senha</Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
}
