import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

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

interface DataUploaderProps {
  onDataLoad: (data: CallData[]) => void;
}

export const DataUploader = ({ onDataLoad }: DataUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Carregamento automático quando o componente é montado
  useEffect(() => {
    loadFromGoogleSheets();
  }, []);

  const loadFromGoogleSheets = async () => {
    setIsLoading(true);
    try {
      // ID da sua planilha extraído do link
      const spreadsheetId = '1iplPuPAD2rYDVdon4DWJhfrENiEKvCqU94N5ZArfImM';
      
      // URL para exportar como CSV
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
      
      const response = await fetch(csvUrl, {
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao acessar a planilha');
      }
      
      const csvText = await response.text();
      const jsonData = csvToJson(csvText);
      
      onDataLoad(jsonData);
      toast.success(`${jsonData.length} registro(s) carregado(s) do Google Sheets!`);
    } catch (error) {
      toast.error("Erro ao carregar dados do Google Sheets. Verifique se a planilha é pública.");
      console.error("Erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const csvToJson = (csv: string): CallData[] => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const jsonArray: CallData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      if (values.length >= headers.length) {
        const obj: any = {};
        headers.forEach((header, index) => {
          let value: any = values[index];
          
          // Converter números
          if (!isNaN(Number(value)) && value !== '') {
            value = Number(value);
          }
          
          obj[header] = value;
        });
        
        // Verificar se tem os campos obrigatórios
        if (obj["Data"] && obj["Colaborador"] && obj["Total de Chamadas"] !== undefined) {
          jsonArray.push(obj as CallData);
        }
      }
    }
    
    return jsonArray;
  };

  return (
    <Card className="p-6 bg-dashboard-card border-dashboard-card-border shadow-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-dashboard-primary" />
            <h3 className="text-lg font-semibold">Dados de Performance - Google Sheets</h3>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadFromGoogleSheets}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <p>Carregando dados da planilha...</p>
          ) : (
            <p>Dados carregados automaticamente do Google Sheets. Use o botão "Atualizar" para sincronizar.</p>
          )}
        </div>
      </div>
    </Card>
  );
};