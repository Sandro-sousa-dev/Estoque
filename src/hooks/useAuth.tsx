import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string): Promise<Profile | null> => {
      try {
        const result = await Promise.race([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);

        if (result === null) {
          console.warn('Timeout ao carregar perfil.');
          return null;
        }

        if (result.error) {
          console.error('Erro ao carregar perfil:', result.error);
          return null;
        }

        return (result.data as Profile | null) ?? null;
      } catch (error) {
        console.error('Erro inesperado ao carregar perfil:', error);
        return null;
      }
    };

    const hydrateSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao recuperar sessão:', error);
        }

        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const currentProfile = await loadProfile(currentUser.id);
          if (!mounted) return;
          setProfile(currentProfile);
        } else {
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const previousUser = user;
      setUser(session?.user ?? null);

      if (session?.user) {
        // Only reload profile if user changed (login) or no profile yet
        // Skip reload on TOKEN_REFRESHED to avoid losing profile
        if (_event === 'TOKEN_REFRESHED') {
          setLoading(false);
          return;
        }

        const currentProfile = await loadProfile(session.user.id);
        if (!mounted) return;
        // Only update profile if fetch succeeded; keep existing on failure
        if (currentProfile !== null) {
          setProfile(currentProfile);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    hydrateSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
