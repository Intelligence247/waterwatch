import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'citizen' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { full_name: string; role: string; phone?: string; community?: string } | null;
  userRole: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpAdmin: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signUpCitizen: (email: string, password: string, fullName: string, phone: string, community: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; role: string; phone?: string; community?: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // Check admin_profiles first
    const { data: adminData } = await supabase
      .from('admin_profiles')
      .select('full_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (adminData) {
      setProfile({ full_name: adminData.full_name, role: adminData.role });
      setUserRole('admin');
      return;
    }

    // Check citizen_profiles
    const { data: citizenData } = await supabase
      .from('citizen_profiles')
      .select('full_name, phone, community')
      .eq('id', userId)
      .maybeSingle();

    if (citizenData) {
      setProfile({ full_name: citizenData.full_name, role: 'citizen', phone: citizenData.phone, community: citizenData.community });
      setUserRole('citizen');
      return;
    }

    setProfile(null);
    setUserRole(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => { await fetchProfile(s.user.id); })();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => { await fetchProfile(s.user.id); })();
      } else {
        setProfile(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpAdmin = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('admin_profiles').insert({ id: data.user.id, full_name: fullName });
    }
    return { error: null };
  };

  const signUpCitizen = async (email: string, password: string, fullName: string, phone: string, community: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('citizen_profiles').insert({
        id: data.user.id,
        full_name: fullName,
        phone,
        community,
      });
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, userRole, loading, signIn, signUpAdmin, signUpCitizen, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
