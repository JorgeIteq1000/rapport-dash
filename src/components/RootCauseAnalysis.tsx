import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, TrendingDown, TrendingUp, Target, Lightbulb } from "lucide-react";

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
  "Hora da Ligação": string;
}

interface RootCauseAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
  collaboratorName: string;
  issue: string;
  rawData: CallData[];
  teamAverages: {
    conversionRate: number;
    avgCallsPerDay: number;
    avgHoursPerDay: string;
  };
}

export const RootCauseAnalysis = ({ isOpen, onClose, collaboratorName, issue, rawData, teamAverages }: RootCauseAnalysisProps) => {
  const analysis = useMemo(() => {
    // Filtrar dados do colaborador
    const collaboratorData = rawData.filter(item => item.Colaborador === collaboratorName);
    
    if (collaboratorData.length === 0) return null;

    // Análise por turno (usando a nova coluna "Hora da Ligação")
    const morningCalls = collaboratorData.filter(item => {
      const hour = item["Hora da Ligação"] ? parseInt(item["Hora da Ligação"].split(':')[0]) : 12;
      return hour >= 6 && hour < 12;
    });
    
    const afternoonCalls = collaboratorData.filter(item => {
      const hour = item["Hora da Ligação"] ? parseInt(item["Hora da Ligação"].split(':')[0]) : 14;
      return hour >= 12 && hour < 18;
    });
    
    const eveningCalls = collaboratorData.filter(item => {
      const hour = item["Hora da Ligação"] ? parseInt(item["Hora da Ligação"].split(':')[0]) : 20;
      return hour >= 18 || hour < 6;
    });

    // Calcular métricas por turno
    const calculateTurnMetrics = (turnData: CallData[]) => {
      const totalCalls = turnData.reduce((sum, item) => sum + item["Total de Chamadas"], 0);
      const totalSales = turnData.reduce((sum, item) => sum + item.Vendas, 0);
      return {
        calls: totalCalls,
        sales: totalSales,
        conversionRate: totalCalls > 0 ? (totalSales / totalCalls) * 100 : 0
      };
    };

    const morningMetrics = calculateTurnMetrics(morningCalls);
    const afternoonMetrics = calculateTurnMetrics(afternoonCalls);
    const eveningMetrics = calculateTurnMetrics(eveningCalls);

    // Análise por dia da semana
    const dayAnalysis = collaboratorData.reduce((acc, item) => {
      const date = new Date(item.Data.split('/').reverse().join('-'));
      const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, etc.
      const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek];
      
      if (!acc[dayName]) {
        acc[dayName] = { calls: 0, sales: 0, days: 0 };
      }
      
      acc[dayName].calls += item["Total de Chamadas"];
      acc[dayName].sales += item.Vendas;
      acc[dayName].days += 1;
      
      return acc;
    }, {} as Record<string, { calls: number; sales: number; days: number }>);

    // Encontrar padrões
    const patterns = [];
    
    // Padrão de horário
    const bestTurnMetrics = [
      { name: 'Manhã', metrics: morningMetrics },
      { name: 'Tarde', metrics: afternoonMetrics },
      { name: 'Noite', metrics: eveningMetrics }
    ].sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate);

    if (bestTurnMetrics[0].metrics.conversionRate > bestTurnMetrics[2].metrics.conversionRate * 1.2) {
      patterns.push({
        type: 'time',
        finding: `Melhor performance no período da ${bestTurnMetrics[0].name.toLowerCase()}`,
        detail: `Taxa de conversão: ${bestTurnMetrics[0].metrics.conversionRate.toFixed(1)}% vs ${bestTurnMetrics[2].metrics.conversionRate.toFixed(1)}% (pior período)`
      });
    }

    // Padrão de dia da semana
    const dayEntries = Object.entries(dayAnalysis);
    if (dayEntries.length > 0) {
      const bestDay = dayEntries.reduce((best, [day, metrics]) => {
        const conversionRate = metrics.calls > 0 ? (metrics.sales / metrics.calls) * 100 : 0;
        const bestRate = best.metrics.calls > 0 ? (best.metrics.sales / best.metrics.calls) * 100 : 0;
        return conversionRate > bestRate ? { day, metrics } : best;
      }, { day: dayEntries[0][0], metrics: dayEntries[0][1] });

      const bestDayRate = bestDay.metrics.calls > 0 ? (bestDay.metrics.sales / bestDay.metrics.calls) * 100 : 0;
      if (bestDayRate > teamAverages.conversionRate * 1.1) {
        patterns.push({
          type: 'day',
          finding: `Melhor performance nas ${bestDay.day}s`,
          detail: `Taxa de conversão: ${bestDayRate.toFixed(1)}% (acima da média da equipe)`
        });
      }
    }

    return {
      morningMetrics,
      afternoonMetrics,
      eveningMetrics,
      dayAnalysis,
      patterns,
      collaboratorTotal: {
        calls: collaboratorData.reduce((sum, item) => sum + item["Total de Chamadas"], 0),
        sales: collaboratorData.reduce((sum, item) => sum + item.Vendas, 0)
      }
    };
  }, [rawData, collaboratorName, teamAverages]);

  if (!analysis) return null;

  const collaboratorConversionRate = analysis.collaboratorTotal.calls > 0 
    ? (analysis.collaboratorTotal.sales / analysis.collaboratorTotal.calls) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-dashboard-primary" />
            Análise de Causa Raiz - {collaboratorName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Problema identificado */}
          <Card className="p-4 bg-dashboard-warning/10 border-dashboard-warning/20">
            <h3 className="font-semibold text-dashboard-warning mb-2 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Problema Identificado
            </h3>
            <p className="text-sm">{issue}</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">
                Taxa atual: {collaboratorConversionRate.toFixed(1)}%
              </Badge>
              <Badge variant="outline">
                Média da equipe: {teamAverages.conversionRate.toFixed(1)}%
              </Badge>
            </div>
          </Card>

          {/* Análise por turno */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-dashboard-primary" />
              Performance por Turno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Manhã (6h-12h)', metrics: analysis.morningMetrics },
                { name: 'Tarde (12h-18h)', metrics: analysis.afternoonMetrics },
                { name: 'Noite (18h-6h)', metrics: analysis.eveningMetrics }
              ].map((turn) => (
                <Card key={turn.name} className="p-3">
                  <h4 className="font-medium text-sm mb-2">{turn.name}</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Chamadas:</span>
                      <span>{turn.metrics.calls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vendas:</span>
                      <span>{turn.metrics.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa:</span>
                      <span className={turn.metrics.conversionRate > collaboratorConversionRate ? 'text-green-600' : 'text-red-600'}>
                        {turn.metrics.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Padrões encontrados */}
          {analysis.patterns.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-dashboard-success" />
                Padrões Identificados
              </h3>
              <div className="space-y-2">
                {analysis.patterns.map((pattern, index) => (
                  <Card key={index} className="p-3 bg-dashboard-success/10 border-dashboard-success/20">
                    <h4 className="font-medium text-sm text-dashboard-success">{pattern.finding}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{pattern.detail}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões */}
          <Card className="p-4 bg-dashboard-info/10 border-dashboard-info/20">
            <h3 className="font-semibold text-dashboard-info mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Sugestões de Melhoria
            </h3>
            <div className="space-y-2 text-sm">
              {analysis.patterns.some(p => p.type === 'time') ? (
                <div>• Concentre mais ligações no período de melhor performance identificado</div>
              ) : (
                <div>• Analise os horários de chamada para identificar padrões de receptividade</div>
              )}
              <div>• Compare scripts e abordagens com colaboradores de maior taxa de conversão</div>
              <div>• Revise o processo de qualificação de leads antes das ligações</div>
              {collaboratorConversionRate < teamAverages.conversionRate * 0.7 && (
                <div>• Considere treinamento adicional em técnicas de fechamento</div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};