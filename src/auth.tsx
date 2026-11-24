import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { createAuthClient } from 'better-auth/react';
import { acceptConsent } from './services/profile';

export const CURRENT_TERMS_VERSION = '2.0';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
});

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface AuthValue {
  session: AppSession | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthCtx = createContext<AuthValue>(null!);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await authClient.getSession();
      const u = res.data?.user;
      setSession(u ? { user: { id: u.id, name: u.name, email: u.email, image: u.image } } : null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) return { error: res.error.message || 'E-mail ou senha incorretos.' };
      await refreshSession();
      return {};
    } catch {
      return { error: 'Não foi possível conectar ao servidor de autenticação.' };
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    try {
      const res = await authClient.signUp.email({ name, email, password });
      if (res.error) return { error: res.error.message || 'Não foi possível criar a conta.' };
      await acceptConsent(CURRENT_TERMS_VERSION).catch(() => undefined);
      await refreshSession();
      return {};
    } catch {
      return { error: 'Não foi possível conectar ao servidor de autenticação.' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin + '/dashboard',
      });
      if (res?.error) {
        const code = (res.error as { code?: string }).code;
        if (code === 'PROVIDER_NOT_FOUND' || res.error.status === 404) {
          return { error: 'Login com Google ainda não configurado (defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env).' };
        }
        return { error: res.error.message || 'Não foi possível entrar com o Google agora.' };
      }
      return {};
    } catch {
      return { error: 'Não foi possível iniciar o login com o Google.' };
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    setSession(null);
  };

  return (
    <AuthCtx.Provider
      value={{ session, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, refreshSession }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-500">Carregando…</div>;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}
