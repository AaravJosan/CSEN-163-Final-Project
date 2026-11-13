import { formatPrice, useCart } from "../context/CartContext.jsx";
import "./StaffInventory.css";

export default function StaffIncomingOrders() {
  const { orders } = useCart();

  return (
    <section className="staff-orders-page">
      <p className="eyebrow">Staff tools</p>
      <h1>Staff Incoming Orders</h1>
      {orders.length === 0 ? (
        <div className="staff-orders-empty">
          <h2>No incoming orders</h2>
          <p>Completed student orders will appear here.</p>
        </div>
      ) : (
        <div className="staff-order-list">
          {orders.map((order) => (
            <article className="staff-order-card" key={order.id}>
              <div className="staff-order-heading">
                <div>
                  <span className="staff-order-label">Pickup code</span>
                  <h2>{order.code}</h2>
                </div>
                <strong>{formatPrice(order.total)}</strong>
              </div>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
              <p>Pickup at {order.pickupLocation}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
