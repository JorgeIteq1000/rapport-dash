import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { ShieldCheck, LogOut, Settings, Target, Users } from 'lucide-react';
import { toast } from 'sonner';
import { GoalSetter } from '@/components/GoalSetter';
import { Goal } from '@/components/GoalSetter';
import { CollaboratorsPanel } from '@/components/CollaboratorsPanel';
import { useCollaborators } from '@/hooks/useCollaborators';

export default function AdminArea() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const navigate = useNavigate();
  
  // Hook para buscar colaboradores do Supabase
  const { collaborators: allCollaborators, loading: loadingCollaborators } = useCollaborators();
  
  // Filtrar apenas colaboradores ativos e extrair os nomes
  const activeCollaboratorNames = allCollaborators
    .filter(collaborator => collaborator.ativo)
    .map(collaborator => collaborator.nome);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load goals from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('individualGoals');
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair');
    } else {
      toast.success('Logout realizado com sucesso!');
      navigate('/');
    }
  };

  const handleSaveGoal = (goal: Goal) => {
    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    localStorage.setItem('individualGoals', JSON.stringify(updatedGoals));
    toast.success('Meta salva com sucesso!');
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);
    localStorage.setItem('individualGoals', JSON.stringify(updatedGoals));
    toast.success('Meta removida com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dashboard-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-dashboard-card border-b border-dashboard-card-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-dashboard-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-dashboard-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Área do Gestor</h1>
                <p className="text-sm text-muted-foreground">Painel Administrativo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Bem-vindo ao Painel Administrativo</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gerencie metas individuais da sua equipe e configure parâmetros do sistema.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Target className="w-8 h-8 text-dashboard-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Gerenciar Metas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Configure metas individuais para cada colaborador
                </p>
                <GoalSetter
                  goals={goals}
                  onSaveGoal={handleSaveGoal}
                  onDeleteGoal={handleDeleteGoal}
                  collaborators={activeCollaboratorNames}
                  aggregatedData={[]} // Empty for now, will be populated later
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="w-8 h-8 text-dashboard-info mx-auto mb-2" />
                <CardTitle className="text-lg">Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <CollaboratorsPanel />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Settings className="w-8 h-8 text-dashboard-accent mx-auto mb-2" />
                <CardTitle className="text-lg">Configurações</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Ajuste parâmetros e configurações do sistema
                </p>
                <Button variant="outline" disabled>
                  Em Breve
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Goals Overview */}
          {goals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Metas Ativas ({goals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 bg-dashboard-accent/5 rounded-lg">
                      <div>
                        <p className="font-medium">{goal.collaborator}</p>
                        <p className="text-sm text-muted-foreground">
                          Meta de {goal.metric}: {goal.target}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return to Dashboard */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-dashboard-primary hover:text-dashboard-primary/80"
            >
              ← Voltar ao Dashboard Principal
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}