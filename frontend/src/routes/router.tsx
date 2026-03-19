import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../app/AppShell";

import PlantMap from "../pages/PlantMap";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";

import FermenterDetailPage from "../pages/FermenterDetail";
import FermenterHistoryPage from "../pages/FermenterHistory";
import ProductionPage from "../pages/Production";
import ProductionHistoryPage from "../pages/ProductionHistoryPage";
import RawMaterialsPage from "../modules/raw-materials/RawMaterialsPage";
import RawMaterialsInventoryPage from "../modules/raw-materials/RawMaterialsInventoryPage";
import BbtDetail from "../pages/BbtDetail";
import ColdRoomPage from "../pages/ColdRoomPage";
import BottlingPage from "../pages/BottlingPage";
import ColdRoomInventoryPage from "../pages/ColdRoomInventoryPage";
import ReportsPage from "../pages/ReportsPage";
import ProductionReportPage from "../pages/ProductionReportPage";
import ColdRoomOutputsPage from "../pages/ColdRoomOutputsPage";
import RequireAuth from "../auth/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/change-password",
    element: <ChangePasswordPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/plant" replace /> },

          { path: "plant", element: <PlantMap /> },

          { path: "fermenters/:id", element: <FermenterDetailPage /> },
          { path: "fermenters/:id/history", element: <FermenterHistoryPage /> },

          { path: "bbt", element: <div>BBT (pendiente)</div> },
          { path: "bbt/:id", element: <BbtDetail /> },

          { path: "cold-room", element: <ColdRoomPage /> },
          { path: "bottling", element: <BottlingPage /> },
          { path: "cold-room/inventory", element: <ColdRoomInventoryPage /> },
          { path: "cold-room-outputs", element: <ColdRoomOutputsPage /> },

          { path: "production", element: <ProductionPage /> },
          { path: "production/history", element: <ProductionHistoryPage /> },

          { path: "raw-materials", element: <RawMaterialsPage /> },
          { path: "raw-materials/inventory", element: <RawMaterialsInventoryPage /> },

          { path: "reports", element: <ReportsPage /> },
          { path: "reports/:id", element: <ProductionReportPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/plant" replace />,
  },
]);