import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
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
  return (
    <>
      <Navbar />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to="/deals" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/deals" element={<BrowseDeals />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/order-confirmation/:orderId?"
            element={<OrderConfirmation />}
          />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/staff/inventory" element={<StaffInventory />} />
          <Route path="/staff/items/new" element={<StaffItemEditor />} />
          <Route path="/staff/items/:itemId/edit" element={<StaffItemEditor />} />
          <Route path="/staff/orders" element={<StaffIncomingOrders />} />
          <Route path="*" element={<Navigate to="/deals" replace />} />
        </Routes>
      </main>
    </>
  );
}
