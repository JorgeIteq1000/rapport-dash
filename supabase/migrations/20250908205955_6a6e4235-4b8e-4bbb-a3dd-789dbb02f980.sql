-- Criar tabela colaboradores_ativos
CREATE TABLE public.colaboradores_ativos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  bitrix_id TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.colaboradores_ativos ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem todos os colaboradores
CREATE POLICY "Authenticated users can view all colaboradores" 
ON public.colaboradores_ativos 
FOR SELECT 
TO authenticated
USING (true);

-- Política para usuários autenticados modificarem colaboradores
CREATE POLICY "Authenticated users can modify colaboradores" 
ON public.colaboradores_ativos 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar função para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION public.update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualizar automaticamente o timestamp
CREATE TRIGGER update_colaboradores_ativos_updated_at
  BEFORE UPDATE ON public.colaboradores_ativos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_colaboradores_updated_at();

-- Inserir colaborador modelo
INSERT INTO public.colaboradores_ativos (nome, bitrix_id, ativo)
VALUES ('Colaborador Modelo', '123', true);