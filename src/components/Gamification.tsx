// src/components/Gamification.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { achievementsList } from "@/lib/achievements";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GamificationProps {
  aggregatedData: [string, any][];
  unlockedAchievements: Record<string, string[]>;
}

export function Gamification({ aggregatedData, unlockedAchievements }: GamificationProps) {
  const leaderboardData = [...aggregatedData].sort((a, b) => b[1].Vendas - a[1].Vendas);

  return (
    <div className="space-y-6">
      <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 px-2">
        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-dashboard-primary" />
        Resultados
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Placar de Líderes (Vendas)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Chamadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map(([name, data], index) => (
                  <TableRow key={name}>
                    <TableCell className="font-bold">{index + 1}</TableCell>
                    <TableCell>{name}</TableCell>
                    <TableCell className="text-right font-semibold text-dashboard-success">{data.Vendas}</TableCell>
                    <TableCell className="text-right">{data['Total de Chamadas']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quadro de Medalhas */}
        <Card>
          <CardHeader>
            <CardTitle>Quadro de Medalhas</CardTitle>
          </CardHeader>
          {/* A MUDANÇA ESTÁ AQUI: classes de altura e overflow removidas */}
          <CardContent className="space-y-4">
            <TooltipProvider>
              {leaderboardData.map(([name]) => {
                const medals = unlockedAchievements[name] || [];
                if (medals.length === 0) return null;

                return (
                  <div key={name}>
                    <h4 className="font-semibold mb-2">{name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {medals.map(medalId => {
                        const achievement = achievementsList.find(a => a.id === medalId);
                        if (!achievement) return null;
                        const Icon = achievement.icon;
                        
                        return (
                          <Tooltip key={medalId}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 bg-muted p-2 rounded-md border cursor-pointer">
                                <Icon className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm font-medium">{achievement.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{achievement.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}