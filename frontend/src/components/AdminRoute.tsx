import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const { authenticated, user } = useAuth();

  if (!authenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/plant" replace />;

  return children;
}
