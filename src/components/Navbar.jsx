import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { supabase } from "../services/supabaseClient.js";

const links = [
  { to: "/deals", label: "Browse Deals" },
  { to: "/cart", label: "Cart" },
  { to: "/orders", label: "My Orders" },
  { to: "/profile", label: "Profile" },
  { to: "/staff/inventory", label: "Staff Inventory" },
  { to: "/staff/items/new", label: "Staff Item Editor" },
  { to: "/staff/orders", label: "Staff Incoming Orders" },
];

export default function Navbar() {
  const { cartCount } = useCart();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Initial user state
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    // 2. Real-time auth listener (handles login, logout, and token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.identities?.[0]?.identity_data?.picture;

  return (
    <header className="site-header">
      <NavLink className="brand" to="/deals">
        Cellar Deals
      </NavLink>
      <nav className="site-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            to={link.to}
          >
            {link.to === "/cart" && cartCount > 0
              ? `${link.label} (${cartCount})`
              : link.label}
          </NavLink>
        ))}

        {user ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginLeft: "12px",
              paddingLeft: "12px",
              borderLeft: "1px solid var(--color-border, #e5e7eb)",
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : null}
            {!avatarUrl && (
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#861f41",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <span
              style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              {displayName}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                fontSize: "0.82rem",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm, 6px)",
                border: "1px solid var(--color-border, #d1d5db)",
                background: "transparent",
                color: "var(--color-text-muted, #666)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <NavLink
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            to="/login"
          >
            Login
          </NavLink>
        )}
      </nav>
    </header>
  );
}
