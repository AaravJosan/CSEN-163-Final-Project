import { NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const links = [
  { to: "/deals", label: "Browse Deals" },
  { to: "/cart", label: "Cart" },
  { to: "/orders", label: "My Orders" },
  { to: "/profile", label: "Profile" },
  { to: "/staff/inventory", label: "Staff Inventory" },
  { to: "/staff/items/new", label: "Staff Item Editor" },
  { to: "/staff/orders", label: "Staff Incoming Orders" },
  { to: "/login", label: "Login" },
];

export default function Navbar() {
  const { cartCount } = useCart();

  return (
    <header className="site-header">
      <NavLink className="brand" to="/deals">
        Cellar Deals
      </NavLink>
      <nav className="site-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            to={link.to}
          >
            {link.to === "/cart" && cartCount > 0
              ? `${link.label} (${cartCount})`
              : link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
