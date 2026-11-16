import { Link, useParams } from "react-router-dom";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import "./OrderConfirmation.css";

function formatPickupWindow(start, end) {
  const options = { hour: "numeric", minute: "2-digit" };
  const startDate = new Date(start);
  const endDate = new Date(end);
  const date = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return `${date}, ${startDate.toLocaleTimeString("en-US", options)}–${endDate.toLocaleTimeString("en-US", options)}`;
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { orders } = useCart();
  const order = orderId
    ? orders.find((savedOrder) => savedOrder.id === orderId)
    : orders[0];

  if (!order) {
    return (
      <section className="confirmation-page confirmation-empty">
        <p className="eyebrow">Cellar Deals</p>
        <h1>Order Not Found</h1>
        <p>There isn’t a saved order to show here.</p>
        <Link className="confirmation-browse-link" to="/deals">
          Browse Deals
        </Link>
      </section>
    );
  }

  return (
    <section className="confirmation-page">
      <div className="confirmation-success-mark" aria-hidden="true">
        ✓
      </div>
      <p className="eyebrow">Thanks for supporting less food waste</p>
      <h1>Order Confirmed</h1>
      <p className="confirmation-intro">Your order is ready to be picked up during your pickup window.</p>

      <div className="order-code-card">
        <span>Show this code at pickup</span>
        <strong>{order.code}</strong>
      </div>

      <div className="confirmation-info">
        <div>
          <span>Pickup location</span>
          <strong>{order.pickupLocation}</strong>
        </div>
        <div>
          <span>Pickup window</span>
          <strong>{formatPickupWindow(order.pickupStart, order.pickupEnd)}</strong>
        </div>
        <div>
          <span>Total charged</span>
          <strong>{formatPrice(order.total)}</strong>
        </div>
      </div>

      <div className="confirmation-items">
        <h2>Items in your order</h2>
        {order.items.map((item) => (
          <div className="confirmation-item" key={item.id}>
            <img src={item.image} alt="" />
            <span>{item.name} × {item.quantity}</span>
            <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
          </div>
        ))}
      </div>

      <div className="confirmation-links">
        <Link className="confirmation-browse-link" to="/deals">
          Browse More Deals
        </Link>
        <Link className="confirmation-orders-link" to="/orders">
          View My Orders
        </Link>
      </div>
    </section>
  );
}
