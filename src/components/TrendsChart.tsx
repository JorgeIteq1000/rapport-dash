import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parse, isValid, eachDayOfInterval, startOfDay } from 'date-fns';

// LOG: Helper para converter HH:MM:SS para um número decimal (horas)
const timeStringToDecimalHours = (time: string): number => {
    if (!time) return 0;
    const [h = 0, m = 0, s = 0] = time.split(':').map(Number);
    return h + m / 60 + s / 3600;
};

// Interface atualizada para incluir Vendas WhatsApp
interface CallData {
  Data: string;
  Vendas: number;
  "Vendas WhatsApp": number; // Adicionado para o cálculo
  "Total de Chamadas": number;
  "Horas Faladas": string;
}

interface TrendsChartProps {
  data: CallData[];
  dateRange: { from: Date; to?: Date };
}

export const TrendsChart = ({ data, dateRange }: TrendsChartProps) => {
    const chartData = React.useMemo(() => {
        console.log("LOG: Recalculando dados do gráfico de tendências...");
        if (!dateRange.from || !dateRange.to) return [];

        const allDays = eachDayOfInterval({
            start: startOfDay(dateRange.from),
            end: startOfDay(dateRange.to),
        });

        const dailyData = allDays.map(day => {
            const formattedDay = format(day, 'dd/MM');
            return {
                name: formattedDay,
                Vendas: 0,
                Chamadas: 0,
                'Horas Faladas': 0, // Horas em decimal
            };
        });

        data.forEach(item => {
            const itemDate = parse(item.Data, 'dd/MM/yyyy', new Date());
            if (isValid(itemDate)) {
                const formattedDay = format(itemDate, 'dd/MM');
                const dayData = dailyData.find(d => d.name === formattedDay);
                if (dayData) {
                    // LOG: CORREÇÃO APLICADA AQUI!
                    // Agora somamos tanto 'Vendas' quanto 'Vendas WhatsApp'
                    dayData.Vendas += (Number(item.Vendas) || 0) + (Number(item["Vendas WhatsApp"]) || 0);
                    dayData.Chamadas += Number(item['Total de Chamadas']) || 0;
                    dayData['Horas Faladas'] += timeStringToDecimalHours(item["Horas Faladas"]);
                }
            }
        });
        
        // Arredondar para 2 casas decimais
        const finalData = dailyData.map(d => ({...d, 'Horas Faladas': parseFloat(d['Horas Faladas'].toFixed(2))}));
        console.log("LOG: Dados do gráfico prontos:", finalData);
        return finalData;

    }, [data, dateRange]);

    return (
        <Card className="p-4 bg-dashboard-card border-dashboard-card-border col-span-1 lg:col-span-2">
             <h3 className="text-lg font-semibold mb-4 text-foreground">Tendências do Período</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }} 
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Line yAxisId="left" type="monotone" dataKey="Vendas" stroke="#10b981" strokeWidth={2} name="Vendas" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="Chamadas" stroke="#3b82f6" strokeWidth={2} name="Total de Chamadas" dot={false}/>
                    <Line yAxisId="left" type="monotone" dataKey="Horas Faladas" stroke="#f59e0b" strokeWidth={2} name="Horas Faladas" dot={false}/>
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};
