import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollaborators } from '@/hooks/useCollaborators';

export function CollaboratorsPanel() {
  const { collaborators, loading, updateCollaboratorStatus } = useCollaborators();

  const handleStatusChange = async (id: number, checked: boolean) => {
    await updateCollaboratorStatus(id, checked);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (collaborators.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">
          Nenhum colaborador encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-3">
        Selecione os colaboradores ativos da equipe
      </p>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-dashboard-accent/5 transition-colors"
          >
            <Checkbox
              id={`collaborator-${collaborator.id}`}
              checked={collaborator.ativo}
              onCheckedChange={(checked) => 
                handleStatusChange(collaborator.id, checked as boolean)
              }
            />
            <label
              htmlFor={`collaborator-${collaborator.id}`}
              className="text-sm font-medium cursor-pointer flex-1"
            >
              {collaborator.nome}
            </label>
            <span className="text-xs text-muted-foreground">
              ID: {collaborator.bitrix_id}
            </span>
          </div>
        ))}
      </div>
      
      <div className="pt-2 border-t border-dashboard-card-border">
        <p className="text-xs text-muted-foreground">
          Total: {collaborators.length} | Ativos: {collaborators.filter(c => c.ativo).length}
        </p>
      </div>
    </div>
  );
}