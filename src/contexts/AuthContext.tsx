// LOG: Este contexto gerencia o estado de autenticação (login) do usuário em toda a aplicação.
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
// LOG: CORREÇÃO - Alterado o caminho de importação para relativo para garantir a resolução correta do módulo.
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      // LOG: Busca a sessão de login ativa quando o app carrega.
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // LOG: "Escuta" por mudanças no estado de login (login, logout) e atualiza o contexto.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // LOG: Limpa a "escuta" quando o componente é desmontado para evitar vazamento de memória.
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('LOG: useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

