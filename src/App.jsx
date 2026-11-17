import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import DataGate from "./components/DataGate.jsx";
import Header from "./components/Header.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import RequireStaff from "./components/RequireStaff.jsx";
import BrowseDeals from "./pages/BrowseDeals.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Profile from "./pages/Profile.jsx";
import StaffIncomingOrders from "./pages/StaffIncomingOrders.jsx";
import StaffInventory from "./pages/StaffInventory.jsx";
import StaffItemEditor from "./pages/StaffItemEditor.jsx";

export default function App() {
  const location = useLocation();

  if (location.pathname === "/login") {
    return <Login />;
  }

  return (
    <RequireAuth>
      <Header />
      <main className="page-content">
        <DataGate>
          <Routes>
            <Route path="/" element={<Navigate to="/deals" replace />} />
            <Route path="/deals" element={<BrowseDeals />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/order-confirmation/:orderId?"
              element={<OrderConfirmation />}
            />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/staff/inventory"
              element={
                <RequireStaff>
                  <StaffInventory />
                </RequireStaff>
              }
            />
            <Route
              path="/staff/items/new"
              element={
                <RequireStaff>
                  <StaffItemEditor />
                </RequireStaff>
              }
            />
            <Route
              path="/staff/items/:itemId/edit"
              element={
                <RequireStaff>
                  <StaffItemEditor />
                </RequireStaff>
              }
            />
            <Route
              path="/staff/orders"
              element={
                <RequireStaff>
                  <StaffIncomingOrders />
                </RequireStaff>
              }
            />
            <Route path="*" element={<Navigate to="/deals" replace />} />
          </Routes>
        </DataGate>
      </main>
    </RequireAuth>
  );
}
