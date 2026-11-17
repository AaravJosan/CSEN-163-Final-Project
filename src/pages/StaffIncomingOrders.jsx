import { useState } from "react";
import Tag from "../components/Tag.jsx";
import { ACTIVE_STATUSES, formatPrice, useCart } from "../context/CartContext.jsx";
import { capitalize } from "../utils/format.js";
import { formatPickup } from "../utils/pickup.js";
import "./StaffInventory.css";

const NEXT_ACTION = { preparing: "Mark ready", ready: "Mark picked up" };
const STATUS_TAGS = {
  preparing: { tone: "neutral", label: "Preparing" },
  ready: { tone: "free", label: "Ready" },
};

export default function StaffIncomingOrders() {
  const { orders, advanceOrderStatus } = useCart();
  const [lookup, setLookup] = useState("");
  const [error, setError] = useState("");

  const code = lookup.trim().toUpperCase();
  const incoming = orders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .filter((order) => !code || order.code.includes(code))
    .sort((a, b) => new Date(a.pickupStart) - new Date(b.pickupStart));

  function handleAdvance(orderId) {
    const result = advanceOrderStatus(orderId);
    setError(result.success ? "" : result.error);
  }

  return (
    <div className="staff-page">
      <div className="staff-orders-head">
        <div>
          <p className="eyebrow">Staff tools</p>
          <h1 className="page-title">Incoming orders</h1>
        </div>
        <label className="staff-lookup">
          <span className="visually-hidden">Look up by order code</span>
          <input
            type="search"
            value={lookup}
            placeholder="Look up code, e.g. CD-4821"
            onChange={(event) => setLookup(event.target.value)}
          />
        </label>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {incoming.length === 0 ? (
        <div className="empty-state panel">
          <h2>{code ? "No matching orders" : "No incoming orders"}</h2>
          <p>Student orders waiting for pickup appear here.</p>
        </div>
      ) : (
        <div className="staff-order-list">
          {incoming.map((order) => (
            <article className="panel staff-order" key={order.id}>
              <div className="staff-order-head">
                <h2>{order.code}</h2>
                <Tag tone={STATUS_TAGS[order.status].tone}>{STATUS_TAGS[order.status].label}</Tag>
                <span className="staff-order-when">
                  {capitalize(formatPickup(order.pickupStart, order.pickupEnd))}
                </span>
              </div>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>
              <div className="staff-order-foot">
                <strong>{formatPrice(order.total)}</strong>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => handleAdvance(order.id)}
                >
                  {NEXT_ACTION[order.status]}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
