

import { Routes, Route, Navigate } from "react-router-dom";

/* AUTH CONTEXT */
import { AuthProvider } from "./contexts/AuthContext";

/* LAYOUT */
import MainLayout from "./Layout/MainLayouts";
import MainLayoutCustomer from "./pages/Customer/Layout/MainLayoutCustomer";
import MainLayoutCustomerLogin from "./Layout/customer/MainLayoutsCust";

/* AUTH */
import Login from "./pages/Auth/Login/Login";
import Register from "./pages/Auth/Register/Register";
import Forgot from "./pages/Auth/Login/Forgot";
import AuthCallback from "./pages/Auth/AuthCallback";

/* ERROR */
import Error from "./pages/Auth/Error";
import Unauthorized from "./pages/Auth/Unauthorized";

/* PROFILE */
import Profile from "./pages/Auth/profile/Profile";

/* ROUTE PROTECTOR */
import CustomerRoute from "./routes/CustomerRoute";
import AdminRoute from "./routes/AdminRoute";
import CashierRoute from "./routes/CashierRoute";

/* ========================= */
/* ADMIN PAGES */
/* ========================= */

import DashboardAdmin from "./pages/Admin/Dashboard";

import OrderManagementDetail from "./pages/Admin/order-management/Ordermanagementdetail";
import AdminOrders from "./pages/Admin/order-management/OrderManagementMain";
import ProductManagement from "./pages/Admin/product-management/ProductManagement";
import InventoryManagementMain from "./pages/Admin/inventory-management/InventoryManagementMain";
import KeuanganPage from "./pages/Admin/financial-management/ManajemenKeuangan";
import OrderPayment from "./pages/Admin/order-management/OrderPayment";

import AdminChatList from "./pages/Admin/chat-management/AdminChatList";
import AdminChatRoom from "./pages/Admin/chat-management/AdminChatRoom";

/* ========================= */
/* CUSTOMER PUBLIC */
/* ========================= */

import HomePage from "./pages/Customer/CustomerPage/Home";
import CustomerPage from "./pages/Customer/Dashboard";
import KatalogPage from "./pages/Customer/CustomerPage/KatalogPage";
import TentangKamiPage from "./pages/Customer/CustomerPage/TentangKami";

/* ========================= */
/* CUSTOMER LOGIN */
/* ========================= */

import CartPage from "./pages/Customer/Pages/Dashboard/order/CartPage";
import CheckoutPage from "./pages/Customer/Pages/Dashboard/order/CheckoutPage";
import MyOrders from "./pages/Customer/Pages/Dashboard/order/MyOrders";
import OrderDetail from "./pages/Customer/Pages/Dashboard/order/OrderDetail";
import CustomerProducts from "./pages/Customer/Pages/Dashboard/order/CustomerProducts";
import CustDashboard from "./pages/Customer/Dashboard";
import CustomerChatPage from "./pages/Customer/chat/CustomerChatPage";

/* ========================= */
/* CASHIER */
/* ========================= */

import CashierLayout from "./pages/Cashier/CashierLayout";
import CashierDashboard from "./pages/Cashier/CashierDashboard";
import CashierOrders from "./pages/Cashier/CashierOrders";
import CashierClosing from "./pages/Cashier/CashierClosing";
import POSSystem from "./pages/Cashier/POSsystem";

function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ====================================================== */}
        {/* DEFAULT REDIRECT */}
        {/* ====================================================== */}

        <Route
          path="/dashboard"
          element={<Navigate to="/dashboard/admin" />}
        />

        {/* ====================================================== */}
        {/* AUTH */}
        {/* ====================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot"
          element={<Forgot />}
        />

        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        {/* ====================================================== */}
        {/* ADMIN */}
        {/* ====================================================== */}

        <Route
          element={
            <AdminRoute>
              <MainLayout />
            </AdminRoute>
          }
        >

          <Route
            path="/dashboard/admin"
            element={<DashboardAdmin />}
          />

          {/* ORDER */}

          <Route
            path="/management-order"
            element={<AdminOrders />}
          />

          <Route
            path="/management-order/:id"
            element={<OrderManagementDetail />}
          />

          {/* PRODUCT */}

          <Route
            path="/management-product"
            element={<ProductManagement />}
          />

          <Route
            path="/management-inventory"
            element={<InventoryManagementMain />}
          />

          {/* FINANCIAL */}

          <Route
            path="/management-financial"
            element={<KeuanganPage />}
          />

          <Route
            path="/management-payment"
            element={<OrderPayment />}
          />

          {/* PROFILE */}

          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* CHAT */}

          <Route
            path="/admin/chat"
            element={<AdminChatList />}
          />

          <Route
            path="/admin/chat/:roomId"
            element={<AdminChatRoom />}
          />

        </Route>

        {/* ====================================================== */}
        {/* CUSTOMER LOGIN */}
        {/* ====================================================== */}

        <Route
          element={
            <CustomerRoute>
              <MainLayoutCustomerLogin />
            </CustomerRoute>
          }
        >

          <Route
            path="/customer/dashboard"
            element={<CustDashboard />}
          />

          <Route
            path="/customer/cart"
            element={<CartPage />}
          />

          <Route
            path="/customer/cart/checkout"
            element={<CheckoutPage />}
          />

          <Route
            path="/customer/my-orders"
            element={<MyOrders />}
          />

          <Route
            path="/customer/my-orders/:id"
            element={<OrderDetail />}
          />

          <Route
            path="/customer/products"
            element={<CustomerProducts />}
          />

          <Route
            path="/customer/chat"
            element={<CustomerChatPage />}
          />

          <Route
            path="/customer/profile"
            element={<Profile />}
          />

        </Route>

        {/* ====================================================== */}
        {/* CASHIER */}
        {/* ====================================================== */}

        <Route
          path="/cashier"
          element={
            <CashierRoute>
              <CashierLayout />
            </CashierRoute>
          }
        >

          <Route
            path="dashboard/cashier"
            element={<CashierDashboard />}
          />

          <Route
            path="POS"
            element={<POSSystem />}
          />

          <Route
            path="orders"
            element={<CashierOrders />}
          />

          <Route
            path="closing"
            element={<CashierClosing />}
          />

        </Route>

        {/* ====================================================== */}
        {/* PUBLIC CUSTOMER */}
        {/* ====================================================== */}

        <Route element={<MainLayoutCustomer />}>

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/doubleyoucake"
            element={<CustomerPage />}
          />

          <Route
            path="/katalog"
            element={<KatalogPage />}
          />

          <Route
            path="/tentang-kami"
            element={<TentangKamiPage />}
          />

        </Route>

        {/* ====================================================== */}
        {/* ERROR */}
        {/* ====================================================== */}

        <Route
          path="/401"
          element={<Unauthorized />}
        />

        <Route
          path="*"
          element={<Error />}
        />

      </Routes>
    </AuthProvider>
  );
}

export default App;

