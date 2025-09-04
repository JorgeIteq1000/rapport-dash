import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Target, TrendingUp, Clock, Info, Phone, AlertCircle, CheckCircle, TrendingDown } from "lucide-react";
import { differenceInDays, parse, isValid, startOfMonth, getDaysInMonth, format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// PROPS: Recebe os totais atuais do dashboard principal
interface MonthlyGoalsProps {
  currentVendas: number;
  currentLigacoes: number;
  currentHorasFaladas: string; // Formato HH:MM:SS
}

// ESTADO: Armazena as metas buscadas da planilha
interface Goals {
  vendas: number;
  ligacoes: number;
  horas: number; // em segundos
  endDate: Date | null;
}

// Interface para os dados de projeção
interface Projection {
    value: number | string;
    percentage: number;
    status: 'on-track' | 'at-risk' | 'off-track';
}

const timeStringToSeconds = (timeStr: string): number => {
    const [h, m, s] = (timeStr || "0:0:0").split(":").map(Number);
    return h * 3600 + m * 60 + s;
};

const secondsToHoursString = (totalSeconds: number, format: 'full' | 'short' = 'short') => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);

    if (format === 'full') {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${hours}h`;
};


// ===== COMPONENTE INTERNO PARA A BARRA DE PROGRESSO FLUIDA =====
const FluidProgressBar = ({
  value,
  goal,
}: {
  value: number;
  goal: number;
}) => {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  // Mapeia a porcentagem (0-100) para uma matiz de cor (0=vermelho, 120=verde)
  const hue = percentage * 1.2;
  const color = `hsl(${hue}, 80%, 45%)`;

  return (
    <div className="w-full h-6 bg-muted rounded-full overflow-hidden border border-border relative">
      <div
        className="h-full rounded-full transition-all duration-500 relative"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      >
        <div className="absolute inset-0 z-0">
          <div className="wave-bg" />
          <div className="wave-fluid" />
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white z-10">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL DAS METAS =====
export const MonthlyGoals = ({
  currentVendas,
  currentLigacoes,
  currentHorasFaladas,
}: MonthlyGoalsProps) => {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      try {
        const spreadsheetId = "1iplPuPAD2rYDVdon4DWJhfrENiEKvCqU94N5ZArfImM";
        const gid = "729091308";

        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
        const response = await fetch(csvUrl);

        if (!response.ok) {
          throw new Error("Erro ao acessar a planilha de metas.");
        }

        const csvText = await response.text();
        const lines = csvText.split("\n").map((l) => l.split(","));
        const goalsData: Record<string, string> = {};
        lines.forEach(([key, value]) => {
          if (key && value) goalsData[key.trim()] = value.trim();
        });

        const parsedDate = parse(goalsData.data_final, "dd/MM/yyyy", new Date());
        setGoals({
          vendas: Number(goalsData.meta_vendas) || 0,
          ligacoes: Number(goalsData.meta_ligacoes) || 0,
          horas: timeStringToSeconds(goalsData.meta_horas || "0"),
          endDate: isValid(parsedDate) ? parsedDate : null,
        });
      } catch (error) {
        console.error("LOG: Erro ao buscar metas:", error);
        toast.error("Não foi possível carregar as metas. Verifique o GID e se a aba está publicada.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const projection = useMemo((): { vendas: Projection; ligacoes: Projection; horas: Projection } | null => {
    if (!goals || !goals.endDate) return null;

    const today = new Date();
    const startDate = startOfMonth(goals.endDate);
    const totalDaysInMonth = getDaysInMonth(goals.endDate);
    const daysPassed = differenceInDays(today, startDate) + 1;

    if (daysPassed <= 0 || daysPassed > totalDaysInMonth) {
        // Se o mês ainda não começou ou já terminou, não calcula a projeção
        return {
            vendas: { value: currentVendas, percentage: (currentVendas / goals.vendas) * 100, status: 'on-track' },
            ligacoes: { value: currentLigacoes, percentage: (currentLigacoes / goals.ligacoes) * 100, status: 'on-track' },
            horas: { value: secondsToHoursString(timeStringToSeconds(currentHorasFaladas), 'short'), percentage: (timeStringToSeconds(currentHorasFaladas) / goals.horas) * 100, status: 'on-track' },
        };
    }

    const dailyPace = {
        vendas: currentVendas / daysPassed,
        ligacoes: currentLigacoes / daysPassed,
        horas: timeStringToSeconds(currentHorasFaladas) / daysPassed,
    };
    
    const projected = {
        vendas: Math.round(dailyPace.vendas * totalDaysInMonth),
        ligacoes: Math.round(dailyPace.ligacoes * totalDaysInMonth),
        horas: dailyPace.horas * totalDaysInMonth,
    };

    const getStatus = (proj: number, goal: number): ('on-track' | 'at-risk' | 'off-track') => {
        const percentage = goal > 0 ? proj / goal : 1;
        if (percentage >= 1) return 'on-track';
        if (percentage >= 0.9) return 'at-risk';
        return 'off-track';
    };

    return {
        vendas: { value: projected.vendas, percentage: (projected.vendas / goals.vendas) * 100, status: getStatus(projected.vendas, goals.vendas) },
        ligacoes: { value: projected.ligacoes, percentage: (projected.ligacoes / goals.ligacoes) * 100, status: getStatus(projected.ligacoes, goals.ligacoes) },
        horas: { value: secondsToHoursString(projected.horas, 'short'), percentage: (projected.horas / goals.horas) * 100, status: getStatus(projected.horas, goals.horas) },
    };
  }, [goals, currentVendas, currentLigacoes, currentHorasFaladas]);

  const ProjectionStatus = ({ status, value, percentage }: Projection) => {
    const statusConfig = {
        'on-track': { icon: <CheckCircle className="w-4 h-4" />, color: 'text-dashboard-success' },
        'at-risk': { icon: <AlertCircle className="w-4 h-4" />, color: 'text-dashboard-warning' },
        'off-track': { icon: <TrendingDown className="w-4 h-4" />, color: 'text-destructive' },
    };
    const { icon, color } = statusConfig[status];

    return (
        <div className={cn("flex items-center gap-2 text-xs font-semibold", color)}>
            {icon}
            <span>{value} <span className="text-muted-foreground font-normal">({percentage.toFixed(0)}%)</span></span>
        </div>
    )
  }

  if (isLoading) {
    return <div>Carregando metas...</div>;
  }

  if (!goals) {
    return null;
  }

  return (
    <div className="space-y-6">
      <style>{`
        .wave-bg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 150%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 40% 45% / 45% 50%;
          transform: translate3d(0, 0, 0);
          animation: wave-animation 6s linear infinite;
          opacity: 0.8;
        }
        .wave-fluid {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 150%;
            height: 100%;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 40% 45% / 45% 50%;
            transform: translate3d(0, 0, 0);
            animation: wave-animation 4s linear infinite reverse;
            opacity: 0.9;
        }

        @keyframes wave-animation {
          0% { margin-left: -50%; transform: scale(1, 1); }
          50% { margin-left: 0; transform: scale(1.05, 0.95); }
          100% { margin-left: -50%; transform: scale(1, 1); }
        }
      `}</style>
      <div className="flex items-baseline gap-2 px-2">
        <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
            Meta do Mês
        </h2>
        {goals.endDate && (
            <span className="text-sm text-muted-foreground">
                - Bater até {format(goals.endDate, "dd/MM/yyyy")}
            </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vendas */}
        <Card className="p-4 space-y-3 bg-dashboard-card border-dashboard-card-border">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-dashboard-success"/>Vendas</h3>
                <span className="text-xs text-muted-foreground">Meta: {goals.vendas}</span>
            </div>
            <FluidProgressBar value={currentVendas} goal={goals.vendas} />
            <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Restam: <span className="font-bold text-foreground">{Math.max(goals.vendas - currentVendas, 0)}</span></span>
                 <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-semibold cursor-help">Projeção:</span>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Estimativa de resultado no final do mês com base no ritmo atual.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {projection && <ProjectionStatus {...projection.vendas}/>}
                </div>
            </div>
        </Card>
        {/* Ligações */}
        <Card className="p-4 space-y-3 bg-dashboard-card border-dashboard-card-border">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-dashboard-primary"/>Ligações</h3>
                <span className="text-xs text-muted-foreground">Meta: {goals.ligacoes}</span>
            </div>
            <FluidProgressBar value={currentLigacoes} goal={goals.ligacoes} />
             <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Restam: <span className="font-bold text-foreground">{Math.max(goals.ligacoes - currentLigacoes, 0)}</span></span>
                 <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-semibold cursor-help">Projeção:</span>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Estimativa de resultado no final do mês com base no ritmo atual.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {projection && <ProjectionStatus {...projection.ligacoes}/>}
                </div>
            </div>
        </Card>
        {/* Horas Faladas */}
        <Card className="p-4 space-y-3 bg-dashboard-card border-dashboard-card-border">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-dashboard-info"/>Horas Faladas</h3>
                <span className="text-xs text-muted-foreground">Meta: {secondsToHoursString(goals.horas, 'short')}</span>
            </div>
            <FluidProgressBar value={timeStringToSeconds(currentHorasFaladas)} goal={goals.horas} />
            <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Restam: <span className="font-bold text-foreground">{secondsToHoursString(goals.horas - timeStringToSeconds(currentHorasFaladas), 'short')}</span></span>
                 <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="font-semibold cursor-help">Projeção:</span>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>Estimativa de resultado no final do mês com base no ritmo atual.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {projection && <ProjectionStatus {...projection.horas}/>}
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};