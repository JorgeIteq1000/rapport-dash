import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Collaborator {
  id: number;
  nome: string;
  bitrix_id: string;
  ativo: boolean;
  atualizado_em: string;
}

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('colaboradores_ativos')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Error fetching collaborators:', error);
        toast.error('Erro ao carregar colaboradores');
        return;
      }

      setCollaborators(data || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  const updateCollaboratorStatus = async (id: number, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('colaboradores_ativos')
        .update({ ativo })
        .eq('id', id);

      if (error) {
        console.error('Error updating collaborator:', error);
        toast.error('Erro ao atualizar colaborador');
        return false;
      }

      // Update local state
      setCollaborators(prev => 
        prev.map(collaborator => 
          collaborator.id === id 
            ? { ...collaborator, ativo }
            : collaborator
        )
      );

      toast.success(ativo ? 'Colaborador ativado' : 'Colaborador desativado');
      return true;
    } catch (error) {
      console.error('Error updating collaborator:', error);
      toast.error('Erro ao atualizar colaborador');
      return false;
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  return {
    collaborators,
    loading,
    updateCollaboratorStatus,
    refetch: fetchCollaborators
  };
}