import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import cartIcon from "../assets/icons/cart.svg";
import leafIcon from "../assets/icons/logo-leaf.svg";
import searchIcon from "../assets/icons/search.svg";
import userIcon from "../assets/icons/user.svg";
import { useAuth } from "../context/AuthContext.jsx";
import { ACTIVE_STATUSES, formatPrice, useCart } from "../context/CartContext.jsx";

export default function Header() {
  const { balance, cartCount, orders } = useCart();
  const { user, avatarUrl, displayName } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const onDeals = location.pathname === "/deals";
  const query = onDeals ? searchParams.get("q") ?? "" : "";
  const [text, setText] = useState(query);
  const searchTimer = useRef(null);
  const activeOrders = orders.filter(
    (order) => order.userId === user?.id && ACTIVE_STATUSES.includes(order.status),
  ).length;

  // Keep the box in sync when the URL changes (Back, links, leaving the page).
  useEffect(() => {
    setText(query);
  }, [query]);

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  // Waits for a pause in typing so the page doesn't jump on every key.
  function handleSearch(value) {
    setText(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      const params = new URLSearchParams(onDeals ? searchParams : undefined);
      if (value.trim()) params.set("q", value);
      else params.delete("q");
      const search = params.toString();
      navigate(`/deals${search ? `?${search}` : ""}`, { replace: onDeals });
    }, 250);
  }

  // Cart badge pops briefly whenever the count changes.
  const [bump, setBump] = useState(false);
  const lastCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount === lastCount.current) return undefined;
    const grew = cartCount > lastCount.current;
    lastCount.current = cartCount;
    if (!grew) return undefined;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 450);
    return () => window.clearTimeout(timer);
  }, [cartCount]);

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
            value={text}
            placeholder="Search sandwiches, drinks, snacks…"
            onChange={(event) => handleSearch(event.target.value)}
          />
        </label>

        <Link
          className={`header-link${location.pathname === "/orders" ? " header-link--active" : ""}`}
          to="/orders"
          aria-label={`My orders${activeOrders ? `, ${activeOrders} waiting for pickup` : ""}`}
        >
          Orders
          {activeOrders > 0 && <span className="header-link-badge">{activeOrders}</span>}
        </Link>

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
          {cartCount > 0 && <span className={`cart-badge${bump ? " cart-badge--bump" : ""}`}>{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}
