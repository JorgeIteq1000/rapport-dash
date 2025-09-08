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

  // Buscar colaboradores
  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('colaboradores_ativos')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar colaboradores:', error);
        toast.error('Erro ao carregar colaboradores');
        return;
      }

      setCollaborators(data || []);
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status do colaborador
  const updateCollaboratorStatus = async (id: number, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('colaboradores_ativos')
        .update({ ativo })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar colaborador:', error);
        toast.error('Erro ao atualizar status do colaborador');
        return;
      }

      // Atualizar estado local
      setCollaborators(prev => 
        prev.map(collaborator => 
          collaborator.id === id 
            ? { ...collaborator, ativo, atualizado_em: new Date().toISOString() }
            : collaborator
        )
      );

      toast.success(
        `Colaborador ${ativo ? 'ativado' : 'desativado'} com sucesso!`
      );
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      toast.error('Erro ao atualizar status do colaborador');
    }
  };

  // Carregar colaboradores ao montar o componente
  useEffect(() => {
    fetchCollaborators();
  }, []);

  // Configurar listener para mudanças em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('colaboradores_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'colaboradores_ativos'
        },
        () => {
          fetchCollaborators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    collaborators,
    loading,
    updateCollaboratorStatus,
    refetch: fetchCollaborators
  };
}