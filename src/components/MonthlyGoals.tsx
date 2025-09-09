import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Clock, Phone, AlertTriangle, CheckCircle, Award, BarChart2 } from "lucide-react";
import { parse, isValid, format, eachDayOfInterval, isWeekend, endOfMonth, startOfDay } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { Progress } from "./ui/progress"; // Verifique se este import está correto

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface MonthlyGoalsProps {
  currentVendas: number;
  currentLigacoes: number;
  currentHorasFaladas: string;
  dateRange: DateRange | undefined;
}

interface Goals {
  vendas: number;
  ligacoes: number;
  horas: number; // Armazenado em segundos
}

interface GoalAnalysis {
  status: 'OTIMO' | 'BOM' | 'ALERTA' | 'CRITICO' | 'CONCLUIDO' | 'INDEFINIDO' | 'ERRO';
  message: string;
  details: string;
  projection: number;
  goal: number;
  current: number;
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

const timeStringToSeconds = (timeStr: string): number => {
  const [h, m, s] = (timeStr || "0:0:0").split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const secondsToHoursString = (totalSeconds: number, formatType: 'full' | 'short' = 'short') => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (formatType === 'full') {
    const seconds = Math.round(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${hours}h ${minutes}m`;
};

const calculateBusinessDays = (start: Date, end: Date): number => {
    if (!isValid(start) || !isValid(end)) return 0;
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => !isWeekend(day)).length;
};

// ============================================================================
// COMPONENTES DE UI INTERNOS
// ============================================================================

// Componente para a barra de progresso. Se você já tem um, pode usar o seu.
const FluidProgressBar = ({ value, goal }: { value: number; goal: number }) => {
    const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    return <Progress value={percentage} className="h-6" />;
};


const GoalCard = ({ title, icon, analysis, unit }: { title: string, icon: React.ReactNode, analysis: GoalAnalysis, unit: 'un' | 'h' }) => {
    const { status, message, details, goal, current } = analysis;
    
    const formatValue = (value: number) => {
        return unit === 'h' ? secondsToHoursString(value, 'short') : Math.round(value);
    }

    const statusConfig = {
        OTIMO: { icon: <Award className="w-5 h-5" />, color: "text-dashboard-success" },
        BOM: { icon: <CheckCircle className="w-5 h-5" />, color: "text-dashboard-success" },
        ALERTA: { icon: <AlertTriangle className="w-5 h-5" />, color: "text-dashboard-warning" },
        CRITICO: { icon: <AlertTriangle className="w-5 h-5" />, color: "text-destructive" },
        CONCLUIDO: { icon: <Award className="w-5 h-5" />, color: "text-dashboard-info" },
        INDEFINIDO: { icon: <BarChart2 className="w-5 h-5" />, color: "text-muted-foreground" },
        ERRO: { icon: <AlertTriangle className="w-5 h-5" />, color: "text-destructive" },
    };

    const currentStatus = statusConfig[status];

    return (
        <Card className="p-4 flex flex-col space-y-3 bg-dashboard-card border-dashboard-card-border">
            <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold flex items-center gap-2">{icon}{title}</CardTitle>
                <span className="text-xs text-muted-foreground">Meta: {formatValue(goal)}</span>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
                 <FluidProgressBar value={current} goal={goal} />
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Realizado: <span className="font-bold text-foreground">{formatValue(current)}</span></span>
                    <span>Restam: <span className="font-bold text-foreground">{formatValue(Math.max(goal - current, 0))}</span></span>
                </div>
                <div className="!mt-4 pt-4 border-t border-dashed border-border flex-grow">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="space-y-1 cursor-help">
                                    <h4 className={cn("flex items-center gap-2 font-bold text-sm", currentStatus.color)}>
                                        {currentStatus.icon}
                                        {message}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">{details}</p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                               <p>Projeção de resultado até o final do mês com base no ritmo do período filtrado.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    );
};


// ============================================================================
// COMPONENTE PRINCIPAL DAS METAS
// ============================================================================
export const MonthlyGoals = ({
  currentVendas,
  currentLigacoes,
  currentHorasFaladas: currentHorasFaladasStr,
  dateRange,
}: MonthlyGoalsProps) => {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [goalEndDate, setGoalEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      try {
        const spreadsheetId = "1iplPuPAD2rYDVdon4DWJhfrENiEKvCqU94N5ZArfImM";
        const gid = "729091308";
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
        
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error("Erro ao acessar a planilha de metas.");

        const csvText = await response.text();
        const lines = csvText.split("\n").map((l) => l.split(","));
        const goalsData: Record<string, string> = {};
        lines.forEach(([key, value]) => {
          if (key && value) goalsData[key.trim()] = value.trim();
        });

        setGoals({
          vendas: Number(goalsData.meta_vendas) || 0,
          ligacoes: Number(goalsData.meta_ligacoes) || 0,
          horas: timeStringToSeconds(goalsData.meta_horas || "0"),
        });
        setGoalEndDate(goalsData.data_final || format(new Date(), "dd/MM/yyyy"));
      } catch (error) {
        console.error("LOG: Erro ao buscar metas:", error);
        toast.error("Não foi possível carregar as metas mensais.");
        setGoals({ vendas: 0, ligacoes: 0, horas: 0 }); // **CORREÇÃO**: Define um estado de fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, []);
  
  const analysis = useMemo((): { vendas: GoalAnalysis; ligacoes: GoalAnalysis; horas: GoalAnalysis } => {
    const today = startOfDay(new Date());
    const monthEnd = endOfMonth(today);
    const currentHorasFaladas = timeStringToSeconds(currentHorasFaladasStr) / 3600; // Convert to hours for analysis

    const currentHorasFaladasEmSegundos = timeStringToSeconds(currentHorasFaladasStr);

    // **CORREÇÃO**: Lógica de análise agora funciona mesmo sem `goals` ou `dateRange`
const analyzeMetric = (current: number, goal: number, unit: string, metricName: string): GoalAnalysis => {
    // Adiciona a função formatValue localmente
    const formatValue = (value: number) => {
        return unit === 'h' ? secondsToHoursString(value, 'short') : Math.round(value);
    };

    if (!goals || !dateRange?.from) {
         return { status: 'INDEFINIDO', message: 'Aguardando dados...', details: 'Selecione um período para ver a projeção.', projection: current, goal, current };
    }
    
    const startDate = dateRange.from;
    const endDate = dateRange.to || dateRange.from; // **CORREÇÃO**: Garante que temos uma data final
    
    if (!isValid(startDate) || !isValid(endDate)){
         return { status: 'INDEFINIDO', message: 'Data inválida', details: 'O filtro de data parece inválido.', projection: current, goal, current };
    }
    
    const diasUteisNoFiltro = calculateBusinessDays(startDate, endDate);
    const diasUteisRestantes = endDate < monthEnd ? calculateBusinessDays(endDate, monthEnd) : 0;
    
    if (goal <= 0) {
        return { status: 'INDEFINIDO', message: 'Meta não definida', details: 'Não há meta para calcular a projeção.', projection: current, goal, current };
    }
    if (current >= goal) {
        return { status: 'CONCLUIDO', message: '🎉 Meta Batida!', details: `Parabéns, objetivo alcançado!`, projection: current, goal, current };
    }
    if (diasUteisNoFiltro <= 0) {
        return { status: 'INDEFINIDO', message: 'Sem dados no período', details: 'Selecione um período com dias úteis para calcular.', projection: current, goal, current };
    }

    const ritmoAtual = current / diasUteisNoFiltro;
    const restanteNecessario = goal - current;
    const ritmoNecessario = diasUteisRestantes > 0 ? restanteNecessario / diasUteisRestantes : Infinity;
    const projection = current + (ritmoAtual * diasUteisRestantes);

    let status: GoalAnalysis['status'];
    let message: string;
    let details: string;

    // Format values based on unit
    const formatRate = (rate: number) => {
        if (unit === 'h') {
            // Converte o ritmo (segundos/dia) para horas e minutos
            const dailyMinutes = Math.round((rate % 3600) / 60);
            const dailyHours = Math.floor(rate / 3600);
            return `${dailyHours}h ${dailyMinutes}m/dia`;
        }
        return `${rate.toFixed(1)}/dia`;
    }

    if (projection >= goal) {
        const excedente = projection - goal;
        status = projection > goal * 1.1 ? 'OTIMO' : 'BOM';
        message = `✅ Rumo a Superar a Meta!`;
        details = `Projeção de ${formatValue(projection)} (${formatValue(excedente)} acima). O ritmo atual de ${formatRate(ritmoAtual)} é suficiente.`;
    } else {
        status = projection > goal * 0.9 ? 'ALERTA' : 'CRITICO';
        message = `⚠️ Meta em Risco!`;
        if (ritmoNecessario === Infinity) {
            details = `Projeção de ${formatValue(projection)}. O período selecionado já terminou e a meta não foi atingida.`
        } else {
            details = `Projeção de ${formatValue(projection)}. Para atingir a meta, o ritmo precisa subir de ${formatRate(ritmoAtual)} para ${formatRate(ritmoNecessario)}.`;
        }
    }
    
    return { status, message, details, projection, goal, current };
};

    const fallbackGoal = { vendas: 0, ligacoes: 0, horas: 0 };
    
    return { 
        vendas: analyzeMetric(currentVendas, goals?.vendas ?? 0, 'un', 'Vendas'), 
        ligacoes: analyzeMetric(currentLigacoes, goals?.ligacoes ?? 0, 'un', 'Ligações'), 
        // PASSA O VALOR CORRETO (EM SEGUNDOS) PARA A ANÁLISE
        horas: analyzeMetric(currentHorasFaladasEmSegundos, goals?.horas ?? 0, 'h', 'Horas Faladas') 
    };

  }, [goals, dateRange, currentVendas, currentLigacoes, currentHorasFaladasStr]);

  if (isLoading) {
    return <div>Carregando metas...</div>;
  }

  return (
    <div className="space-y-6">
       <style>{`
        .wave-bg { position: absolute; bottom: 0; left: 0; width: 150%; height: 100%; background: rgba(255, 255, 255, 0.1); border-radius: 40% 45% / 45% 50%; transform: translate3d(0, 0, 0); animation: wave-animation 6s linear infinite; opacity: 0.8; }
        .wave-fluid { position: absolute; bottom: 0; left: 0; width: 150%; height: 100%; background: rgba(255, 255, 255, 0.3); border-radius: 40% 45% / 45% 50%; transform: translate3d(0, 0, 0); animation: wave-animation 4s linear infinite reverse; opacity: 0.9; }
        @keyframes wave-animation { 0% { margin-left: -50%; transform: scale(1, 1); } 50% { margin-left: 0; transform: scale(1.05, 0.95); } 100% { margin-left: -50%; transform: scale(1, 1); } }
      `}</style>
      <div className="flex items-baseline gap-2 px-2">
        <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
          Diagnóstico de Metas
        </h2>
        <span className="text-sm text-muted-foreground">
            - Meta até: {goalEndDate}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GoalCard title="Vendas" icon={<TrendingUp />} analysis={analysis.vendas} unit="un" />
          <GoalCard title="Ligações" icon={<Phone />} analysis={analysis.ligacoes} unit="un" />
          {/* A análise de 'horas' já usa o valor em segundos para cálculo e formatação */}
          <GoalCard title="Horas Faladas" icon={<Clock />} analysis={analysis.horas} unit="h" />
      </div>
    </div>
  );
};