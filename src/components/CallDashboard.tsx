import { Gamification } from "./Gamification"; // Importe o novo componente
import { useEffect } from "react";
import { toast } from "sonner";
import { GoalSetter, Goal } from "./GoalSetter"; // Nosso novo componente de formulário
import { IndividualGoals } from "./IndividualGoals"; // Nosso novo componente de display
import { useState, useMemo } from "react";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { MetricCard } from "./MetricCard";
import { DataUploader } from "./DataUploader";
import { DateRange } from "react-day-picker";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  Clock,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  Crown,
  Award,
} from "lucide-react";
import { TopPerformerCard } from "./TopPerformerCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import { MonthlyGoals } from "./MonthlyGoals";
import { TrendsChart } from "./TrendsChart";
import { Achievements } from "./Achievements";
import { JarvisInsights } from "./JarvisInsights";
import { achievementsList } from "@/lib/achievements";

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
  "Tipo": "ligacao" | "whatsapp";
}

interface AggregatedData {
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  "Ligações Menos 60": number;
  "Horas Faladas": string;
  "Conversas em Andamento": number;
  Vendas: number;
  "Vendas WhatsApp": number;
  "Total Vendas": number; // Soma de vendas por ligação + WhatsApp
}

const timeStringToSeconds = (time: string): number => {
  const [h = 0, m = 0, s = 0] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

const sumTimeStrings = (time1: string, time2: string): string => {
  const [h1 = 0, m1 = 0, s1 = 0] = time1.split(":").map(Number);
  const [h2 = 0, m2 = 0, s2 = 0] = time2.split(":").map(Number);

  let totalSeconds =
    h1 * 3600 + m1 * 60 + s1 + (h2 * 3600 + m2 * 60 + s2);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours
    .toString()
    .padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const CallDashboard = () => {
  const { 
    data, 
    handleDataLoad, 
    filteredData, 
    aggregatedDataByCollaborator, 
    collaborators,
    goals,
    onSaveGoal,
    onDeleteGoal,
    unlockedAchievements,
    date,
    setDate
  } = useDashboardData();

// Agora usamos os dados do contexto - removemos toda a lógica duplicada

  

  

  // Usamos os colaboradores do contexto
  const collaboratorNames = collaborators;

  const top5ByHours = useMemo(() => {
    return [...aggregatedDataByCollaborator]
      .sort(([, a], [, b]) => {
        return (
          timeStringToSeconds(b["Horas Faladas"]) -
          timeStringToSeconds(a["Horas Faladas"])
        );
      })
      .slice(0, 5);
  }, [aggregatedDataByCollaborator]);

  const top5ByOngoing = useMemo(() => {
    return [...aggregatedDataByCollaborator]
      .sort(([, a], [, b]) => {
        return b["Conversas em Andamento"] - a["Conversas em Andamento"];
      })
      .slice(0, 5);
  }, [aggregatedDataByCollaborator]);

  const aggregatedMetrics = useMemo(() => {
    if (aggregatedDataByCollaborator.length === 0) return null;

    const collaboratorsData = aggregatedDataByCollaborator.map(
      ([, data]) => data
    );

    return {
      totalCalls: collaboratorsData.reduce(
        (sum, item) => sum + item["Total de Chamadas"],
        0
      ),
      totalOutbound60: collaboratorsData.reduce(
        (sum, item) => sum + item["Chamadas Efetuadas + 60"],
        0
      ),
      totalInbound60: collaboratorsData.reduce(
        (sum, item) => sum + item["Chamadas Recebidas + 60"],
        0
      ),
      totalUnder60: collaboratorsData.reduce(
        (sum, item) => sum + item["Ligações Menos 60"],
        0
      ),
      totalOngoing: collaboratorsData.reduce(
        (sum, item) => sum + item["Conversas em Andamento"],
        0
      ),
      totalSales: collaboratorsData.reduce((sum, item) => sum + item.Vendas, 0),
      totalWhatsAppSales: collaboratorsData.reduce((sum, item) => sum + item["Vendas WhatsApp"], 0),
      totalAllSales: collaboratorsData.reduce((sum, item) => sum + item["Total Vendas"], 0),
      totalCollaborators: aggregatedDataByCollaborator.length,
    };
  }, [aggregatedDataByCollaborator]);

  const calculateTotalTime = () => {
    return aggregatedDataByCollaborator
      .map(([, item]) => item["Horas Faladas"])
      .reduce((total, time) => sumTimeStrings(total, time), "00:00:00");
  };

  const getCrown = (index: number) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (index === 1) return <Crown className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Crown className="w-4 h-4 text-yellow-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-4">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-gradient-primary px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl">
            <Phone className="w-6 h-6 md:w-8 md:h-8 text-white" />
            <h1 className="text-xl md:text-3xl font-bold text-white">
              Dashboard de Performance
            </h1>
          </div>
          <p className="text-base md:text-xl text-muted-foreground px-2">
            Monitoramento e análise do desempenho da equipe Alpha
          </p>
        </div>

        {/* Data Uploader */}
        <div className="flex flex-col md:flex-row gap-4">
          <DataUploader onDataLoad={handleDataLoad} />
          <div className="w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal md:w-[300px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/y")} -{" "}
                        {format(date.to, "dd/MM/y")}
                      </>
                    ) : (
                      format(date.from, "dd/MM/y")
                    )
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="text-center">
          <Button 
            onClick={() => window.open('/auth', '_blank')}
            variant="outline"
            className="bg-dashboard-primary/10 hover:bg-dashboard-primary/20 border-dashboard-primary/30"
          >
            🛡️ Área do Gestor
          </Button>
        </div>

        {/* TOP PERFORMER CARD */}
        {aggregatedDataByCollaborator.length > 0 && (
          <TopPerformerCard 
            topPerformer={aggregatedDataByCollaborator[0]}
            goalData={goals.find(goal => goal.collaborator === aggregatedDataByCollaborator[0][0])}
            selectedDateRange={date}
          />
        )}

        {/* JARVIS INSIGHTS */}
        {aggregatedMetrics && (
            <JarvisInsights 
                aggregatedData={aggregatedDataByCollaborator}
                rawData={filteredData}
                totalMetrics={{
                    totalSales: aggregatedMetrics.totalSales,
                    totalWhatsAppSales: aggregatedMetrics.totalWhatsAppSales,
                    totalAllSales: aggregatedMetrics.totalAllSales,
                    totalCalls: aggregatedMetrics.totalCalls,
                    totalOutbound60: aggregatedMetrics.totalOutbound60,
                    totalInbound60: aggregatedMetrics.totalInbound60,
                    totalHorasFaladas: calculateTotalTime()
                }}
            />
        )}

        {/* Metrics Grid */}
        {aggregatedMetrics && (
          <div className="space-y-6">
            <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
              Métricas Consolidadas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <MetricCard
                title="Colaboradores"
                value={aggregatedMetrics.totalCollaborators}
                icon={<Users className="w-6 h-6" />}
                variant="info"
              />
              <MetricCard
                title="Total de Chamadas"
                value={aggregatedMetrics.totalCalls}
                icon={<Phone className="w-6 h-6" />}
                variant="default"
              />
              <MetricCard
                title="Chamadas Efetuadas +60s"
                value={aggregatedMetrics.totalOutbound60}
                icon={<PhoneCall className="w-6 h-6" />}
                variant="success"
              />
              <MetricCard
                title="Chamadas Recebidas +60s"
                value={aggregatedMetrics.totalInbound60}
                icon={<PhoneIncoming className="w-6 h-6" />}
                variant="success"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <MetricCard
                title="Ligações -60s"
                value={aggregatedMetrics.totalUnder60}
                icon={<Clock className="w-6 h-6" />}
                variant="warning"
              />
              <MetricCard
                title="Horas Faladas"
                value={calculateTotalTime()}
                icon={<Clock className="w-6 h-6" />}
                variant="info"
              />
              <MetricCard
                title="Conversas em Andamento"
                value={aggregatedMetrics.totalOngoing}
                icon={<MessageSquare className="w-6 h-6" />}
                variant="default"
              />
              <MetricCard
                title="Inscrições por Ligação"
                value={aggregatedMetrics.totalSales}
                icon={<TrendingUp className="w-6 h-6" />}
                variant="success"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
              <MetricCard
                title="Inscrições WhatsApp"
                value={aggregatedMetrics.totalWhatsAppSales}
                icon={<TrendingUp className="w-6 h-6" />}
                variant="info"
              />
              <MetricCard
                title="Total de Inscrições"
                value={aggregatedMetrics.totalAllSales}
                icon={<TrendingUp className="w-6 h-6" />}
                variant="success"
              />
            </div>
          </div>
        )}

        {/* Bloco de Metas do Mês */}
        {aggregatedMetrics && (
          <MonthlyGoals
            currentVendas={aggregatedMetrics.totalAllSales}
            currentLigacoes={aggregatedMetrics.totalCalls}
            currentHorasFaladas={calculateTotalTime()}
            dateRange={date}
          />
        )}
        
         {aggregatedDataByCollaborator.length > 0 && goals.length > 0 && (
            <IndividualGoals 
                aggregatedData={aggregatedDataByCollaborator}
                goals={goals}
            />
        )}

        {/* Seção de Gráficos e Destaques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TrendsChart data={filteredData} dateRange={date || {from: new Date(), to: new Date()}} />
            <Achievements data={aggregatedDataByCollaborator} />
        </div>

        {/* Tabela Principal de Dados Individuais */}
        {aggregatedDataByCollaborator.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
              Dados Individuais por Total de Inscrições
            </h2>

            <div className="bg-dashboard-card border border-dashboard-card-border rounded-lg shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dashboard-primary/10">
                            <tr>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Colaborador
                            </th>
                             <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Total Inscrições
                            </th>
                             <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Inscrições Ligação
                            </th>
                             <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Inscrições WhatsApp
                            </th>
                             <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Horas Faladas
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Total Chamadas
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Efetuadas +60
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Recebidas +60
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Menos 60
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                                Em Andamento
                            </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dashboard-card-border">
                            {aggregatedDataByCollaborator.map(
                            ([collaborator, item], index) => (
                                <tr
                                key={collaborator}
                                className="hover:bg-dashboard-primary/5 transition-colors"
                                >
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                    {getCrown(index)}
                                    {collaborator}
                                    </div>
                                </td>
                                 <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-dashboard-success">
                                    {item["Total Vendas"]}
                                 </td>
                                 <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-success">
                                    {item.Vendas}
                                 </td>
                                 <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-info">
                                    {item["Vendas WhatsApp"]}
                                 </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">
                                    {item["Horas Faladas"]}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">
                                    {item["Total de Chamadas"]}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-success">
                                    {item["Chamadas Efetuadas + 60"]}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-success">
                                    {item["Chamadas Recebidas + 60"]}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-warning">
                                    {item["Ligações Menos 60"]}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-info">
                                    {item["Conversas em Andamento"]}
                                </td>
                                </tr>
                            )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {aggregatedDataByCollaborator.length > 0 && (
            <Gamification 
                aggregatedData={aggregatedDataByCollaborator}
                unlockedAchievements={unlockedAchievements}
            />
        )}

        {/* Seção Inferior com Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 por Horas Faladas */}
          {top5ByHours.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
                Top 5 - Horas Faladas
              </h2>
              <div className="bg-dashboard-card border border-dashboard-card-border rounded-lg shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dashboard-primary/10">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                          Colaborador
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                          Horas Faladas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashboard-card-border">
                      {top5ByHours.map(([collaborator, item], index) => (
                        <tr
                          key={collaborator}
                          className="hover:bg-dashboard-primary/5 transition-colors"
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">
                            {index + 1}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">
                            {collaborator}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">
                            {item["Horas Faladas"]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Top 5 por Conversas em Andamento */}
          {top5ByOngoing.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
                Top 5 - Conversas em Andamento
              </h2>

              <div className="bg-dashboard-card border border-dashboard-card-border rounded-lg shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dashboard-primary/10">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                          Colaborador
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                          Em Andamento
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashboard-card-border">
                      {top5ByOngoing.map(([collaborator, item], index) => (
                        <tr
                          key={collaborator}
                          className="hover:bg-dashboard-primary/5 transition-colors"
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">
                            {index + 1}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">
                            {collaborator}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-info">
                            {item["Conversas em Andamento"]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

