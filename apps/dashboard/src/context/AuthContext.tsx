import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import client from "../api/client";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  useEffect(() => {
    if (!token) return;
    client
      .get("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
      });
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await client.post("/api/auth/login", { email, password });
    const t = res.data.access_token;
    localStorage.setItem("token", t);
    setToken(t);
    const me = await client.get("/api/auth/me");
    setUser(me.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
