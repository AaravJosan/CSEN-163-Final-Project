import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart, formatPrice } from "../context/CartContext.jsx";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const { inventory, cartItems, addToCart } = useCart();
  const [cartMessage, setCartMessage] = useState("");
  const product = inventory.find((item) => item.id === id);

  if (!product) {
    return (
      <section className="product-not-found">
        <p className="eyebrow">Cellar Deals</p>
        <h1>Product Not Found</h1>
        <p>We couldn’t find that item. It may no longer be available.</p>
        <Link className="back-to-browse" to="/deals">
          Back to Browse
        </Link>
      </section>
    );
  }

  const discountPercent = Math.round(
    ((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100,
  );
  const currentQuantity =
    cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
  const canAddToCart = currentQuantity < product.stock;

  function handleAddToCart() {
    const result = addToCart(product.id);
    setCartMessage(
      result.success ? `${product.name} added to your cart.` : result.error,
    );
  }

  return (
    <div className="product-details-page">
      <Link className="back-link" to="/deals">
        <span aria-hidden="true">←</span> Back to Browse
      </Link>

      <article className="product-details">
        <div className="product-details-image-wrap">
          <img
            className="product-details-image"
            src={product.image}
            alt={product.name}
          />
          <span className="product-details-badge">{discountPercent}% off</span>
        </div>

        <div className="product-details-content">
          <p className="product-details-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-details-description">{product.description}</p>

          <div className="product-details-prices">
            <span className="product-details-sale-price">
              {formatPrice(product.discountedPrice)}
            </span>
            <span className="product-details-original-price">
              {formatPrice(product.originalPrice)}
            </span>
            <span className="product-details-savings">
              Save {formatPrice(product.originalPrice - product.discountedPrice)}
            </span>
          </div>

          <p className="discount-reason">
            <span aria-hidden="true">✦</span> Special price because this item is
            approaching its best-by date.
          </p>

          <dl className="product-details-facts">
            <div>
              <dt>Availability</dt>
              <dd>{product.stock} in stock</dd>
            </div>
            <div>
              <dt>Best by</dt>
              <dd>{product.bestBy}</dd>
            </div>
          </dl>

          <button
            className="add-to-cart-button"
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
          >
            Add to Cart
          </button>
          <p className="cart-coming-soon" aria-live="polite">
            {cartMessage ||
              (canAddToCart
                ? `${product.stock - currentQuantity} available to add.`
                : "This item is out of stock.")}
          </p>
        </div>
      </article>
    </div>
  );
}
