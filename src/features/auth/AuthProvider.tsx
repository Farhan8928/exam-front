import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  isActive: boolean;
  isDeleted: boolean;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  createdAt: Date;
}

const API_URL = import.meta.env.VITE_API_URL || "";

interface AuthContextType {
  user: Omit<User, "password"> | null;
  token: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  const fetchUser = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setMustChangePassword(!!data.mustChangePassword);
      } else {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
      }
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Login failed");
    }

    const data = await res.json();
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setMustChangePassword(!!data.user?.mustChangePassword);
    navigate("/dashboard");
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to change password");
    }

    setMustChangePassword(false);
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
  };

  const logout = () => {
    if (token) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, mustChangePassword, login, logout, changePassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
