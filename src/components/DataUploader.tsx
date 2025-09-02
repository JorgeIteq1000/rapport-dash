import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, FileText } from "lucide-react";
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
  const [jsonText, setJsonText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const processData = () => {
    if (!jsonText.trim()) {
      toast.error("Por favor, insira ou carregue dados JSON!");
      return;
    }

    setIsLoading(true);
    
    try {
      const parsedData = JSON.parse(jsonText);
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      // Validar estrutura dos dados
      const isValid = dataArray.every((item: any) => 
        item.hasOwnProperty("Data") &&
        item.hasOwnProperty("Colaborador") &&
        item.hasOwnProperty("Total de Chamadas")
      );

      if (!isValid) {
        throw new Error("Formato de dados inválido");
      }

      onDataLoad(dataArray);
      toast.success(`${dataArray.length} registro(s) carregado(s) com sucesso!`);
    } catch (error) {
      toast.error("Erro ao processar dados JSON. Verifique o formato.");
      console.error("Erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = `[
  {
    "Data": "02/09/2025",
    "Colaborador": "Cauã Amorim",
    "Total de Chamadas": 3,
    "Chamadas Efetuadas + 60": 0,
    "Chamadas Recebidas + 60": 1,
    "Ligações Menos 60": 2,
    "Horas Faladas": "00:08:07",
    "Conversas em Andamento": 10,
    "Vendas": 2
  },
  {
    "Data": "02/09/2025",
    "Colaborador": "Ana Silva",
    "Total de Chamadas": 15,
    "Chamadas Efetuadas + 60": 8,
    "Chamadas Recebidas + 60": 5,
    "Ligações Menos 60": 2,
    "Horas Faladas": "02:45:12",
    "Conversas em Andamento": 3,
    "Vendas": 7
  }
]`;
    setJsonText(sampleData);
  };

  return (
    <Card className="p-6 bg-dashboard-card border-dashboard-card-border shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-dashboard-primary" />
          <h3 className="text-lg font-semibold">Carregar Dados de Performance</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-input"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Carregar Arquivo JSON
              </Button>
            </label>
            
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={loadSampleData}
            >
              Carregar Dados de Exemplo
            </Button>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={processData}
              disabled={isLoading || !jsonText.trim()}
              className="w-full bg-dashboard-primary hover:bg-dashboard-primary/90"
            >
              {isLoading ? "Processando..." : "Processar Dados"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Dados JSON:</label>
          <Textarea
            placeholder="Cole aqui seus dados JSON ou carregue um arquivo..."
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="min-h-[200px] font-mono text-sm bg-background/50"
          />
        </div>
      </div>
    </Card>
  );
};