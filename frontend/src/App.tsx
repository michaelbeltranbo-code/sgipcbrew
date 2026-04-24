import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PlantMap from "./pages/PlantMap";
import FermenterDetail from "./pages/FermenterDetail";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import FermenterHistory from "./pages/FermenterHistory";
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminRoute from './components/AdminRoute';

function HomePage() {
  return <div>Mapa de planta / inicio</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<AdminRoute><RegisterPage /></AdminRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<ProtectedRoute><PlantMapPage /></ProtectedRoute> }/>
      </Routes>
    </BrowserRouter>
  );
}