import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import warningIcon from "../assets/icons/warning.svg";
import AddFundsModal from "../components/AddFundsModal.jsx";
import FoodTile from "../components/FoodTile.jsx";
import Stepper from "../components/Stepper.jsx";
import Tag from "../components/Tag.jsx";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import { formatTime } from "../utils/format.js";
import { getPickupWindows } from "../utils/pickup.js";
import "./Cart.css";

function formatExpiredNotice(names) {
  if (names.length === 1) return `${names[0]} expired and was removed from your cart.`;
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)} expired and were removed from your cart.`;
}

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartCount,
    cartTotal,
    cartSubtotal,
    balance,
    storageError,
    expiredNotice,
    dismissExpiredNotice,
    setCartQuantity,
    removeFromCart,
    checkout,
  } = useCart();
  const [pickupWindows] = useState(getPickupWindows);
  const [pickupId, setPickupId] = useState(
    () => (pickupWindows.find((window) => window.id === "0-17") ?? pickupWindows[0])?.id,
  );
  const [error, setError] = useState("");
  const [fundsModal, setFundsModal] = useState(null);
  const [placing, setPlacing] = useState(false);

  const savings = Math.round((cartSubtotal - cartTotal) * 100) / 100;
  const balanceAfter = balance - cartTotal;

  async function handleCheckout() {
    setPlacing(true);
    const result = await checkout(pickupWindows.find((window) => window.id === pickupId));
    setPlacing(false);
    if (result.success) {
      navigate(`/order-confirmation/${result.order.id}`);
      return;
    }
    if (result.insufficientFunds) {
      setError("");
      setFundsModal({ message: result.error });
      return;
    }
    setError(result.error);
  }

  function handleResult(result) {
    setError(result.success ? "" : result.error);
  }

  return (
    <div className="cart-page">
      <div className="cart-heading">
        <h1 className="page-title">Your cart</h1>
        <span>
          {cartCount} {cartCount === 1 ? "item" : "items"}
        </span>
      </div>

      {expiredNotice.length > 0 && (
        <div className="alert" role="status">
          <img src={warningIcon} alt="" width="20" height="20" />
          <p>{formatExpiredNotice(expiredNotice)}</p>
          <button type="button" onClick={dismissExpiredNotice}>
            Dismiss
          </button>
        </div>
      )}

      {storageError && <p className="form-error" role="alert">{storageError}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {cartItems.length === 0 ? (
        <div className="empty-state panel">
          <h2>Your cart is empty</h2>
          <p>Browse today’s deals and grab something before it’s gone.</p>
          <Link className="button button--primary" to="/deals">
            Browse deals
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="panel cart-items" aria-label="Cart items">
            {cartItems.map(({ product, productId, quantity }) => (
              <article className="cart-row" key={productId}>
                <Link to={`/products/${productId}`} className="cart-row-tile-link">
                  <FoodTile kind={product.kind} className="cart-row-tile" />
                  <span className="visually-hidden">{product.name}</span>
                </Link>
                <div className="cart-row-details">
                  <h2>
                    <Link to={`/products/${productId}`}>{product.name}</Link>
                  </h2>
                  <div className="cart-row-meta">
                    <Tag tone={product.tag.tone}>{product.tag.label}</Tag>
                    <span>Pick up by {formatTime(product.bestBy)}</span>
                  </div>
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => handleResult(removeFromCart(productId))}
                  >
                    Remove
                  </button>
                </div>
                <Stepper
                  value={quantity}
                  min={1}
                  max={product.stock}
                  onChange={(value) => handleResult(setCartQuantity(productId, value))}
                  label={`Quantity of ${product.name}`}
                />
                <div className="cart-row-price">
                  <span className="price">{formatPrice(product.discountedPrice * quantity)}</span>
                  {product.originalPrice !== null && (
                    <span className="price-was">
                      {formatPrice(product.originalPrice * quantity)}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>

          <aside className="panel order-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatPrice(cartSubtotal)}</strong>
            </div>
            {savings > 0 && (
              <div className="summary-row">
                <span>Cellar Deals savings</span>
                <strong className="summary-savings">−{formatPrice(savings)}</strong>
              </div>
            )}
            <hr className="divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <label className="pickup-field">
              <span>Pickup window</span>
              <span className="pickup-select">
                <select value={pickupId} onChange={(event) => setPickupId(event.target.value)}>
                  {pickupWindows.map((window) => (
                    <option key={window.id} value={window.id}>
                      {window.label}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true">▾</span>
              </span>
            </label>

            <button
              type="button"
              className="button button--primary button--block"
              onClick={handleCheckout}
              disabled={placing}
            >
              {placing ? "Placing order…" : `Buy now · ${formatPrice(cartTotal)}`}
            </button>

            <div className="summary-row summary-note">
              <span>Paid with dining points</span>
              <strong>
                {balanceAfter >= 0
                  ? `Balance after: ${formatPrice(balanceAfter)}`
                  : `Short by ${formatPrice(-balanceAfter)}`}
              </strong>
            </div>

            <div className="low-balance">
              <p>Running low on points?</p>
              <button
                type="button"
                className="button button--secondary button--block"
                onClick={() => setFundsModal({})}
              >
                Add funds
              </button>
            </div>
          </aside>
        </div>
      )}

      {fundsModal && (
        <AddFundsModal message={fundsModal.message} onClose={() => setFundsModal(null)} />
      )}
    </div>
  );
}
