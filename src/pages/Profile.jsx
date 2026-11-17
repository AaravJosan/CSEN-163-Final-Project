import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import userIcon from "../assets/icons/user.svg";
import AddFundsModal from "../components/AddFundsModal.jsx";
import Tag from "../components/Tag.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ACTIVE_STATUSES, formatPrice, useCart } from "../context/CartContext.jsx";
import "./Profile.css";

// Not in the Figma file: built from the same tokens and components.
export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, displayName, avatarUrl, signOut } = useAuth();
  const { balance, orders } = useCart();
  const [showFunds, setShowFunds] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const activeOrders = orders.filter(
    (order) => order.userId === user?.id && ACTIVE_STATUSES.includes(order.status),
  ).length;

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="profile-page">
      <h1 className="page-title">Profile</h1>

      <section className="panel profile-card">
        <span className="profile-avatar">
          {avatarUrl && !avatarFailed ? (
            <img
              className="profile-avatar-photo"
              src={avatarUrl}
              alt=""
              width="56"
              height="56"
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <img src={userIcon} alt="" width="22" height="22" />
          )}
        </span>
        <div className="profile-identity">
          <h2>{displayName}</h2>
          <p>{user?.email}</p>
          <Tag tone={profile?.isStaff ? "deal" : "free"}>
            {profile?.isStaff ? "Cellar staff" : "SCU student"}
          </Tag>
        </div>
        <button type="button" className="button button--secondary profile-signout" onClick={handleSignOut}>
          Sign out
        </button>
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
        {profile?.isStaff && (
          <>
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
          </>
        )}
      </section>

      {showFunds && <AddFundsModal onClose={() => setShowFunds(false)} />}
    </div>
  );
}
