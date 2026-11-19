import { Link, useLocation } from "react-router-dom";
import FoodTile from "../components/FoodTile.jsx";
import Tag from "../components/Tag.jsx";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import { formatBestBy, isExpired } from "../utils/format.js";
import "./StaffInventory.css";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function StaffInventory() {
  const { inventory } = useCart();
  const location = useLocation();
  const saved = location.state?.saved;
  const sorted = [...inventory].sort((a, b) => new Date(a.bestBy) - new Date(b.bestBy));

  return (
    <div className="staff-page">
      <div className="staff-head-row">
        <div>
          <p className="eyebrow">Staff tools</p>
          <h1 className="page-title">Inventory</h1>
          <p className="staff-intro">
            Stock and expiry for every item. Click an item to change its price, stock or deal.
          </p>
        </div>
        <Link className="button button--primary" to="/staff/items/new">
          Add item
        </Link>
      </div>
      {saved && (
        <p className="staff-saved" role="status">
          Saved {saved}. Students can see the change now.
        </p>
      )}
      <div className="panel staff-list">
        {sorted.map((product) => {
          const expired = isExpired(product.bestBy);
          const nearExpiry = !expired && new Date(product.bestBy) - Date.now() < DAY_MS;
          return (
            <article className="staff-row" key={product.id}>
              <FoodTile kind={product.kind} className="staff-tile" />
              <div className="staff-row-main">
                <h2>
                  <Link to={`/staff/items/${product.id}/edit`}>{product.name}</Link>
                </h2>
                <p>
                  {product.category} · {expired ? "Expired" : formatBestBy(product.bestBy)}
                </p>
              </div>
              {expired ? (
                <Tag tone="deal">Expired</Tag>
              ) : nearExpiry ? (
                <Tag tone="deal">Near expiry</Tag>
              ) : null}
              <div className="staff-stock">
                <strong>{product.stock}</strong>
                <span>in stock</span>
              </div>
              <strong className="staff-price">{formatPrice(product.discountedPrice)}</strong>
              <div className="staff-row-actions">
                {nearExpiry && product.stock > 0 && product.discountedPrice > 0 && product.tag.tone !== "deal" && (
                  <Link
                    className="button button--secondary"
                    to={`/staff/items/${product.id}/edit?discount=50`}
                  >
                    Mark down
                  </Link>
                )}
                <Link
                  className="button button--secondary"
                  to={`/staff/items/${product.id}/edit`}
                  aria-label={`Edit ${product.name}`}
                >
                  Edit
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
