import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import clockIcon from "../assets/icons/clock-orange.svg";
import pinIcon from "../assets/icons/pin.svg";
import FoodTile from "../components/FoodTile.jsx";
import ItemCard from "../components/ItemCard.jsx";
import Stepper from "../components/Stepper.jsx";
import Tag from "../components/Tag.jsx";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import { formatBestBy, isExpired } from "../utils/format.js";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const { inventory, cartItems, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const product = inventory.find((item) => item.id === id);

  useEffect(() => {
    setQuantity(1);
    setMessage(null);
    window.scrollTo({ top: 0 });
  }, [id]);

  if (!product) {
    return (
      <div className="empty-state panel">
        <h2>Item not found</h2>
        <p>It may have sold out or been removed from the Cellar.</p>
        <Link className="button button--primary" to="/deals">
          Back to deals
        </Link>
      </div>
    );
  }

  const inCart = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
  const available = Math.max(product.stock - inCart, 0);
  const expired = isExpired(product.bestBy);
  const canAdd = !expired && available > 0;
  const savings =
    product.originalPrice && product.originalPrice > 0
      ? Math.round((1 - product.discountedPrice / product.originalPrice) * 100)
      : 0;
  const moreDeals = inventory
    .filter((item) => item.id !== product.id && item.stock > 0 && !isExpired(item.bestBy))
    .sort((a, b) => new Date(a.bestBy) - new Date(b.bestBy))
    .slice(0, 4);

  function handleAdd() {
    const result = addToCart(product.id, quantity);
    setMessage(
      result.success
        ? { tone: "success", text: `Added ${quantity} to your cart.` }
        : { tone: "error", text: result.error },
    );
    if (result.success) setQuantity(1);
  }

  return (
    <div className="product-page">
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link className="text-link" to="/deals">
          ← Back to deals
        </Link>
        <span>
          · Deals / {product.category} / {product.name}
        </span>
      </nav>

      <section className="product-main">
        <FoodTile kind={product.kind} className="product-tile" label={product.name} />

        <div className="product-info">
          <div className="tag-row">
            <Tag tone={product.tag.tone}>{product.tag.label}</Tag>
            <Tag tone="neutral">
              {product.stock === 0 ? "Sold out" : `Only ${product.stock} left`}
            </Tag>
          </div>

          <h1 className="product-title">{product.name}</h1>

          <div className="product-price-row">
            <span className="price product-price">{formatPrice(product.discountedPrice)}</span>
            {product.originalPrice !== null && (
              <span className="price-was product-was">{formatPrice(product.originalPrice)}</span>
            )}
            {savings > 0 && <Tag tone="free">Save {savings}%</Tag>}
          </div>

          <p className="product-best-by">
            <img src={clockIcon} alt="" width="18" height="18" />
            {expired ? "Expired" : formatBestBy(product.bestBy)}
          </p>

          <hr className="divider" />

          <p className="product-description">{product.description}</p>

          {product.allergens.length > 0 && (
            <div className="tag-row" aria-label="Allergens">
              {product.allergens.map((allergen) => (
                <Tag tone="neutral" key={allergen}>
                  Contains {allergen}
                </Tag>
              ))}
            </div>
          )}

          <div className="product-actions">
            <Stepper
              value={quantity}
              max={Math.max(available, 1)}
              onChange={setQuantity}
              label={`Quantity of ${product.name}`}
            />
            <button
              type="button"
              className="button button--primary product-add"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              {expired
                ? "No longer available"
                : available === 0
                  ? inCart > 0
                    ? "All in your cart"
                    : "Sold out"
                  : `Add to cart · ${formatPrice(product.discountedPrice * quantity)}`}
            </button>
          </div>

          {message && (
            <p
              className={message.tone === "error" ? "form-error" : "product-success"}
              role={message.tone === "error" ? "alert" : "status"}
            >
              {message.text}{" "}
              {message.tone === "success" && (
                <Link className="text-link" to="/cart">
                  View cart
                </Link>
              )}
            </p>
          )}

          <div className="pickup-note">
            <img src={pinIcon} alt="" width="22" height="22" />
            <div>
              <p className="pickup-note-title">Pickup at the Cellar counter</p>
              <p className="pickup-note-text">Benson Center · show your order code</p>
            </div>
          </div>
        </div>
      </section>

      {moreDeals.length > 0 && (
        <section className="product-more" aria-labelledby="more-deals-title">
          <h2 id="more-deals-title">More deals expiring soon</h2>
          <div className="card-grid">
            {moreDeals.map((item) => (
              <ItemCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
