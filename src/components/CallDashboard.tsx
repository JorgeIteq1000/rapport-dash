import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, parse, isValid } from "date-fns";

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
}

interface AggregatedData {
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  "Ligações Menos 60": number;
  "Horas Faladas": string;
  "Conversas em Andamento": number;
  Vendas: number;
}

export const CallDashboard = () => {
  const [data, setData] = useState<CallData[]>([]);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const handleDataLoad = (newData: CallData[]) => {
    setData(newData);
  };

  const filteredData = useMemo(() => {
    if (!date?.from) return [];

    const parseDate = (dateStr: string) => {
      const parsedDate = parse(dateStr, "dd/MM/yyyy", new Date());
      return isValid(parsedDate) ? parsedDate : null;
    };

    return data.filter((item) => {
      const itemDate = parseDate(item.Data);
      if (!itemDate) return false;

      if (date.to) {
        return itemDate >= date.from! && itemDate <= date.to;
      }
      return itemDate.toDateString() === date.from!.toDateString();
    });
  }, [data, date]);

  const aggregatedDataByCollaborator = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      if (!acc[item.Colaborador]) {
        acc[item.Colaborador] = {
          "Total de Chamadas": 0,
          "Chamadas Efetuadas + 60": 0,
          "Chamadas Recebidas + 60": 0,
          "Ligações Menos 60": 0,
          "Horas Faladas": "00:00:00",
          "Conversas em Andamento": 0,
          Vendas: 0,
        };
      }
      const existing = acc[item.Colaborador];
      existing["Total de Chamadas"] += item["Total de Chamadas"];
      existing["Chamadas Efetuadas + 60"] += item["Chamadas Efetuadas + 60"];
      existing["Chamadas Recebidas + 60"] += item["Chamadas Recebidas + 60"];
      existing["Ligações Menos 60"] += item["Ligações Menos 60"];
      existing["Conversas em Andamento"] += item["Conversas em Andamento"];
      existing.Vendas += item.Vendas;

      const [h1, m1, s1] = existing["Horas Faladas"]
        .split(":")
        .map(Number);
      const [h2, m2, s2] = item["Horas Faladas"].split(":").map(Number);
      let totalSeconds = h1 * 3600 + m1 * 60 + s1 + (h2 * 3600 + m2 * 60 + s2);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      existing[
        "Horas Faladas"
      ] = `${hours}:${minutes}:${seconds}`;

      return acc;
    }, {} as Record<string, AggregatedData>);
  }, [filteredData]);

  const aggregatedMetrics = useMemo(() => {
    const collaborators = Object.keys(aggregatedDataByCollaborator);
    if (collaborators.length === 0) return null;

    return {
      totalCalls: collaborators.reduce(
        (sum, key) =>
          sum + aggregatedDataByCollaborator[key]["Total de Chamadas"],
        0
      ),
      totalOutbound60: collaborators.reduce(
        (sum, key) =>
          sum + aggregatedDataByCollaborator[key]["Chamadas Efetuadas + 60"],
        0
      ),
      totalInbound60: collaborators.reduce(
        (sum, key) =>
          sum + aggregatedDataByCollaborator[key]["Chamadas Recebidas + 60"],
        0
      ),
      totalUnder60: collaborators.reduce(
        (sum, key) =>
          sum + aggregatedDataByCollaborator[key]["Ligações Menos 60"],
        0
      ),
      totalOngoing: collaborators.reduce(
        (sum, key) =>
          sum + aggregatedDataByCollaborator[key]["Conversas em Andamento"],
        0
      ),
      totalSales: collaborators.reduce(
        (sum, key) => sum + aggregatedDataByCollaborator[key]["Vendas"],
        0
      ),
      totalCollaborators: collaborators.length,
    };
  }, [aggregatedDataByCollaborator]);

  const calculateTotalTime = () => {
    const totalSeconds = Object.values(aggregatedDataByCollaborator).reduce(
      (total, item) => {
        const [h, m, s] = item["Horas Faladas"].split(":").map(Number);
        return total + h * 3600 + m * 60 + s;
      },
      0
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours
      .toString()
      .padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
            Monitore e analise o desempenho da sua equipe de vendas em tempo
            real
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
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
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
                title="Total de Vendas"
                value={aggregatedMetrics.totalSales}
                icon={<TrendingUp className="w-6 h-6" />}
                variant="success"
              />
            </div>
          </div>
        )}

        {/* Individual Data Table */}
        {Object.keys(aggregatedDataByCollaborator).length > 0 && (
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
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                        Colaborador
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
                        Horas Faladas
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                        Em Andamento
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-dashboard-primary uppercase tracking-wider">
                        Vendas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashboard-card-border">
                    {Object.entries(aggregatedDataByCollaborator).map(
                      ([collaborator, item]) => (
                        <tr
                          key={collaborator}
                          className="hover:bg-dashboard-primary/5 transition-colors"
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-foreground">
                            {collaborator}
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
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-foreground">
                            {item["Horas Faladas"]}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-dashboard-info">
                            {item["Conversas em Andamento"]}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-dashboard-success">
                            {item.Vendas}
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
      </div>
    </div>
  );
};
