import { useState } from "react";
import { Link } from "react-router-dom";
import userIcon from "../assets/icons/user.svg";
import AddFundsModal from "../components/AddFundsModal.jsx";
import { ACTIVE_STATUSES, formatPrice, useCart } from "../context/CartContext.jsx";
import "./Profile.css";

// Not in the Figma file: built from the same tokens and components.
export default function Profile() {
  const { balance, orders } = useCart();
  const [showFunds, setShowFunds] = useState(false);
  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length;

  return (
    <div className="profile-page">
      <h1 className="page-title">Profile</h1>

      <section className="panel profile-card">
        <span className="profile-avatar">
          <img src={userIcon} alt="" width="22" height="22" />
        </span>
        <div>
          <h2>SCU Student</h2>
          <p>Signed in with SCU SSO</p>
        </div>
        <Link className="button button--secondary profile-signout" to="/login">
          Sign out
        </Link>
      </section>

      <section className="panel profile-points">
        <div>
          <p className="profile-label">Dining points</p>
          <p className="profile-balance">{formatPrice(balance)}</p>
        </div>
        <button type="button" className="button button--primary" onClick={() => setShowFunds(true)}>
          Add funds
        </button>
      </section>

      <section className="profile-links" aria-label="Shortcuts">
        <Link className="panel profile-link" to="/orders">
          <span>My orders</span>
          <span className="profile-link-meta">
            {activeOrders > 0 ? `${activeOrders} waiting for pickup` : "View history"} →
          </span>
        </Link>
        <Link className="panel profile-link" to="/staff/inventory">
          <span>Staff: Inventory</span>
          <span className="profile-link-meta">Stock and expiry →</span>
        </Link>
        <Link className="panel profile-link" to="/staff/orders">
          <span>Staff: Incoming orders</span>
          <span className="profile-link-meta">Update order status →</span>
        </Link>
        <Link className="panel profile-link" to="/staff/items/new">
          <span>Staff: Item editor</span>
          <span className="profile-link-meta">Add an item →</span>
        </Link>
      </section>

      {showFunds && <AddFundsModal onClose={() => setShowFunds(false)} />}
    </div>
  );
}
