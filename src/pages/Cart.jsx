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
  const [chosenPickupId, setPickupId] = useState(null);
  // Windows that start after an item's best-by would mean picking up expired food.
  const earliestBestBy = cartItems.length
    ? Math.min(...cartItems.map((item) => new Date(item.product.bestBy).getTime()))
    : Infinity;
  const firstExpiring = cartItems.find(
    (item) => new Date(item.product.bestBy).getTime() === earliestBestBy,
  );
  const windowFits = (window) => new Date(window.start).getTime() < earliestBestBy;
  const fittingWindows = pickupWindows.filter(windowFits);
  // Until the student picks one: the evening window if everything is still good
  // then, otherwise the first window that ends before the earliest best-by.
  const endsInTime = fittingWindows.filter(
    (window) => new Date(window.end).getTime() <= earliestBestBy,
  );
  const defaultWindow =
    endsInTime.find((window) => window.id === "0-17") ?? endsInTime[0] ?? fittingWindows[0];
  const pickupWindow =
    fittingWindows.find((window) => window.id === chosenPickupId) ??
    defaultWindow ??
    pickupWindows.find((window) => window.id === chosenPickupId) ??
    pickupWindows[0];
  const pickupId = pickupWindow?.id;
  const pickupRunsLate = pickupWindow && new Date(pickupWindow.end).getTime() > earliestBestBy;
  const [error, setError] = useState("");
  const [fundsModal, setFundsModal] = useState(null);
  const [placing, setPlacing] = useState(false);

  const savings = Math.round((cartSubtotal - cartTotal) * 100) / 100;
  const balanceAfter = balance - cartTotal;
  const shortfall = Math.max(Math.round(-balanceAfter * 100) / 100, 0);

  async function handleCheckout() {
    setPlacing(true);
    const result = await checkout(pickupWindow);
    setPlacing(false);
    if (result.success) {
      navigate(`/order-confirmation/${result.order.id}`);
      return;
    }
    if (result.insufficientFunds) {
      setError("");
      setFundsModal({ message: result.error, resume: true });
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
                    <option key={window.id} value={window.id} disabled={!windowFits(window)}>
                      {window.label}
                      {windowFits(window) ? "" : " (after best-by)"}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true">▾</span>
              </span>
            </label>
            {firstExpiring && (fittingWindows.length === 0 || pickupRunsLate) && (
              <p className="pickup-warning" role="status">
                {fittingWindows.length === 0
                  ? `${firstExpiring.product.name} is past its best-by before any pickup window. Remove it to continue.`
                  : `Pick up before ${formatTime(firstExpiring.product.bestBy)}: that’s when ${firstExpiring.product.name} expires.`}
              </p>
            )}

            <button
              type="button"
              className="button button--primary button--block"
              onClick={handleCheckout}
              disabled={placing || fittingWindows.length === 0}
            >
              {placing ? "Placing order…" : `Buy now · ${formatPrice(cartTotal)}`}
            </button>

            <div className="summary-row summary-note">
              <span>Paid with dining points</span>
              <strong>
                {balanceAfter >= 0
                  ? `Balance after: ${formatPrice(balanceAfter)}`
                  : `Short by ${formatPrice(shortfall)}`}
              </strong>
            </div>

            <div className="low-balance">
              <p>{shortfall > 0 ? `Add at least ${formatPrice(shortfall)} to place this order.` : "Running low on points?"}</p>
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
        <AddFundsModal
          message={fundsModal.message}
          shortfall={shortfall}
          resume={fundsModal.resume}
          onClose={(added) => {
            const resume = fundsModal.resume;
            setFundsModal(null);
            if (added && resume) handleCheckout();
          }}
        />
      )}
    </div>
  );
}
