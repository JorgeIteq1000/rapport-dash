// LOG: Este arquivo cria um "centro de dados" para o dashboard.
// Ele gerencia o estado dos dados brutos, metas, e cálculos agregados,
// permitindo que diferentes componentes acessem as mesmas informações de forma consistente.

import { createContext, useState, useEffect, useMemo, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { parse, isValid } from 'date-fns';
// LOG: CORREÇÃO - Os caminhos de importação foram revertidos para o formato de "alias" (@/)
// para seguir a configuração do projeto e resolver o erro de compilação.
import { achievementsList } from '@/lib/achievements';
import { Goal } from '@/components/GoalSetter';

// --- INTERFACES ---
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
  "Total Vendas": number;
}

interface DashboardContextType {
  data: CallData[];
  handleDataLoad: (newData: CallData[]) => void;
  filteredData: CallData[];
  aggregatedDataByCollaborator: [string, AggregatedData][];
  collaborators: string[];
  goals: Goal[];
  onSaveGoal: (newGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  unlockedAchievements: Record<string, string[]>;
  date: any; 
  setDate: (date: any) => void;
}

// --- FUNÇÕES AUXILIARES ---
const sumTimeStrings = (time1: string, time2: string): string => {
    const [h1 = 0, m1 = 0, s1 = 0] = time1.split(":").map(Number);
    const [h2 = 0, m2 = 0, s2 = 0] = time2.split(":").map(Number);
    let totalSeconds = h1 * 3600 + m1 * 60 + s1 + (h2 * 3600 + m2 * 60 + s2);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
const timeStringToSeconds = (time: string): number => {
    const [h = 0, m = 0, s = 0] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
};


const DashboardDataContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CallData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, string[]>>({});
  const [date, setDate] = useState<any>({ from: new Date(), to: new Date() });

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('dashboardData');
      if (storedData) setData(JSON.parse(storedData));

      const storedGoals = localStorage.getItem('individualGoals');
      if (storedGoals) setGoals(JSON.parse(storedGoals));
    } catch (error) {
      toast.error("Falha ao carregar dados salvos.");
    }
  }, []);

  const handleDataLoad = (newData: CallData[]) => {
    setData(newData);
    localStorage.setItem('dashboardData', JSON.stringify(newData));
    toast.success("Dados da planilha carregados com sucesso!");
  };

  const onSaveGoal = (newGoal: Goal) => {
    const updatedGoals = [...goals.filter(g => g.id !== newGoal.id), newGoal];
    setGoals(updatedGoals);
    localStorage.setItem('individualGoals', JSON.stringify(updatedGoals));
    toast.success("Meta individual salva!");
  };

  const onDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(g => g.id !== goalId);
    setGoals(updatedGoals);
    localStorage.setItem('individualGoals', JSON.stringify(updatedGoals));
    toast.info("Meta individual removida.");
  };

  const filteredData = useMemo(() => {
    if (!date?.from) return [];
    const parseDate = (dateStr: string) => parse(dateStr, "dd/MM/yyyy", new Date());
    return data.filter((item) => {
      const itemDate = parseDate(item.Data);
      if (!isValid(itemDate)) return false;
      const fromDate = date.from;
      const toDate = date.to || date.from;
      return itemDate >= fromDate && itemDate <= toDate;
    });
  }, [data, date]);

  const aggregatedDataByCollaborator = useMemo(() => {
    const aggregated = filteredData.reduce((acc, item) => {
        if (!acc[item.Colaborador]) {
          acc[item.Colaborador] = { "Total de Chamadas": 0, "Chamadas Efetuadas + 60": 0, "Chamadas Recebidas + 60": 0, "Ligações Menos 60": 0, "Horas Faladas": "00:00:00", "Conversas em Andamento": 0, Vendas: 0, "Vendas WhatsApp": 0, "Total Vendas": 0 };
        }
        const e = acc[item.Colaborador];
        e["Total de Chamadas"] += Number(item["Total de Chamadas"]) || 0;
        e["Chamadas Efetuadas + 60"] += Number(item["Chamadas Efetuadas + 60"]) || 0;
        e["Chamadas Recebidas + 60"] += Number(item["Chamadas Recebidas + 60"]) || 0;
        e["Ligações Menos 60"] += Number(item["Ligações Menos 60"]) || 0;
        e["Conversas em Andamento"] += Number(item["Conversas em Andamento"]) || 0;
        e.Vendas += Number(item.Vendas) || 0;
        e["Vendas WhatsApp"] += Number(item["Vendas WhatsApp"]) || 0;
        e["Total Vendas"] = e.Vendas + e["Vendas WhatsApp"];
        e["Horas Faladas"] = sumTimeStrings(e["Horas Faladas"], item["Horas Faladas"] || "00:00:00");
        return acc;
    }, {} as Record<string, AggregatedData>);

    return Object.entries(aggregated).sort(([, a], [, b]) => b["Total Vendas"] - a["Total Vendas"] || timeStringToSeconds(b["Horas Faladas"]) - timeStringToSeconds(a["Horas Faladas"]));
  }, [filteredData]);

  const collaborators = useMemo(() => {
    const allNames = data.map(item => item.Colaborador);
    return [...new Set(allNames)].sort();
  }, [data]); 

  useEffect(() => {
    if (aggregatedDataByCollaborator.length === 0) return;
    const newUnlocked: Record<string, string[]> = {};
    const allData = aggregatedDataByCollaborator;
    allData.forEach(([name, data]) => {
      newUnlocked[name] = [];
      achievementsList.forEach(achievement => {
        if (achievement.condition(data, allData)) {
          newUnlocked[name].push(achievement.id);
          if (!unlockedAchievements[name]?.includes(achievement.id)) {
            toast.success(`🏆 ${name} desbloqueou: ${achievement.name}!`);
          }
        }
      });
    });
    setUnlockedAchievements(newUnlocked);
  }, [aggregatedDataByCollaborator, unlockedAchievements]);


  const value = { data, handleDataLoad, filteredData, aggregatedDataByCollaborator, collaborators, goals, onSaveGoal, onDeleteGoal, unlockedAchievements, date, setDate };

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardData deve ser usado dentro de um DashboardDataProvider');
  }
  return context;
}

