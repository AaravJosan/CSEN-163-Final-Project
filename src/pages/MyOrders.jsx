import { Link } from "react-router-dom";
import { formatPrice, useCart } from "../context/CartContext.jsx";

function formatOrderDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyOrders() {
  const { orders } = useCart();

  return (
    <section className="orders-page">
      <p className="eyebrow">Your Cellar Deals</p>
      <h1>My Orders</h1>
      {orders.length === 0 ? (
        <div className="orders-empty">
          <h2>No orders yet</h2>
          <p>Your completed orders will be saved here.</p>
          <Link className="confirmation-browse-link" to="/deals">
            Browse Deals
          </Link>
        </div>
      ) : (
        <div className="order-history-list">
          {orders.map((order) => (
            <Link
              className="order-history-card"
              key={order.id}
              to={`/order-confirmation/${order.id}`}
            >
              <div className="order-history-top">
                <strong>{order.code}</strong>
                <span>{formatOrderDate(order.createdAt)}</span>
              </div>
              <div className="order-history-bottom">
                <span>
                  {order.items.reduce((count, item) => count + item.quantity, 0)}{" "}
                  {order.items.length === 1 ? "item" : "items"}
                </span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
