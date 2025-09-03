import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Target, TrendingUp, Clock, Info, Phone } from "lucide-react";
import { differenceInWeeks, parse, isValid, format } from "date-fns";
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
        {/* Efeito de onda */}
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
      console.log("LOG: Buscando dados de metas...");
      setIsLoading(true);
      try {
        const spreadsheetId = "1iplPuPAD2rYDVdon4DWJhfrENiEKvCqU94N5ZArfImM";
        const gid = "729091308"; // Seu GID já inserido

        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
        const response = await fetch(csvUrl);

        if (!response.ok) {
          throw new Error("Erro ao acessar a planilha de metas.");
        }

        const csvText = await response.text();
        const lines = csvText.split("\n").map((l) => l.split(","));

        const goalsData: Record<string, string> = {};
        lines.forEach(([key, value]) => {
          if (key && value) {
            goalsData[key.trim()] = value.trim();
          }
        });

        const parsedDate = parse(
          goalsData.data_final,
          "dd/MM/yyyy",
          new Date()
        );

        const timeStringToSeconds = (timeStr: string) => {
          const [h, m, s] = (timeStr || "0:0:0").split(":").map(Number);
          return h * 3600 + m * 60 + s;
        };

        setGoals({
          vendas: Number(goalsData.meta_vendas) || 0,
          ligacoes: Number(goalsData.meta_ligacoes) || 0,
          horas: timeStringToSeconds(goalsData.meta_horas || "0"),
          endDate: isValid(parsedDate) ? parsedDate : null,
        });

        console.log("LOG: Metas carregadas com sucesso!", goalsData);
      } catch (error) {
        console.error("LOG: Erro ao buscar metas:", error);
        toast.error(
          "Não foi possível carregar as metas. Verifique o GID e se a aba está publicada."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const timeStringToSeconds = (timeStr: string) => {
    const [h, m, s] = (timeStr || "0:0:0").split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const secondsToHoursString = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    return `${hours}h`;
  };

  const weeklyPace = useMemo(() => {
    if (!goals || !goals.endDate) return null;

    const weeksLeft = Math.max(
      differenceInWeeks(goals.endDate, new Date()),
      1
    );

    const remainingVendas = goals.vendas - currentVendas;
    const remainingLigacoes = goals.ligacoes - currentLigacoes;
    const remainingHoras =
      goals.horas - timeStringToSeconds(currentHorasFaladas);

    return {
      vendas:
        remainingVendas > 0 ? (remainingVendas / weeksLeft).toFixed(1) : 0,
      ligacoes:
        remainingLigacoes > 0 ? (remainingLigacoes / weeksLeft).toFixed(1) : 0,
      horas:
        remainingHoras > 0
          ? secondsToHoursString(remainingHoras / weeksLeft)
          : "0h",
    };
  }, [goals, currentVendas, currentLigacoes, currentHorasFaladas]);

  if (isLoading) {
    return <div>Carregando metas...</div>;
  }

  if (!goals) {
    return null; // ou alguma mensagem de erro
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
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-dashboard-success" />
              Vendas
            </h3>
            <span className="text-xs text-muted-foreground">
              Meta: {goals.vendas}
            </span>
          </div>
          <FluidProgressBar value={currentVendas} goal={goals.vendas} />
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Restam:{" "}
              <span className="font-bold text-foreground">
                {Math.max(goals.vendas - currentVendas, 0)}
              </span>
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ritmo semanal necessário para bater a meta</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span>
              Ritmo:{" "}
              <span className="font-bold text-foreground">
                {weeklyPace?.vendas}/sem
              </span>
            </span>
          </div>
        </Card>
        {/* Ligações */}
        <Card className="p-4 space-y-3 bg-dashboard-card border-dashboard-card-border">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-dashboard-primary" />
              Ligações
            </h3>
            <span className="text-xs text-muted-foreground">
              Meta: {goals.ligacoes}
            </span>
          </div>
          <FluidProgressBar value={currentLigacoes} goal={goals.ligacoes} />
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Restam:{" "}
              <span className="font-bold text-foreground">
                {Math.max(goals.ligacoes - currentLigacoes, 0)}
              </span>
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ritmo semanal necessário para bater a meta</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span>
              Ritmo:{" "}
              <span className="font-bold text-foreground">
                {weeklyPace?.ligacoes}/sem
              </span>
            </span>
          </div>
        </Card>
        {/* Horas Faladas */}
        <Card className="p-4 space-y-3 bg-dashboard-card border-dashboard-card-border">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-dashboard-info" />
              Horas Faladas
            </h3>
            <span className="text-xs text-muted-foreground">
              Meta: {secondsToHoursString(goals.horas)}
            </span>
          </div>
          <FluidProgressBar
            value={timeStringToSeconds(currentHorasFaladas)}
            goal={goals.horas}
          />
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Restam:{" "}
              <span className="font-bold text-foreground">
                {secondsToHoursString(
                  goals.horas - timeStringToSeconds(currentHorasFaladas)
                )}
              </span>
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ritmo semanal necessário para bater a meta</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span>
              Ritmo:{" "}
              <span className="font-bold text-foreground">
                {weeklyPace?.horas}/sem
              </span>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};