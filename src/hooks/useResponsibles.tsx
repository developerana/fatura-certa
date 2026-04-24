import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Responsible {
  id: string;
  name: string;
}

export function useResponsibles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['responsibles', user?.id],
    queryFn: async (): Promise<Responsible[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('responsibles')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddResponsible() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Nome vazio');
      const { data, error } = await supabase
        .from('responsibles')
        .insert({ user_id: user.id, name: trimmed })
        .select('id, name')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['responsibles'] }),
  });
}

export function useDeleteResponsible() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('responsibles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['responsibles'] }),
  });
}
