// hooks/useAuth.ts
"use client"

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  type ReactNode 
} from "react";
import api from "@/lib/api";

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: "admin" | "writer";
  avatar: string | null;
  is_admin: boolean;
}

interface RawUserData {
  id: string;
  email: string;
  full_name?: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  //  Helper : Transformer les données API en AuthUser
  const mapApiUserToAuthUser = useCallback((data: RawUserData): AuthUser => {
    return {
      id: data.id,
      email: data.email,
      full_name: (data.full_name || `${data.first_name} ${data.last_name}`).trim(),
      first_name: data.first_name,
      last_name: data.last_name,
      role: (data.role as "admin" | "writer") || "writer",
      avatar: data.avatar || null,
      is_admin: data.role === "admin",
    };
  }, []);
  

  //  Vérifier l'authentification
 const checkAuth = useCallback(async () => {
  try {
    console.log("🔍 Vérification authentification...");

    const { data } = await api.get("/users/me/");

    setUser(mapApiUserToAuthUser(data));
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log("👤 Utilisateur anonyme");
      setUser(null);
    } else {
      console.error("Erreur auth:", error);
      setUser(null);
    }
  } finally {
    setLoading(false);
    setInitialized(true);
  }
}, [mapApiUserToAuthUser]);

  //  Initialization UNE FOIS au montage
  useEffect(() => {
    if (initialized) return;

    const initAuth = async () => {
      console.log("🚀 App démarrée, vérification authentification...");
      await checkAuth();
      console.log("✨ App prête!");
    };

    initAuth();
  }, []); // ← VIDE : S'exécute UNE fois

  //  Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log("🔑 Tentative de connexion...");
      const { data } = await api.post("/auth/login/", { email, password });
      
      const authUser = mapApiUserToAuthUser(data.user);
      console.log("✅ Connecté:", authUser.email);
      setUser(authUser);

      return {};
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Échec de connexion";
      console.error("❌ Login échoué:", msg);
      return { error: msg };
    }
  }, [mapApiUserToAuthUser]);

  //  Logout
  const logout = useCallback(async () => {
    try {
      console.log("🚪 Déconnexion...");
      await api.post("/auth/logout/");
    } catch (error) {
      console.warn("⚠️ Erreur logout (mais on déconnecte quand même):", error);
    } finally {
      setUser(null);
      console.log("👋 Déconnecté");
      
      if (typeof window !== "undefined") {
        // Utiliser replace au lieu de href pour éviter double redirection
        window.location.replace("/login");
      }
    }
  }, []);

  //  Rafraîchir les données utilisateur
  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  //  Valeur du contexte (mémorisée)
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAdmin: user?.role === "admin" || false,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }), [user, loading, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  }
  return ctx;
}