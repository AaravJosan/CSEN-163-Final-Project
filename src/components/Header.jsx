import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import cartIcon from "../assets/icons/cart.svg";
import leafIcon from "../assets/icons/logo-leaf.svg";
import searchIcon from "../assets/icons/search.svg";
import userIcon from "../assets/icons/user.svg";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPrice, useCart } from "../context/CartContext.jsx";

export default function Header() {
  const { balance, cartCount } = useCart();
  const { avatarUrl, displayName } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = location.pathname === "/deals" ? searchParams.get("q") ?? "" : "";

  function handleSearch(value) {
    const params = value ? `?q=${encodeURIComponent(value)}` : "";
    navigate(`/deals${params}`, { replace: location.pathname === "/deals" });
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="logo" to="/deals">
          <span className="logo-mark">
            <img src={leafIcon} alt="" width="20" height="20" />
          </span>
          <span className="logo-text">Cellar Deals</span>
        </Link>

        <label className="header-search">
          <img src={searchIcon} alt="" width="18" height="18" />
          <span className="visually-hidden">Search the Cellar</span>
          <input
            type="search"
            value={query}
            placeholder="Search sandwiches, drinks, snacks…"
            onChange={(event) => handleSearch(event.target.value)}
          />
        </label>

        <Link className="points-pill" to="/profile" aria-label={`Dining points: ${formatPrice(balance)}`}>
          <span className="points-pill-label">Points</span>
          <span className="points-pill-value">{formatPrice(balance)}</span>
        </Link>

        <Link
          className={`icon-button icon-button--dark${avatarUrl && !avatarFailed ? " icon-button--avatar" : ""}`}
          to="/profile"
          aria-label={`Account: ${displayName}`}
        >
          {avatarUrl && !avatarFailed ? (
            <img
              className="header-avatar"
              src={avatarUrl}
              alt=""
              width="42"
              height="42"
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <img src={userIcon} alt="" width="22" height="22" />
          )}
        </Link>

        <Link
          className="icon-button icon-button--outline"
          to="/cart"
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
        >
          <img src={cartIcon} alt="" width="22" height="22" />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}
