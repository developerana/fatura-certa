import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string;
  password_changed_at: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ProfileData | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, username, password_changed_at, created_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileData | null;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { display_name?: string; username?: string }) => {
      if (!user?.id) throw new Error('Não autenticado');
      const payload: Record<string, string> = {};
      if (input.display_name !== undefined) payload.display_name = input.display_name.trim();
      if (input.username !== undefined) payload.username = input.username.trim().toLowerCase();
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_username_available', { _username: username });
  if (error) throw error;
  return !!data;
}
