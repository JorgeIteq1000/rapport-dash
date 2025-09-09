// src/lib/achievements.ts
import { Award, Zap, Rocket, Crown } from 'lucide-react';
import React from 'react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  condition: (collaboratorData: any, allCollaboratorsData: [string, any][]) => boolean;
}

export const achievementsList: Achievement[] = [
  {
    id: 'vendas_5',
    name: 'Máquina de Vendas',
    description: 'Atingiu a marca de 5 vendas no período.',
    icon: Award,
    condition: (collaboratorData) => collaboratorData["Total Vendas"] >= 5,
  },
  {
    id: 'ligacoes_50',
    name: 'Voz de Aço',
    description: 'Realizou mais de 50 chamadas no período.',
    icon: Zap,
    condition: (collaboratorData) => collaboratorData['Total de Chamadas'] >= 50,
  },
  {
    id: 'melhor_vendedor',
    name: 'Rei do Pedaço',
    description: 'Foi o colaborador com mais vendas do período.',
    icon: Crown,
    condition: (collaboratorData, allCollaboratorsData) => {
      const maxVendas = Math.max(...allCollaboratorsData.map(c => c[1]["Total Vendas"]));
      return collaboratorData["Total Vendas"] === maxVendas && maxVendas > 0;
    },
  },
  {
    id: 'iniciador',
    name: 'Abridor de Trabalhos',
    description: 'Fez a primeira venda do time no período selecionado.',
    icon: Rocket,
    condition: (collaboratorData, allCollaboratorsData) => {
        // Lógica simplificada: dá a medalha ao melhor vendedor total.
        const maxVendas = Math.max(...allCollaboratorsData.map(c => c[1]["Total Vendas"]));
        return collaboratorData["Total Vendas"] === maxVendas && maxVendas > 0;
    }
  }
];