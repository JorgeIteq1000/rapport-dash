import React from 'react';
import { Card } from '@/components/ui/card';
import { Crown, Zap, Clock, Award, TrendingUp } from 'lucide-react';

interface AggregatedData {
  "Total de Chamadas": number;
  "Chamadas Efetuadas + 60": number;
  "Chamadas Recebidas + 60": number;
  "Ligações Menos 60": number;
  "Horas Faladas": string;
  "Conversas em Andamento": number;
  Vendas: number;
}

interface AchievementsProps {
  data: [string, AggregatedData][];
}

const timeStringToSeconds = (time: string): number => {
    const [h = 0, m = 0, s = 0] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
}

const AchievementCard = ({ icon, title, collaborator, value }: { icon: React.ReactNode, title: string, collaborator: string, value: string | number }) => (
    <Card className="p-4 flex items-center gap-4 bg-dashboard-card/50 border-dashboard-card-border hover:bg-dashboard-card transition-colors">
        <div className="text-yellow-400">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{collaborator}</p>
        </div>
        <p className="ml-auto text-lg font-bold text-foreground">{value}</p>
    </Card>
);

export const Achievements = ({ data }: AchievementsProps) => {
    if (data.length === 0) {
        return null;
    }

    const kingOfSales = data.reduce((prev, current) => (prev[1].Vendas > current[1].Vendas) ? prev : current);
    const marathonRunner = data.reduce((prev, current) => (timeStringToSeconds(prev[1]["Horas Faladas"]) > timeStringToSeconds(current[1]["Horas Faladas"])) ? prev : current);
    const salesSniper = data.map(([name, stats]) => ({
        name,
        conversionRate: stats["Total de Chamadas"] > 0 ? (stats.Vendas / stats["Total de Chamadas"]) * 100 : 0,
    })).reduce((prev, current) => (prev.conversionRate > current.conversionRate) ? prev : current);
    const quickStriker = data.reduce((prev, current) => (prev[1]["Ligações Menos 60"] > current[1]["Ligações Menos 60"]) ? prev : current);


    return (
        <div className="space-y-6">
            <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
                Destaques do Período
            </h2>
            <div className="space-y-4">
                <AchievementCard icon={<Crown className="w-8 h-8"/>} title="Rei das Vendas" collaborator={kingOfSales[0]} value={kingOfSales[1].Vendas} />
                <AchievementCard icon={<Clock className="w-8 h-8"/>} title="Maratonista da Voz" collaborator={marathonRunner[0]} value={marathonRunner[1]["Horas Faladas"]} />
                <AchievementCard icon={<TrendingUp className="w-8 h-8"/>} title="Sniper de Vendas" collaborator={salesSniper.name} value={`${salesSniper.conversionRate.toFixed(1)}%`} />
                <AchievementCard icon={<Zap className="w-8 h-8"/>} title="Super Ligeiro" collaborator={quickStriker[0]} value={quickStriker[1]["Ligações Menos 60"]} />
            </div>
        </div>
    )
}