import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginUser } from "../api/auth";
import {
  clearAuth,
  getStoredUser,
  getToken,
  isAuthenticated,
  saveAuth,
  type AuthUser,
} from "./authStorage";

type AuthContextType = {
  user: AuthUser | null;
  token: string;
  authenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string>(getToken());

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getToken());
  }, []);

  async function login(username: string, password: string) {
    const res = await loginUser(username, password);
    saveAuth(res.access_token, res.user);
    setUser(res.user);
    setToken(res.access_token);
  }

  function logout() {
    clearAuth();
    setUser(null);
    setToken("");
  }

  const value = useMemo(
    () => ({
      user,
      token,
      authenticated: isAuthenticated(),
      login,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}