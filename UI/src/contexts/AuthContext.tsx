import { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email?: string };

type AuthContextType = {
  user: User | null;
  isAuthed: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const login = (u: User, token?: string) => {
    setUser(u);
    localStorage.setItem("auth_user", JSON.stringify(u));
    if (token) localStorage.setItem("auth_token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
  };

  const value = useMemo(() => ({ user, isAuthed: !!user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
