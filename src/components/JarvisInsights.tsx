import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  UserCheck,
  Trophy,
  Search,
} from "lucide-react";
import { parse, isValid, differenceInDays, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { RootCauseAnalysis } from "./RootCauseAnalysis";

// Tipos de dados completos que o componente agora precisa
interface AggregatedData {
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  Vendas: number;
  "Vendas WhatsApp": number;
  "Total Vendas": number;
  "Horas Faladas": string;
}

interface CallData {
  Data: string;
  Colaborador: string;
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  "Ligações Menos 60": number;
  "Horas Faladas": string;
  "Conversas em Andamento": number;
  Vendas: number;
  "Vendas WhatsApp": number;
  "Hora da Ligação": string;
  Tipo: "ligacao" | "whatsapp";
}

interface JarvisInsightsProps {
  aggregatedData: [string, AggregatedData][];
  rawData: CallData[];
  totalMetrics: {
    totalSales: number; // Vendas apenas por ligação
    totalWhatsAppSales: number; // Vendas por WhatsApp
    totalAllSales: number; // Total geral de vendas
    totalCalls: number;
    totalOutbound60: number;
    totalInbound60: number;
    totalHorasFaladas: string;
  };
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
const InsightCard = ({
  icon,
  colorClass,
  title,
  children,
  onClick,
  isClickable = false,
}: {
  icon: React.ReactNode;
  colorClass: string;
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  isClickable?: boolean;
}) => (
  <div
    className={`flex items-start gap-4 p-3 rounded-lg bg-background/50 ${
      isClickable
        ? "cursor-pointer hover:bg-background/70 transition-colors border-2 border-transparent hover:border-dashboard-primary/30"
        : ""
    }`}
    onClick={onClick}
  >
    <div
      className={`p-2 bg-opacity-20 rounded-lg ${colorClass.replace(
        "text-",
        "bg-"
      )}`}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: `w-6 h-6 ${colorClass}`,
      })}
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">{title}</h4>
        {isClickable && (
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Search className="w-3 h-3" />
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  </div>
);

export const JarvisInsights = ({
  aggregatedData,
  rawData,
  totalMetrics,
}: JarvisInsightsProps) => {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    collaborator: string;
    issue: string;
  } | null>(null);

  // LOG: Busca as metas da planilha (ATUALIZADO PARA LINK PÚBLICO)
  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      try {
        console.log(
          "LOG (Insights): Iniciando busca de metas via CSV Publicado..."
        );

        // --- ⚠️ ATENÇÃO: SUBSTITUA PELO NOVO LINK DA ABA "METAS" ---
        // O link abaixo é o mesmo de Dados e causará erro. Gere um novo para a aba Metas.
        const csvUrl =
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vRvxijQtAooNRrWzlYi5rmXeSLBDQfcN27Iud4WvFu5_k4XzxYFabSKp1zWC_couTJ14kjdl0eF0j4T/pub?output=csv";

        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error(`Erro HTTP ao acessar metas: ${response.status}`);
        }

        const csvText = await response.text();
        console.log(
          "LOG (Insights): CSV de metas recebido. Tamanho:",
          csvText.length
        );

        const lines = csvText.split("\n").map((l) => l.split(","));
        const goalsData: Record<string, string> = {};

        lines.forEach(([key, value]) => {
          if (key && value) {
            // Limpeza de aspas e espaços para garantir leitura correta
            const cleanKey = key.replace(/"/g, "").trim();
            const cleanValue = value.replace(/"/g, "").trim();
            goalsData[cleanKey] = cleanValue;
          }
        });

        // --- DIAGNÓSTICO DO JARVIS ---
        // Se não encontrarmos a chave "meta_vendas", provavelmente estamos lendo a planilha errada.
        if (
          !goalsData.meta_vendas &&
          !goalsData.Meta_Vendas &&
          !goalsData["meta_vendas"]
        ) {
          console.warn(
            "LOG (Insights): ALERTA - Chaves de meta não encontradas! Conteúdo recebido:",
            goalsData
          );
          throw new Error(
            "O link CSV parece ser da aba de DADOS ou está incorreto. Gere o link para a aba METAS."
          );
        }

        console.log(
          "LOG (Insights): Metas processadas com sucesso:",
          goalsData
        );

        const parsedDate = parse(
          goalsData.data_final || "",
          "dd/MM/yyyy",
          new Date()
        );

        setGoals({
          vendas: Number(goalsData.meta_vendas) || 0,
          ligacoes: Number(goalsData.meta_ligacoes) || 0,
          horas: timeStringToSeconds(goalsData.meta_horas || "0"),
          endDate: isValid(parsedDate) ? parsedDate : null,
        });
      } catch (error: any) {
        console.error("LOG (Insights): Erro crítico ao buscar metas:", error);
        // Mostra o erro específico se for o nosso diagnóstico, senão mostra erro genérico
        const errorMessage = error.message.includes("O link CSV parece ser")
          ? error.message
          : "Jarvis Insights: Não foi possível carregar as metas.";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const insights = useMemo(() => {
    // console.log("LOG (Insights): Analisando dados para gerar todos os insights..."); // Reduzindo logs repetitivos
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
        const expectedProgressPercentage = daysPassed / totalDaysInMonth;
        const expectedHours = goals.horas * expectedProgressPercentage;
        const currentHours = timeStringToSeconds(
          totalMetrics.totalHorasFaladas
        );

        // Verificação de segurança para divisão por zero
        if (goals.horas > 0) {
          if (currentHours > expectedHours * 1.05) {
            // Se estiver 5% acima do esperado
            const percentageAbove = (currentHours / expectedHours - 1) * 100;
            const topContributor = [...aggregatedData].sort(
              ([, a], [, b]) =>
                timeStringToSeconds(b["Horas Faladas"]) -
                timeStringToSeconds(a["Horas Faladas"])
            )[0];
            allInsights.push(
              <InsightCard
                icon={<TrendingUp />}
                colorClass="text-dashboard-success"
                title="Destaque Positivo"
                key="positive"
              >
                Parabéns! A equipe está{" "}
                <strong className="text-dashboard-success">
                  {percentageAbove.toFixed(0)}%
                </strong>{" "}
                à frente da meta proporcional de horas. O colaborador{" "}
                <strong className="text-dashboard-success">
                  {topContributor[0]}
                </strong>{" "}
                é o maior contribuinte.
              </InsightCard>
            );
          }
        }
      }
    }

    // --- 2. Ponto de Atenção (Taxa de Conversão apenas para ligações) ---
    const teamConversionRate =
      totalMetrics.totalCalls > 0
        ? (totalMetrics.totalSales / totalMetrics.totalCalls) * 100
        : 0;
    const collaboratorsWithStats = aggregatedData.map(([name, stats]) => ({
      name,
      conversionRate:
        stats["Total de Chamadas"] > 5
          ? (stats.Vendas / stats["Total de Chamadas"]) * 100
          : 0, // Apenas vendas por ligação
      calls: stats["Total de Chamadas"],
      whatsappSales: stats["Vendas WhatsApp"],
    }));

    if (collaboratorsWithStats.length > 1) {
      const lowestConversion = collaboratorsWithStats.sort(
        (a, b) => a.conversionRate - b.conversionRate
      )[0];
      if (
        lowestConversion.conversionRate < teamConversionRate / 2 &&
        teamConversionRate > 0
      ) {
        const issueText = `A taxa de conversão de ${
          lowestConversion.name
        } (${lowestConversion.conversionRate.toFixed(
          1
        )}%) está baixa em ligações, mas ${
          lowestConversion.whatsappSales > 0
            ? `compensa com ${lowestConversion.whatsappSales} inscrições via WhatsApp`
            : "não tem vendas por WhatsApp registradas"
        }.`;
        allInsights.push(
          <InsightCard
            icon={<AlertTriangle />}
            colorClass="text-dashboard-warning"
            title="Ponto de Atenção"
            key="attention"
            isClickable={true}
            onClick={() =>
              setSelectedAnalysis({
                collaborator: lowestConversion.name,
                issue: issueText,
              })
            }
          >
            {issueText}
          </InsightCard>
        );
      }
    }

    // --- 3. Sugestão Estratégica (Top Performer por canal) ---
    const topPerformerByTotal = [...aggregatedData].sort(
      ([, a], [, b]) => b["Total Vendas"] - a["Total Vendas"]
    )[0];
    const topPerformerByCall = [...aggregatedData]
      .filter(([, data]) => data.Vendas > 0)
      .sort(([, a], [, b]) => b.Vendas - a.Vendas)[0];
    const topPerformerByWhatsApp = [...aggregatedData]
      .filter(([, data]) => data["Vendas WhatsApp"] > 0)
      .sort(([, a], [, b]) => b["Vendas WhatsApp"] - a["Vendas WhatsApp"])[0];

    if (topPerformerByTotal && topPerformerByTotal[1]["Total Vendas"] > 0) {
      let strategyText = `${topPerformerByTotal[0]} é o líder geral de inscrições`;

      if (topPerformerByCall && topPerformerByWhatsApp) {
        if (topPerformerByCall[0] === topPerformerByWhatsApp[0]) {
          strategyText += `, dominando tanto ligações quanto WhatsApp.`;
        } else {
          strategyText += `. ${topPerformerByCall[0]} lidera em ligações e ${topPerformerByWhatsApp[0]} em WhatsApp.`;
        }
      } else if (topPerformerByCall) {
        strategyText += `, focando em conversão por ligações.`;
      } else if (topPerformerByWhatsApp) {
        strategyText += `, focando em inscrições via WhatsApp.`;
      }

      allInsights.push(
        <InsightCard
          icon={<Lightbulb />}
          colorClass="text-dashboard-info"
          title="Sugestão Estratégica"
          key="strategy"
        >
          {strategyText} Analisar os métodos de cada canal pode gerar insights
          valiosos.
        </InsightCard>
      );
    }

    // --- 4. Análise de Colaborador (Alto Volume, Baixa Venda) ---
    if (aggregatedData.length > 1) {
      const mostCallsCollaborator = [...aggregatedData].sort(
        ([, a], [, b]) => b["Total de Chamadas"] - a["Total de Chamadas"]
      )[0];
      const averageCallSales = totalMetrics.totalSales / aggregatedData.length; // Média de vendas por ligação

      if (
        mostCallsCollaborator &&
        mostCallsCollaborator[1].Vendas < averageCallSales &&
        mostCallsCollaborator[1]["Total de Chamadas"] > 10
      ) {
        const whatsappCompensation =
          mostCallsCollaborator[1]["Vendas WhatsApp"] > 0
            ? ` Porém, compensa com ${mostCallsCollaborator[1]["Vendas WhatsApp"]} inscrições via WhatsApp.`
            : " Foco em treinar abordagem de fechamento ou incentivar uso do WhatsApp.";

        const issueText = `${mostCallsCollaborator[0]} faz muitas ligações mas converte pouco.${whatsappCompensation}`;
        allInsights.push(
          <InsightCard
            icon={<UserCheck />}
            colorClass="text-purple-400"
            title="Análise de Colaborador"
            key="collaborator"
            isClickable={true}
            onClick={() =>
              setSelectedAnalysis({
                collaborator: mostCallsCollaborator[0],
                issue: issueText,
              })
            }
          >
            {issueText}
          </InsightCard>
        );
      }
    }

    return allInsights;
  }, [aggregatedData, totalMetrics, goals, isLoading]);

  const teamAverages = useMemo(() => {
    const totalCalls = totalMetrics.totalCalls;
    const totalCallSales = totalMetrics.totalSales; // Apenas vendas por ligação
    const avgCallsPerDay = totalCalls / Math.max(aggregatedData.length, 1);

    return {
      conversionRate: totalCalls > 0 ? (totalCallSales / totalCalls) * 100 : 0, // Taxa de conversão só para ligações
      avgCallsPerDay,
      avgHoursPerDay: totalMetrics.totalHorasFaladas,
      avgWhatsAppSales:
        totalMetrics.totalWhatsAppSales / Math.max(aggregatedData.length, 1),
    };
  }, [totalMetrics, aggregatedData]);

  if (isLoading)
    return (
      <Card className="p-4 text-center text-sm text-muted-foreground">
        Jarvis está analisando os dados...
      </Card>
    );
  if (insights.length === 0) return null; // Não mostra nada se não houver insights

  return (
    <Card className="p-4 bg-dashboard-card border-dashboard-card-border">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-2 bg-dashboard-primary/20 rounded-lg">
          <BrainCircuit className="w-6 h-6 text-dashboard-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Jarvis Insights</h3>
          <p className="text-xs text-muted-foreground">
            Análises e sugestões automáticas baseadas nos dados do período.
          </p>
        </div>
      </div>
      <div className="space-y-3">{insights}</div>

      {selectedAnalysis && (
        <RootCauseAnalysis
          isOpen={!!selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          collaboratorName={selectedAnalysis.collaborator}
          issue={selectedAnalysis.issue}
          rawData={rawData}
          teamAverages={teamAverages}
        />
      )}
    </Card>
  );
};
