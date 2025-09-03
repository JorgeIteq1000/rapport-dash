import { useState } from "react";
import { MetricCard } from "./MetricCard";
import { DataUploader } from "./DataUploader";
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";

interface CallData {
  "Data": string;
  "Colaborador": string;
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  "Ligações Menos 60": number;
  "Horas Faladas": string;
  "Conversas em Andamento": number;
  "Vendas": number;
}

export const CallDashboard = () => {
  const [data, setData] = useState<CallData[]>([]);

  const handleDataLoad = (newData: CallData[]) => {
    setData(newData);
  };

  // Calcular métricas agregadas
  const aggregatedMetrics = data.length > 0 ? {
    totalCalls: data.reduce((sum, item) => sum + item["Total de Chamadas"], 0),
    totalOutbound60: data.reduce((sum, item) => sum + item["Chamadas Efetuadas + 60"], 0),
    totalInbound60: data.reduce((sum, item) => sum + item["Chamadas Recebidas + 60"], 0),
    totalUnder60: data.reduce((sum, item) => sum + item["Ligações Menos 60"], 0),
    totalOngoing: data.reduce((sum, item) => sum + item["Conversas em Andamento"], 0),
    totalSales: data.reduce((sum, item) => sum + item["Vendas"], 0),
    totalCollaborators: new Set(data.map(item => item["Colaborador"])).size,
    latestDate: data[0]?.["Data"] || "N/A"
  } : null;

  // Calcular tempo total falado (soma de todas as horas)
  const calculateTotalTime = () => {
    if (!data.length) return "00:00:00";
    
    let totalSeconds = 0;
    data.forEach(item => {
      const time = item["Horas Faladas"];
      const [hours, minutes, seconds] = time.split(':').map(Number);
      totalSeconds += hours * 3600 + minutes * 60 + seconds;
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            Monitore e analise o desempenho da sua equipe de vendas em tempo real
          </p>
        </div>

        {/* Data Uploader */}
        <DataUploader onDataLoad={handleDataLoad} />

        {/* Metrics Grid */}
        {aggregatedMetrics && (
          <div className="space-y-6">
            <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
              Métricas Consolidadas
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <MetricCard
                title="Data Atual"
                value={aggregatedMetrics.latestDate}
                icon={<Calendar className="w-6 h-6" />}
                variant="info"
              />
              
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <MetricCard
                title="Chamadas Recebidas +60s"
                value={aggregatedMetrics.totalInbound60}
                icon={<PhoneIncoming className="w-6 h-6" />}
                variant="success"
              />
              
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
            </div>

            <div className="flex justify-center">
              <MetricCard
                title="Total de Vendas"
                value={aggregatedMetrics.totalSales}
                icon={<TrendingUp className="w-6 h-6" />}
                variant="success"
                className="md:w-1/2 lg:w-1/4"
              />
            </div>
          </div>
        )}

        {/* Individual Data Table */}
        {data.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
              Dados Individuais
            </h2>
            
            <div className="bg-dashboard-card border border-dashboard-card-border rounded-lg shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dashboard-primary/10">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Colaborador</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Data</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Total Chamadas</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Efetuadas +60</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Recebidas +60</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Menos 60</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Horas Faladas</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Em Andamento</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">Vendas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashboard-card-border">
                    {data.map((item, index) => (
                      <tr key={index} className="hover:bg-dashboard-primary/5 transition-colors">
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">{item["Colaborador"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-muted-foreground">{item["Data"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">{item["Total de Chamadas"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-success">{item["Chamadas Efetuadas + 60"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-success">{item["Chamadas Recebidas + 60"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-warning">{item["Ligações Menos 60"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">{item["Horas Faladas"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-info">{item["Conversas em Andamento"]}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-dashboard-success">{item["Vendas"]}</td>
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
  );
};