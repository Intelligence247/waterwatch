import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler } from '../lib/apiClient';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from '../lib/authTokens';

export type UserRole = 'admin' | 'citizen' | null;

type AuthUser = {
  id: string;
  email: string;
};

type AuthSession = {
  accessToken: string;
} | null;

type BackendUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'citizen';
  phone?: string | null;
  community?: string | null;
  lga?: string | null;
  emailVerified: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession;
  profile: { full_name: string; role: string; phone?: string; community?: string; lga?: string } | null;
  userRole: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; fullName?: string }>;
  signUpAdmin: (
    email: string,
    password: string,
    fullName: string,
    inviteToken: string,
  ) => Promise<{ error: string | null }>;
  signUpCitizen: (email: string, password: string, fullName: string, phone: string, community: string, lga: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: { fullName?: string; phone?: string; community?: string; lga?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession>(null);
  const [profile, setProfile] = useState<{ full_name: string; role: string; phone?: string; community?: string; lga?: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const clearLocalAuthState = () => {
    clearAuthTokens();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
  };

  const applyBackendUser = (backendUser: BackendUser) => {
    setUser({
      id: backendUser.id,
      email: backendUser.email,
    });
    setProfile({
      full_name: backendUser.fullName,
      role: backendUser.role,
      ...(backendUser.phone ? { phone: backendUser.phone } : {}),
      ...(backendUser.community ? { community: backendUser.community } : {}),
      ...(backendUser.lga ? { lga: backendUser.lga } : {}),
    });
    setUserRole(backendUser.role);
  };

  const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const data = await api.post<{ accessToken: string; refreshToken?: string }>(
        '/api/auth/refresh',
        { refreshToken },
      );

      setAuthTokens({
        accessToken: data.accessToken,
        ...(data.refreshToken ? { refreshToken: data.refreshToken } : {}),
      });
      setSession({ accessToken: data.accessToken });
      return data.accessToken;
    } catch {
      clearLocalAuthState();
      return null;
    }
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearLocalAuthState();
    });

    const bootstrap = async () => {
      try {
        const hasAccessToken = Boolean(getAccessToken());
        const hasRefreshToken = Boolean(getRefreshToken());
        if (!hasAccessToken && !hasRefreshToken) {
          clearLocalAuthState();
          return;
        }

        let meData: { user: BackendUser } | null = null;
        try {
          meData = await api.get<{ user: BackendUser }>('/api/auth/me', { auth: true });
        } catch {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            meData = await api.get<{ user: BackendUser }>('/api/auth/me', { auth: true });
          }
        }

        if (meData?.user) {
          applyBackendUser(meData.user);
        } else {
          clearLocalAuthState();
        }
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken?: string;
        user: BackendUser;
      }>('/api/auth/login', { email, password });

      setAuthTokens({
        accessToken: data.accessToken,
        ...(data.refreshToken ? { refreshToken: data.refreshToken } : {}),
      });
      setSession({ accessToken: data.accessToken });
      applyBackendUser(data.user);
      return { error: null, fullName: data.user.fullName };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { error: message };
    }
  };

  const signUpAdmin = async (
    email: string,
    password: string,
    fullName: string,
    inviteToken: string,
  ) => {
    try {
      await api.post('/api/auth/register-admin-with-invite', {
        fullName,
        email,
        password,
        inviteToken,
      });
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return { error: message };
    }
  };

  const signUpCitizen = async (email: string, password: string, fullName: string, phone: string, community: string, lga: string) => {
    try {
      await api.post('/api/auth/register', {
        fullName,
        email,
        password,
        role: 'citizen',
        phone,
        community,
        lga,
      });
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return { error: message };
    }
  };

  const updateProfile = async (updates: { fullName?: string; phone?: string; community?: string; lga?: string }) => {
    const data = await api.put<{ user: BackendUser }>('/api/auth/profile', updates, { auth: true });
    if (data?.user) {
      applyBackendUser(data.user);
    }
  };

  const signOut = async () => {
    try {
      const refreshToken = getRefreshToken();
      await api.post('/api/auth/logout', {
        ...(refreshToken ? { refreshToken } : {}),
      });
    } catch {
      // Sign-out should still proceed locally even if network fails.
    } finally {
      clearLocalAuthState();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, userRole, loading, signIn, signUpAdmin, signUpCitizen, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
