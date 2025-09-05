// src/components/GoalSetter.tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress"; // Importe o Progress

// Interface da Meta (sem alterações)
export interface Goal {
  id: string;
  collaborator: string;
  metric: 'Vendas' | 'Total de Chamadas' | 'Horas Faladas'; 
  target: number;
}

// Função de tempo que já usamos
const timeStringToSeconds = (time: string): number => {
  const [h = 0, m = 0, s = 0] = (time || "0:0:0").split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

interface GoalSetterProps {
  collaborators: string[];
  onSaveGoal: (goal: Goal) => void;
  goals: Goal[];
  onDeleteGoal: (goalId: string) => void;
  aggregatedData: [string, any][]; // <-- NOVA PROP
}

export function GoalSetter({ collaborators, onSaveGoal, goals, onDeleteGoal, aggregatedData }: GoalSetterProps) {
  const [collaborator, setCollaborator] = useState<string>('');
  const [metric, setMetric] = useState<'Vendas' | 'Total de Chamadas' | 'Horas Faladas'>('Vendas');
  const [target, setTarget] = useState<number>(0);

  const handleSave = () => {
    // log: Verificando os dados antes de salvar
    console.log('Tentando salvar meta:', { collaborator, metric, target });
    if (!collaborator || !metric || target <= 0) {
      toast.error("Por favor, preencha todos os campos para salvar a meta.");
      return;
    }

    const newGoal: Goal = {
      id: `goal_${new Date().getTime()}`,
      collaborator,
      metric,
      target,
    };
    onSaveGoal(newGoal);
    toast.success(`Meta de ${metric} para ${collaborator} salva com sucesso!`);
    // log: Meta salva
    console.log('Meta salva:', newGoal);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">🎯 Gerenciar Metas Individuais</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]"> {/* Aumentei um pouco a largura */}
        <DialogHeader>
          <DialogTitle>Gerenciar Metas Individuais</DialogTitle>
          <DialogDescription>
            Defina ou remova metas de performance para sua equipe.
          </DialogDescription>
        </DialogHeader>
        {/* Formulário de criação (sem alterações) */}
        <div className="grid gap-4 py-4">
            {/* ... seu formulário aqui ... */}
             <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collaborator" className="text-right">
              Colaborador
            </Label>
            <Select onValueChange={setCollaborator}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {collaborators.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="metric" className="text-right">
              Métrica
            </Label>
            <Select onValueChange={(value) => setMetric(value as 'Vendas' | 'Total de Chamadas' | 'Horas Faladas')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a métrica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vendas">Vendas</SelectItem>
                <SelectItem value="Total de Chamadas">Total de Chamadas</SelectItem>
                <SelectItem value="Horas Faladas">Horas Faladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target" className="text-right">
              Meta
            </Label>
            <Input
              id="target"
              type="number"
              className="col-span-3"
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar Meta</Button>
        </DialogFooter>

        {/* LISTA DE METAS ATUAIS (COM A MELHORIA) */}
        <div className="mt-6">
            <h4 className="font-semibold mb-2">Metas Atuais</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {goals.length > 0 ? goals.map(goal => {
                    const collaboratorInfo = aggregatedData.find(([name]) => name === goal.collaborator);
                    const collaboratorData = collaboratorInfo ? collaboratorInfo[1] : null;

                    let currentValue = 0;
                    if(collaboratorData){
                        if (goal.metric === 'Vendas') currentValue = collaboratorData.Vendas;
                        if (goal.metric === 'Total de Chamadas') currentValue = collaboratorData["Total de Chamadas"];
                        if (goal.metric === 'Horas Faladas') currentValue = timeStringToSeconds(collaboratorData["Horas Faladas"]) / 60;
                    }
                    const progress = goal.target > 0 ? (currentValue / goal.target) * 100 : 0;

                    return (
                        <div key={goal.id} className="flex items-center gap-4 bg-muted p-2 rounded-md">
                            <div className="flex-grow">
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="text-sm font-medium">{goal.collaborator} - <span className="text-muted-foreground">{goal.metric}</span></p>
                                    <p className="text-xs text-muted-foreground">Meta: {goal.target}{goal.metric === 'Horas Faladas' ? ' min' : ''}</p>
                                </div>
                                <Progress value={progress} />
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => onDeleteGoal(goal.id)}>
                                X
                            </Button>
                        </div>
                    )
                }) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta definida.</p>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}