import { Link, useParams } from "react-router-dom";
import checkIcon from "../assets/icons/check-large.svg";
import clockIcon from "../assets/icons/clock.svg";
import StatusTracker from "../components/StatusTracker.jsx";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import { capitalize } from "../utils/format.js";
import { formatPickup } from "../utils/pickup.js";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { orders } = useCart();
  const order = orderId
    ? orders.find((savedOrder) => savedOrder.id === orderId)
    : orders[0];

  if (!order) {
    return (
      <div className="empty-state panel">
        <h2>Order not found</h2>
        <p>There isn’t a saved order to show here.</p>
        <Link className="button button--primary" to="/deals">
          Back to deals
        </Link>
      </div>
    );
  }

  return (
    <div className="confirmation-wrap">
      <section className="panel confirmation-card">
        <div className="confirmation-check" aria-hidden="true">
          <img src={checkIcon} alt="" width="36" height="36" />
        </div>
        <h1 className="confirmation-title">Order placed!</h1>
        <p className="confirmation-subtitle">Show this code at the Cellar counter</p>
        <p className="order-code" aria-label={`Order code ${order.code}`}>
          {order.code}
        </p>

        {["preparing", "ready", "picked-up"].includes(order.status) && (
          <StatusTracker status={order.status} />
        )}

        <div className="confirmation-pickup">
          <p className="confirmation-pickup-time">
            <img src={clockIcon} alt="" width="18" height="18" />
            {capitalize(`pick up ${formatPickup(order.pickupStart, order.pickupEnd)}`)}
          </p>
          <p className="confirmation-pickup-note">
            Unclaimed orders go back on sale and your points are refunded.
          </p>
        </div>

        <div className="confirmation-items">
          {order.items.map((item) => (
            <div className="confirmation-line" key={item.id}>
              <span>
                {item.quantity} × {item.name}
              </span>
              <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
            </div>
          ))}
          <hr className="divider" />
          <div className="confirmation-line confirmation-total">
            <span>Paid with dining points</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link className="button button--primary" to="/orders">
            View my orders
          </Link>
          <Link className="button button--secondary" to="/deals">
            Back to deals
          </Link>
        </div>
      </section>
    </div>
  );
}
