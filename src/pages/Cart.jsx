import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartTotal,
    balance,
    storageError,
    setCartQuantity,
    removeFromCart,
    addFunds,
    checkout,
  } = useCart();
  const [checkoutError, setCheckoutError] = useState("");
  const [needsFunds, setNeedsFunds] = useState(false);

  function handleCheckout() {
    const result = checkout();
    if (result.success) {
      navigate(`/order-confirmation/${result.order.id}`);
      return;
    }

    setCheckoutError(result.error);
    setNeedsFunds(Boolean(result.insufficientFunds));
  }

  function handleAddFunds() {
    const result = addFunds();
    if (result.success) {
      setCheckoutError("");
      setNeedsFunds(false);
    } else {
      setCheckoutError(result.error);
    }
  }

  function handleQuantityChange(productId, quantity) {
    const result = setCartQuantity(productId, quantity);
    if (!result.success) setCheckoutError(result.error);
    else setCheckoutError("");
    setNeedsFunds(false);
  }

  function handleRemoveFromCart(productId) {
    const result = removeFromCart(productId);
    if (!result.success) setCheckoutError(result.error);
    else setCheckoutError("");
    setNeedsFunds(false);
  }

  return (
    <section className="cart-page">
      <p className="eyebrow">Your Cellar Deals</p>
      <h1>Your Cart</h1>

      <div className="cart-balance">
        <span>Dining points balance</span>
        <strong>{formatPrice(balance)}</strong>
      </div>

      {storageError && <p className="cart-error" role="alert">{storageError}</p>}
      {checkoutError && <p className="cart-error" role="alert">{checkoutError}</p>}

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Browse today’s deals and find something delicious.</p>
          <Link className="cart-primary-link" to="/deals">
            Browse Deals
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items" aria-label="Cart items">
            {cartItems.map(({ product, productId, quantity }) => (
              <article className="cart-item" key={productId}>
                <img src={product.image} alt={product.name} />
                <div className="cart-item-details">
                  <h2>{product.name}</h2>
                  <p>{formatPrice(product.discountedPrice)} each</p>
                  <p className="cart-item-stock">{product.stock} currently in stock</p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                    <button
                      type="button"
                      aria-label={`Decrease ${product.name} quantity`}
                      onClick={() => handleQuantityChange(productId, quantity - 1)}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${product.name} quantity`}
                      disabled={quantity >= product.stock}
                      onClick={() => handleQuantityChange(productId, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <strong>{formatPrice(product.discountedPrice * quantity)}</strong>
                  <button
                    className="remove-item-button"
                    type="button"
                    onClick={() => handleRemoveFromCart(productId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order Summary</h2>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>
            <div className="cart-summary-row cart-summary-balance">
              <span>Balance after purchase</span>
              <strong>{formatPrice(balance - cartTotal)}</strong>
            </div>
            {needsFunds && (
              <button
                className="add-funds-button"
                type="button"
                onClick={handleAddFunds}
              >
                Add $500 Dining Points
              </button>
            )}
            <button
              className="cart-checkout-button"
              type="button"
              onClick={handleCheckout}
            >
              Buy Now
            </button>
            <p className="cart-prototype-note">
              Prototype checkout uses simulated dining points.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
