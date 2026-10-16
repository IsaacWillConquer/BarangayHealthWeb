import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PanelLayout from "./layouts/PanelLayout";

import Login from "./pages/auth/Login";
import ChangePassword from "./pages/auth/ChangePassword";

import Dashboard from "./pages/shared/Dashboard";
import StaffManagement from "./pages/admin/StaffManagement";

import ResidentManagement from "./pages/staff/ResidentManagement";
import HealthHistory from "./pages/staff/HealthHistory";
import HealthEvents from "./pages/staff/HealthEvents";
import SurveyManagement from "./pages/staff/SurveyManagement";
import Reports from "./pages/staff/Reports";
import AuditLogs from "./pages/admin/AuditLogs";

import ResidentDashboard from "./pages/resident/ResidentDashboard";
import Profile from "./pages/resident/Profile";
import ResidentHealthEvents from "./pages/resident/ResidentHealthEvents";
import ResidentHealthHistory from "./pages/resident/ResidentHealthHistory";
import ResidentSurveys from "./pages/resident/ResidentSurveys";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {}
          <Route
            path="/staff"
            element={
              <ProtectedRoute role="Staff">
                <PanelLayout role="Staff" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="residents" element={<ResidentManagement />} />
            <Route path="surveys" element={<SurveyManagement />} />
            <Route path="health-events" element={<HealthEvents />} />
            <Route path="health-history" element={<HealthHistory />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="Admin">
                <PanelLayout role="Admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="residents" element={<ResidentManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="surveys" element={<SurveyManagement />} />
            <Route path="health-events" element={<HealthEvents />} />
            <Route path="health-history" element={<HealthHistory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="logs" element={<AuditLogs />} />
          </Route>

          <Route
            path="/resident"
            element={
              <ProtectedRoute role="Resident">
                <PanelLayout role="Resident" />
              </ProtectedRoute>
            }
          >
            <Route index element={<ResidentDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="surveys" element={<ResidentSurveys />} />
            <Route path="health-events" element={<ResidentHealthEvents />} />
            <Route path="health-history" element={<ResidentHealthHistory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
