import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider as HomeThemeProvider } from "./context/HomeThemeContext";

// ─── Home App ────────────────────────────────────────────────
import HomeApp from "./HomeApp";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import InfoPage from "./pages/InfoPage";
import GetStartedPage from "./pages/GetStartedPage";

// ─── Dedicated Auth Pages ────────────────────────────────────
import AdminLoginPage from "./pages/AdminLoginPage";
import StaffLoginPage from "./pages/StaffLoginPage";

// ─── Admin Dashboard ─────────────────────────────────────────
import AdminLayout, { ThemeProvider as AdminThemeProvider } from "./components/Admin/Navbar";
import AdminHome from "./components/Admin/Home";
import ViewInventory from "./components/Admin/Inventory/ViewInventory";
import AddInventory from "./components/Admin/Inventory/AddInventory";
import ManageInventory from "./components/Admin/Inventory/ManageInventory";
import GenerateQrCode from "./components/Admin/QR Code/GenerateQrCode";
import QRScan from "./components/Admin/QR Code/QRScan";
import ManageCategories from "./components/Admin/Categories/ManageCategories";
import StockInOut from "./components/Admin/Stock/StockInOut";
import StockHistory from "./components/Admin/Stock/StockHistory";
import InventoryReport from "./components/Admin/InventoryReport/InventoryReport";
import LowStockReport from "./components/Admin/InventoryReport/LowStockReport";
import ManageStaff from "./components/Admin/Staff/ManageStaff";
import AdminProfile from "./components/Admin/AdminProfile";

// ─── Staff Dashboard ──────────────────────────────────────────
import StaffLayout, { ThemeProvider as StaffThemeProvider } from "./components/Staff/StaffNavbar";
import StaffHome from "./components/Staff/Home";
import StaffViewInventory from "./components/Staff/Inventory/ViewInventory";
import ItemDetails from "./components/Staff/Inventory/ItemDetails";
import StaffQRScan from "./components/Staff/QRCode/QRScan";
import ViewQrCode from "./components/Staff/QRCode/ViewQrCode";
import StockIn from "./components/Staff/Stock/StockIn";
import StockOut from "./components/Staff/Stock/StockOut";
import StaffStockInOut from "./components/Staff/Stock/StockInOut";
import StaffStockHistory from "./components/Staff/Stock/StockHistory";
import LowStockItems from "./components/Staff/LowStock/LowStockItems";
import StaffProfile from "./components/Staff/StaffProfile";
import { useState, useCallback } from "react";
import ManageSuppliers from "./components/Admin/Suppliers/ManageSuppliers";

/*  Layout wrappers */
const AdminWrap = ({ children }: { children: React.ReactNode }) => (
  <AdminLayout>{children}</AdminLayout>
);
const StaffWrap = ({ children }: { children: React.ReactNode }) => (
  <StaffLayout>{children}</StaffLayout>
);
const Auth = ({ children }: { children: React.ReactNode }) => (
  <HomeThemeProvider>{children}</HomeThemeProvider>
);

/* ── Role-aware protected route */
function ProtectedRoute({
  children,
  allowedRole,
  loginPath,
}: {
  children: React.ReactNode;
  allowedRole: string;
  loginPath: string;
}) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to={loginPath} replace />;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== allowedRole) return <Navigate to={loginPath} replace />;
  } catch {
    return <Navigate to={loginPath} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  // token state drives re-render when login/logout happens
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const handleLoginSuccess = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_pending");
    setToken(null);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Always-accessible public routes ───────────────── */}
        <Route path="/" element={<Auth><HomeApp /></Auth>} />
        <Route path="/get-started" element={<Auth><GetStartedPage /></Auth>} />
        <Route path="/info/:slug" element={<Auth><InfoPage /></Auth>} />
        <Route path="/forgot-password" element={<Auth><ForgotPasswordPage /></Auth>} />
        <Route path="/admin/forgot-password" element={<Auth><ForgotPasswordPage /></Auth>} />
        <Route path="/staff/forgot-password" element={<Auth><ForgotPasswordPage /></Auth>} />

        {/* ── Auth pages — redirect to dashboard if already logged in ── */}
        <Route path="/login" element={
          token ? <Navigate to={getRolePath(token)} replace /> :
          <Auth><LoginPage onLoginSuccess={handleLoginSuccess} /></Auth>
        } />
        <Route path="/signup" element={
          token ? <Navigate to={getRolePath(token)} replace /> :
          <Auth><SignupPage onLoginSuccess={handleLoginSuccess} /></Auth>
        } />
        <Route path="/admin/login" element={
          token ? <Navigate to="/admin" replace /> :
          <Auth><AdminLoginPage onLoginSuccess={handleLoginSuccess} /></Auth>
        } />
        <Route path="/staff/login" element={
          token ? <Navigate to="/staff" replace /> :
          <Auth><StaffLoginPage onLoginSuccess={handleLoginSuccess} /></Auth>
        } />

        {/* ── Logout routes ─────────────────────────────────── */}
        <Route path="/admin/logout" element={<LogoutPage onLogout={handleLogout} redirectTo="/admin/login" />} />
        <Route path="/staff/logout" element={<LogoutPage onLogout={handleLogout} redirectTo="/staff/login" />} />
        <Route path="/logout" element={<LogoutPage onLogout={handleLogout} redirectTo="/login" />} />

        {/* ── Admin Dashboard ───────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><AdminHome /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/inventory/view" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><ViewInventory /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/inventory/add" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><AddInventory /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/inventory/manage" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><ManageInventory /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/QRcode/Create" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><GenerateQrCode /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/QRcode/Scan" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><QRScan /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/supplier/create" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><ManageSuppliers /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/categories/manage" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><ManageCategories /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />

        <Route path="/admin/stock/in-out" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><StockInOut /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/stock/history" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><StockHistory /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/reports/inventory" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><InventoryReport /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/reports/low-stock" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><LowStockReport /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/users/manage" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><ManageStaff /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings/profile" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><AdminProfile /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings/password" element={
          <ProtectedRoute allowedRole="ADMIN" loginPath="/admin/login">
            <AdminThemeProvider><AdminWrap><AdminProfile /></AdminWrap></AdminThemeProvider>
          </ProtectedRoute>
        } />

        {/* ── Staff Dashboard ───────────────────────────────── */}
        <Route path="/staff" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StaffHome /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/QRcode/Scan" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StaffQRScan /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/QRcode/View" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><ViewQrCode /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/inventory/view" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StaffViewInventory /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/inventory/details" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><ItemDetails /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/stock/in" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StockIn /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/stock/out" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StockOut /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/stock/in-out" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StaffStockInOut /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/stock/history" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StaffStockHistory /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/lowstock/items" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><LowStockItems /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/settings/profile" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StaffProfile /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />
        <Route path="/staff/settings/password" element={
          <ProtectedRoute allowedRole="STAFF" loginPath="/staff/login">
            <StaffThemeProvider><StaffWrap><StaffProfile /></StaffWrap></StaffThemeProvider>
          </ProtectedRoute>
        } />

        {/* ── 404 fallback ─────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/* ── Helper: decode token to get role-based home path ────────── */
function getRolePath(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "ADMIN" ? "/admin" : "/staff";
  } catch {
    return "/";
  }
}

/* ── Logout page component — clears token then redirects ─────── */
function LogoutPage({
  onLogout,
  redirectTo,
}: {
  onLogout: () => void;
  redirectTo: string;
}) {
  // Clear immediately on render
  onLogout();
  return <Navigate to={redirectTo} replace />;
}
