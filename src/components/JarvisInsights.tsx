import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, UserCheck, Trophy } from "lucide-react";
import { parse, isValid, differenceInDays, startOfMonth } from "date-fns";
import { toast } from "sonner";

// Tipos de dados completos que o componente agora precisa
interface AggregatedData {
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  Vendas: number;
  "Horas Faladas": string;
}

interface JarvisInsightsProps {
  aggregatedData: [string, AggregatedData][];
  totalMetrics: {
    totalSales: number;
    totalCalls: number;
    totalOutbound60: number;
    totalInbound60: number;
    totalHorasFaladas: string;
  }
}

interface Goals {
  vendas: number;
  ligacoes: number;
  horas: number; // meta de horas em segundos
  endDate: Date | null;
}

const timeStringToSeconds = (timeStr: string): number => {
    const [h, m, s] = (timeStr || "0:0:0").split(":").map(Number);
    return h * 3600 + m * 60 + s;
};

// Componente para renderizar cada card de insight
const InsightCard = ({ icon, colorClass, title, children }: { icon: React.ReactNode, colorClass: string, title: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-4 p-3 rounded-lg bg-background/50">
        <div className={`p-2 bg-opacity-20 rounded-lg ${colorClass.replace('text-', 'bg-')}`}>
            {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${colorClass}` })}
        </div>
        <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    </div>
);


export const JarvisInsights = ({ aggregatedData, totalMetrics }: JarvisInsightsProps) => {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // LOG: Busca as metas da planilha (igual antes)
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
        const parsedDate = parse(goalsData.data_final, "dd/MM/yyyy", new Date());
        setGoals({
          vendas: Number(goalsData.meta_vendas) || 0,
          ligacoes: Number(goalsData.meta_ligacoes) || 0,
          horas: timeStringToSeconds(goalsData.meta_horas || "0"),
          endDate: isValid(parsedDate) ? parsedDate : null,
        });
      } catch (error) {
        console.error("LOG (Insights): Erro ao buscar metas:", error);
        toast.error("Jarvis Insights: Não foi possível carregar as metas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const insights = useMemo(() => {
    console.log("LOG (Insights): Analisando dados para gerar todos os insights...");
    if (isLoading || !goals || aggregatedData.length === 0) {
      return [];
    }
    
    const allInsights = [];

    // --- 1. Destaque Positivo (Meta de Horas) ---
    if (goals.endDate) {
        const today = new Date();
        const startDate = startOfMonth(goals.endDate);
        const totalDaysInMonth = differenceInDays(goals.endDate, startDate) + 1;
        const daysPassed = differenceInDays(today, startDate) + 1;

        if (daysPassed > 0) {
            const expectedProgressPercentage = (daysPassed / totalDaysInMonth);
            const expectedHours = goals.horas * expectedProgressPercentage;
            const currentHours = timeStringToSeconds(totalMetrics.totalHorasFaladas);
            const progressPercentage = (currentHours / goals.horas) * 100;
            
            if (currentHours > expectedHours * 1.05) { // Se estiver 5% acima do esperado
                const percentageAbove = ((currentHours / expectedHours) - 1) * 100;
                const topContributor = [...aggregatedData].sort(([, a], [, b]) => timeStringToSeconds(b["Horas Faladas"]) - timeStringToSeconds(a["Horas Faladas"]))[0];
                allInsights.push(
                    <InsightCard icon={<TrendingUp/>} colorClass="text-dashboard-success" title="Destaque Positivo" key="positive">
                        Parabéns! A equipe está <strong className="text-dashboard-success">{percentageAbove.toFixed(0)}%</strong> à frente da meta proporcional de horas. O colaborador <strong className="text-dashboard-success">{topContributor[0]}</strong> é o maior contribuinte.
                    </InsightCard>
                );
            }
        }
    }

    // --- 2. Ponto de Atenção (Taxa de Conversão) ---
    const teamConversionRate = totalMetrics.totalCalls > 0 ? (totalMetrics.totalSales / totalMetrics.totalCalls) * 100 : 0;
    const collaboratorsWithStats = aggregatedData.map(([name, stats]) => ({
        name,
        conversionRate: stats["Total de Chamadas"] > 5 ? (stats.Vendas / stats["Total de Chamadas"]) * 100 : 0, // Analisa apenas com mais de 5 chamadas
        calls: stats["Total de Chamadas"]
    }));

    if (collaboratorsWithStats.length > 1) {
        const lowestConversion = collaboratorsWithStats.sort((a,b) => a.conversionRate - b.conversionRate)[0];
        if (lowestConversion.conversionRate < teamConversionRate / 2 && teamConversionRate > 0) {
             allInsights.push(
                <InsightCard icon={<AlertTriangle/>} colorClass="text-dashboard-warning" title="Ponto de Atenção" key="attention">
                    A taxa de conversão de <strong className="text-dashboard-warning">{lowestConversion.name}</strong> ({lowestConversion.conversionRate.toFixed(1)}%) está significativamente abaixo da média da equipe ({teamConversionRate.toFixed(1)}%).
                </InsightCard>
            );
        }
    }
    
    // --- 3. Sugestão Estratégica (Top Performer de Vendas) ---
     const topPerformer = [...aggregatedData].sort(([, a], [, b]) => b.Vendas - a.Vendas)[0];
     if (topPerformer && topPerformer[1].Vendas > 0) {
          allInsights.push(
            <InsightCard icon={<Lightbulb/>} colorClass="text-dashboard-info" title="Sugestão Estratégica" key="strategy">
                O colaborador <strong className="text-dashboard-info">{topPerformer[0]}</strong> é o líder de vendas. Analisar suas chamadas e scripts pode gerar insights valiosos para treinar o restante da equipe.
            </InsightCard>
        );
     }
    

    // --- 4. Análise de Colaborador (Alto Volume, Baixa Venda) ---
    if (aggregatedData.length > 1) {
        const mostCallsCollaborator = [...aggregatedData].sort(([, a], [, b]) => b["Total de Chamadas"] - a["Total de Chamadas"])[0];
        const averageSales = totalMetrics.totalSales / aggregatedData.length;

        if (mostCallsCollaborator && mostCallsCollaborator[1].Vendas < averageSales && mostCallsCollaborator[1]["Total de Chamadas"] > 10) {
             allInsights.push(
                <InsightCard icon={<UserCheck/>} colorClass="text-purple-400" title="Análise de Colaborador" key="collaborator">
                    <strong className="text-purple-400">{mostCallsCollaborator[0]}</strong> está com um volume de ligações alto, mas as vendas estão abaixo da média. Um ajuste no script de fechamento pode potencializar seus resultados.
                </InsightCard>
            );
        }
    }

    return allInsights;
  }, [aggregatedData, totalMetrics, goals, isLoading]);
  
  if (isLoading) return <Card className="p-4 text-center text-sm text-muted-foreground">Jarvis está analisando os dados...</Card>
  if (insights.length === 0) return null; // Não mostra nada se não houver insights

  return (
    <Card className="p-4 bg-dashboard-card border-dashboard-card-border">
        <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-dashboard-primary/20 rounded-lg">
                 <BrainCircuit className="w-6 h-6 text-dashboard-primary"/>
            </div>
            <div>
                <h3 className="font-semibold text-foreground">Jarvis Insights</h3>
                <p className="text-xs text-muted-foreground">Análises e sugestões automáticas baseadas nos dados do período.</p>
            </div>
        </div>
        <div className="space-y-3">
            {insights}
        </div>
    </Card>
  );
};

