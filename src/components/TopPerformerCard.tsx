import { Crown, Trophy, Target, TrendingUp, Zap, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AggregatedData {
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  "Ligações Menos 60": number;
  "Horas Faladas": string;
  "Conversas em Andamento": number;
  Vendas: number;
  "Vendas WhatsApp": number;
  "Total Vendas": number;
}

interface Goal {
  id: string;
  collaborator: string;
  metric: 'Vendas' | 'Total de Chamadas' | 'Horas Faladas';
  target: number;
}

interface TopPerformerCardProps {
  topPerformer: [string, AggregatedData];
  goalData?: Goal;
  selectedDateRange: { from: Date; to: Date } | null;
}

// Função para converter tempo string em horas decimais
const timeStringToHours = (timeStr: string): number => {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours + minutes / 60 + seconds / 3600;
};

// Função para calcular dias úteis entre duas datas
const getWorkingDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  let current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Não é domingo nem sábado
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Função para obter dias úteis restantes do mês
const getRemainingWorkingDays = (currentDate: Date): number => {
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  return getWorkingDays(currentDate, endOfMonth);
};

// Frases motivacionais baseadas no progresso
const getMotivationalMessage = (progressPercent: number, collaboratorName: string): { message: string; emoji: string } => {
  if (progressPercent >= 100) {
    return {
      message: `🏆 ${collaboratorName} é uma LENDA! Superou todas as expectativas!`,
      emoji: "🏆"
    };
  } else if (progressPercent >= 90) {
    return {
      message: `🎯 ${collaboratorName}, reta final! A vitória está nas suas mãos!`,
      emoji: "🎯"
    };
  } else if (progressPercent >= 75) {
    return {
      message: `👑 ${collaboratorName}, quase lá! Você é um verdadeiro campeão!`,
      emoji: "👑"
    };
  } else if (progressPercent >= 50) {
    return {
      message: `🔥 ${collaboratorName} imparável! A meta está ao seu alcance!`,
      emoji: "🔥"
    };
  } else if (progressPercent >= 25) {
    return {
      message: `⚡ ${collaboratorName} acelerando! Você está no caminho certo!`,
      emoji: "⚡"
    };
  } else {
    return {
      message: `🚀 ${collaboratorName} começando forte! Mantenha o foco!`,
      emoji: "🚀"
    };
  }
};

export const TopPerformerCard = ({ topPerformer, goalData, selectedDateRange }: TopPerformerCardProps) => {
  if (!topPerformer) return null;

  const [collaboratorName, data] = topPerformer;
  const goal = goalData?.target || 0;
  
  // Cálculo da projeção inteligente
  const calculateProjection = (): number => {
    if (!selectedDateRange) return data["Total Vendas"];

    const { from, to } = selectedDateRange;
    const totalDays = getWorkingDays(from, to);
    const currentSales = data["Total Vendas"];
    const callsPerDay = data["Total de Chamadas"] / totalDays;
    const hoursPerDay = timeStringToHours(data["Horas Faladas"]) / totalDays;
    
    // Taxa de conversão atual
    const conversionRate = currentSales / data["Total de Chamadas"];
    
    // Eficiência por canal
    const phoneEfficiency = data["Vendas"] / (data["Total de Chamadas"] * 0.6); // Assumindo 60% das chamadas são telefone
    const whatsappEfficiency = data["Vendas WhatsApp"] / (data["Total de Chamadas"] * 0.4); // 40% WhatsApp
    
    // Pipeline bonus (conversas em andamento)
    const pipelineBonus = data["Conversas em Andamento"] * conversionRate * 0.3; // 30% de chance de conversão
    
    // Projeção baseada no ritmo atual + pipeline
    const remainingDays = getRemainingWorkingDays(new Date());
    const projectedSales = currentSales + (callsPerDay * conversionRate * remainingDays) + pipelineBonus;
    
    return Math.round(projectedSales);
  };

  const projection = calculateProjection();
  const progressPercent = goal > 0 ? (data["Total Vendas"] / goal) * 100 : 0;
  const projectionProgressPercent = goal > 0 ? (projection / goal) * 100 : 0;
  const motivationalData = getMotivationalMessage(progressPercent, collaboratorName.split(' ')[0]);

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden bg-gradient-to-br from-dashboard-success via-dashboard-success/90 to-dashboard-success/80 border-dashboard-success/30 shadow-dashboard">
        {/* Efeito de brilho animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        
        <div className="relative p-6 text-white">
          {/* Header com crown e badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
                <Crown className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-100 border-yellow-400/30 mb-1">
                  <Trophy className="w-3 h-3 mr-1" />
                  Top 1
                </Badge>
                <h3 className="text-lg font-bold text-white">{collaboratorName}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-200">{data["Total Vendas"]}</p>
              <p className="text-sm text-white/80">vendas realizadas</p>
            </div>
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Tooltip>
              <TooltipTrigger>
                <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <Phone className="w-4 h-4 mx-auto mb-1 text-white/90" />
                  <p className="text-sm font-semibold text-white">{data["Total de Chamadas"]}</p>
                  <p className="text-xs text-white/70">Chamadas</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total de chamadas realizadas</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <MessageCircle className="w-4 h-4 mx-auto mb-1 text-white/90" />
                  <p className="text-sm font-semibold text-white">{data["Conversas em Andamento"]}</p>
                  <p className="text-xs text-white/70">Pipeline</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Conversas em andamento com potencial de venda</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
                  <Zap className="w-4 h-4 mx-auto mb-1 text-white/90" />
                  <p className="text-sm font-semibold text-white">{data["Horas Faladas"]}</p>
                  <p className="text-xs text-white/70">Tempo</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tempo total dedicado às chamadas</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Projeção e Meta */}
          {goal > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-white/90" />
                  <span className="text-sm font-medium text-white/90">Projeção do Mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className={cn(
                    "w-4 h-4",
                    projection >= goal ? "text-yellow-300" : "text-white/70"
                  )} />
                  <span className="text-lg font-bold text-white">{projection}</span>
                  <span className="text-sm text-white/70">/ {goal}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/80">
                  <span>Meta atual: {progressPercent.toFixed(1)}%</span>
                  <span>Projeção: {projectionProgressPercent.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={Math.min(progressPercent, 100)} 
                  className="h-2 bg-white/20"
                />
                <Progress 
                  value={Math.min(projectionProgressPercent, 100)} 
                  className="h-1 bg-white/10 opacity-70"
                />
              </div>
            </div>
          )}

          {/* Mensagem motivacional */}
          <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">{motivationalData.emoji}</span>
              <p className="text-sm font-medium text-white leading-relaxed">
                {motivationalData.message}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};