import { formatPrice, useCart } from "../context/CartContext.jsx";
import "./StaffInventory.css";

export default function StaffInventory() {
  const { inventory } = useCart();

  return (
    <section className="staff-inventory-page">
      <p className="eyebrow">Staff tools</p>
      <h1>Staff Inventory</h1>
      <p className="staff-page-intro">
        Live sample inventory. Stock updates when student orders are placed.
      </p>
      <div className="staff-inventory-list">
        {inventory.map((product) => (
          <article className="staff-inventory-item" key={product.id}>
            <img src={product.image} alt="" />
            <div>
              <h2>{product.name}</h2>
              <p>{product.category} · Best by {product.bestBy}</p>
            </div>
            <div className="staff-inventory-stock">
              <strong>{product.stock}</strong>
              <span>in stock</span>
            </div>
            <strong className="staff-inventory-price">
              {formatPrice(product.discountedPrice)}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}
