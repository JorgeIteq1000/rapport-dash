// src/components/IndividualGoals.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Goal } from "./GoalSetter";
import { Users } from "lucide-react";

// Helper function to convert time string to hours
const timeStringToHours = (time: string): number => {
  const [h = 0, m = 0, s = 0] = (time || "0:0:0").split(":").map(Number);
  return h + m / 60 + s / 3600;
};

// Helper function to format hours to display format
const formatHoursDisplay = (totalHours: number): string => {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
};

interface IndividualGoalsProps {
  aggregatedData: [string, any][];
  goals: Goal[];
}

export function IndividualGoals({ aggregatedData, goals }: IndividualGoalsProps) {
  console.log('Dados para Metas Individuais:', { aggregatedData, goals });

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
        <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
            Metas Individuais
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goals.map(goal => {
                const collaboratorInfo = aggregatedData.find(([name]) => name === goal.collaborator);
                const collaboratorData = collaboratorInfo ? collaboratorInfo[1] : null;

                let currentValue = 0;
                let displayValue = "0";

                if(collaboratorData){
                    // CORREÇÃO: Comparar com "Vendas" (maiúsculo)
                    if (goal.metric === 'Vendas') {
                        currentValue = collaboratorData.Vendas;
                        displayValue = currentValue.toString();
                    }
                    // CORREÇÃO: Comparar com "Total de Chamadas"
                    if (goal.metric === 'Total de Chamadas') {
                        currentValue = collaboratorData["Total de Chamadas"];
                        displayValue = currentValue.toString();
                    }
                    // CORREÇÃO: Comparar com "Horas Faladas"
                    if (goal.metric === 'Horas Faladas') {
                        currentValue = timeStringToHours(collaboratorData["Horas Faladas"]); // Meta em horas
                        displayValue = formatHoursDisplay(currentValue);
                    }
                }

                const progress = goal.target > 0 ? (currentValue / goal.target) * 100 : 0;

                return (
                    <Card key={goal.id} className="p-4 bg-dashboard-card border-dashboard-card-border">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-base">{goal.collaborator}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="capitalize text-sm font-medium">{goal.metric}</span>
                                <span className="text-xs text-muted-foreground">
                                {displayValue} / {goal.target}{goal.metric === 'Horas Faladas' ? 'h' : ''}
                            </span>
                            </div>
                            <Progress value={progress} />
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    </div>
  );
}