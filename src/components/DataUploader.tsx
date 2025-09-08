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
  "Vendas WhatsApp": number;
  "Hora da Ligação": string;
  "Tipo": "ligacao" | "whatsapp";
}

interface DataUploaderProps {
  onDataLoad: (data: CallData[]) => void;
}

export const DataUploader = ({ onDataLoad }: DataUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Carregamento automático quando o componente é montado
  useEffect(() => {
    loadFromGoogleSheets();
  }, []);

  // Atualização automática a cada 15 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadFromGoogleSheets();
    }, 15 * 60 * 1000); // 15 minutos em milissegundos

    return () => clearInterval(interval);
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
      setLastUpdate(new Date());
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
    
    const jsonArray: CallData[] = [];
    
    // Mapear colunas por índice (A=0, B=1, D=3, E=4, F=5, H=7, I=8, J=9)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      if (values.length >= 2 && values[0] && values[1]) { // Precisa ter Data e Colaborador
        const data = values[0];
        const colaborador = values[1];
        const colD = values[3] || ""; // Chamadas efetuadas +60 (tempo)
        const colE = values[4] || ""; // Chamadas recebidas +60 (tempo)  
        const colF = values[5] || ""; // Ligações -60 (só contagem)
        const colH = values[7] || "0"; // Conversas em andamento
        const colI = values[8] || "0"; // Vendas
        const colJ = values[9] || ""; // Hora da ligação
        
        // Identificar se é ligação ou WhatsApp
        const isCallRecord = colD || colE || colF; // Se tem dados de ligação
        const isWhatsAppRecord = !isCallRecord && Number(colI) > 0; // Só vendas sem dados de ligação
        
        if (isCallRecord) {
          // Registros de ligação
          const chamadasEfetuadas60 = colD ? 1 : 0;
          const chamadasRecebidas60 = colE ? 1 : 0;
          const ligacoesMenos60 = colF ? 1 : 0;
          const totalChamadas = chamadasEfetuadas60 + chamadasRecebidas60 + ligacoesMenos60;
          const horasFaladas = sumTimeFields(colD, colE);
          
          const obj: CallData = {
            "Data": data,
            "Colaborador": colaborador,
            "Total de Chamadas": totalChamadas,
            "Chamadas Efetuadas + 60": chamadasEfetuadas60,
            "Chamadas Recebidas + 60": chamadasRecebidas60,
            "Ligações Menos 60": ligacoesMenos60,
            "Horas Faladas": horasFaladas,
            "Conversas em Andamento": Number(colH) || 0,
            "Vendas": Number(colI) || 0,
            "Vendas WhatsApp": 0,
            "Hora da Ligação": colJ,
            "Tipo": "ligacao"
          };
          
          jsonArray.push(obj);
        } else if (isWhatsAppRecord) {
          // Registros de venda por WhatsApp
          const obj: CallData = {
            "Data": data,
            "Colaborador": colaborador,
            "Total de Chamadas": 0,
            "Chamadas Efetuadas + 60": 0,
            "Chamadas Recebidas + 60": 0,
            "Ligações Menos 60": 0,
            "Horas Faladas": "00:00:00",
            "Conversas em Andamento": 0,
            "Vendas": 0,
            "Vendas WhatsApp": Number(colI) || 0,
            "Hora da Ligação": colJ,
            "Tipo": "whatsapp"
          };
          
          jsonArray.push(obj);
        }
      }
    }
    
    return jsonArray;
  };

  const sumTimeFields = (time1: string, time2: string): string => {
    const parseTime = (timeStr: string): number => {
      if (!timeStr || timeStr.trim() === "") return 0;
      const [h = 0, m = 0, s = 0] = timeStr.split(':').map(Number);
      return h * 3600 + m * 60 + s;
    };
    
    const total = parseTime(time1) + parseTime(time2);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
            <p>Sincronizando com o Google Sheets...</p>
          ) : (
            <div className="space-y-1">
              <p>🔄 Atualização automática a cada 15 minutos</p>
              {lastUpdate && (
                <p>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};