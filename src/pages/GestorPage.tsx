// LOG: Esta é a nova página para a "Área do Gestor". Ela mostra o formulário de login ou o dashboard do gestor, dependendo do estado de autenticação.
import { useState } from 'react';
// LOG: CORREÇÃO - Alterados os caminhos de importação para relativos para garantir a resolução correta dos módulos.
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Goal, GoalSetter } from '../components/GoalSetter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// --- Componente do Formulário de Login ---
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // LOG: Tentativa de login com email e senha usando Supabase.
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      // LOG: Captura e exibe erro de login.
      toast.error(error.message || "Ocorreu um erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Área do Gestor</CardTitle>
          <CardDescription>Faça login para acessar o painel de gerenciamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Componente do Dashboard do Gestor (Conteúdo Protegido) ---
const GestorDashboard = () => {
  const handleLogout = async () => {
    // LOG: Realiza o logout do usuário.
    await supabase.auth.signOut();
    toast.info("Você foi desconectado.");
  };

  return (
    <div className='space-y-6'>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Painel do Gestor</h1>
        <Button onClick={handleLogout} variant="outline">Sair</Button>
      </div>
      
      {/* LOG: O componente de gerenciamento de metas agora vive aqui. */}
      <GoalSetter collaborators={[]} onSaveGoal={function (goal: Goal): void {
              throw new Error('Function not implemented.');
          } } goals={[]} onDeleteGoal={function (goalId: string): void {
              throw new Error('Function not implemented.');
          } } aggregatedData={[]} />

      <div className="mt-8">
        <Link to="/">
          <Button variant="secondary">Voltar para o Dashboard Principal</Button>
        </Link>
      </div>
    </div>
  );
};

// --- Componente Principal da Página ---
export const GestorPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // LOG: Exibe um estado de carregamento enquanto a sessão é verificada.
    return <div>Verificando autenticação...</div>;
  }

  // LOG: Renderiza o componente correto com base no estado de login do usuário.
  return user ? <GestorDashboard /> : <LoginForm />;
};

