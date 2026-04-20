import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const id = identifier.trim();
      let email = id;

      // If no "@", treat as username and look up email via edge function
      if (!id.includes('@')) {
        const username = id.toLowerCase();
        if (!/^[a-z0-9_]{3,30}$/.test(username)) {
          throw new Error('Usuário ou senha inválidos');
        }
        const { data, error } = await supabase.functions.invoke('lookup-email-by-username', {
          body: { username },
        });
        if (error || !data?.email) {
          throw new Error('Usuário ou senha inválidos');
        }
        email = data.email as string;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Generic message to prevent enumeration
        throw new Error('Usuário ou senha inválidos');
      }
      toast.success('Login realizado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Gerenciador de Faturas e Gastos</h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="identifier">Email ou Username</Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="seu@email.com ou seu_username"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Aguarde...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
