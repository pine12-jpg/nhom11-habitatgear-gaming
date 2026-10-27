import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import GearTest from "./pages/GearTest";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Compare from "./pages/Compare";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Account from "./pages/Account";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import TradeIn from "./pages/TradeIn";
import Showrooms from "./pages/Showrooms";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import StaticPage from "./pages/StaticPage";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminNews from "./pages/admin/AdminNews";
import AdminTradeIn from "./pages/admin/AdminTradeIn";
import AdminLogs from "./pages/admin/AdminLogs";

export default function App() {
  return (
    <Routes>
      {/* ---------- Khu vực quản trị (không dùng Header/Footer khách hàng) ---------- */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/san-pham" element={<AdminRoute><AdminProducts /></AdminRoute>} />
      <Route path="/admin/hang" element={<AdminRoute><AdminBrands /></AdminRoute>} />
      <Route path="/admin/don-hang" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/khach-hang" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
      <Route path="/admin/tin-tuc" element={<AdminRoute><AdminNews /></AdminRoute>} />
      <Route path="/admin/thu-cu" element={<AdminRoute><AdminTradeIn /></AdminRoute>} />
      <Route path="/admin/nhat-ky" element={<AdminRoute><AdminLogs /></AdminRoute>} />

      {/* ---------- Khu vực khách hàng ---------- */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/san-pham" element={<Layout><ProductList /></Layout>} />
      <Route path="/san-pham/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/so-sanh" element={<Layout><Compare /></Layout>} />
      <Route path="/gio-hang" element={<Layout><Cart /></Layout>} />
      <Route path="/thanh-toan" element={<Layout><ProtectedRoute><Checkout /></ProtectedRoute></Layout>} />
      <Route path="/dang-nhap" element={<Layout><Login /></Layout>} />
      <Route path="/dang-ky" element={<Layout><Register /></Layout>} />
      <Route path="/quen-mat-khau" element={<Layout><ForgotPassword /></Layout>} />
      <Route path="/tai-khoan" element={<Layout><ProtectedRoute><Account /></ProtectedRoute></Layout>} />
      <Route path="/don-hang" element={<Layout><ProtectedRoute><OrderHistory /></ProtectedRoute></Layout>} />
      <Route path="/don-hang/:id" element={<Layout><ProtectedRoute><OrderDetail /></ProtectedRoute></Layout>} />
      <Route path="/thu-cu-doi-moi" element={<Layout><ProtectedRoute><TradeIn /></ProtectedRoute></Layout>} />
      <Route path="/kiem-tra-gear" element={<Layout><GearTest /></Layout>} />
      <Route path="/showroom" element={<Layout><Showrooms /></Layout>} />
      <Route path="/tin-tuc" element={<Layout><News /></Layout>} />
      <Route path="/tin-tuc/:id" element={<Layout><NewsDetail /></Layout>} />
      <Route path="/:slug" element={<Layout><StaticPage /></Layout>} />
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}
