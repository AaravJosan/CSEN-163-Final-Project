import { useEffect, useRef, useState } from "react";
import Tag from "../components/Tag.jsx";
import { ACTIVE_STATUSES, formatPrice, useCart } from "../context/CartContext.jsx";
import { capitalize } from "../utils/format.js";
import { formatPickup } from "../utils/pickup.js";
import "./StaffInventory.css";

const NEXT_ACTION = { preparing: "Mark ready", ready: "Mark picked up" };
const DONE_LABEL = { preparing: "marked ready", ready: "marked picked up" };
const STATUS_TAGS = {
  preparing: { tone: "neutral", label: "Preparing" },
  ready: { tone: "free", label: "Ready" },
};
const UNDO_MS = 5000;

export default function StaffIncomingOrders() {
  const { orders, advanceOrderStatus } = useCart();
  const [lookup, setLookup] = useState("");
  const [error, setError] = useState("");
  // A status change waits a few seconds before it is saved, so a mis-tap can be undone.
  const [pending, setPending] = useState(null);
  const pendingRef = useRef(null);
  pendingRef.current = pending;

  async function commit(change) {
    window.clearTimeout(change.timer);
    setPending((current) => (current?.orderId === change.orderId ? null : current));
    const result = await advanceOrderStatus(change.orderId);
    setError(result.success ? "" : result.error);
  }

  // Leaving the page saves whatever is still waiting.
  useEffect(
    () => () => {
      if (pendingRef.current) {
        window.clearTimeout(pendingRef.current.timer);
        advanceOrderStatus(pendingRef.current.orderId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function handleAdvance(order) {
    if (pending) commit(pending);
    const change = { orderId: order.id, code: order.code, label: DONE_LABEL[order.status] };
    change.timer = window.setTimeout(() => commit(change), UNDO_MS);
    setPending(change);
  }

  function undo() {
    window.clearTimeout(pending.timer);
    setPending(null);
  }

  const code = lookup.trim().toUpperCase();
  const incoming = orders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .filter((order) => !code || order.code.includes(code))
    .sort((a, b) => new Date(a.pickupStart) - new Date(b.pickupStart));

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
          {incoming.map((order) => {
            const waiting = pending?.orderId === order.id;
            return (
              <article className={`panel staff-order${waiting ? " staff-order--pending" : ""}`} key={order.id}>
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
                  {waiting ? (
                    <button type="button" className="button button--secondary" onClick={undo}>
                      Undo
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => handleAdvance(order)}
                    >
                      {NEXT_ACTION[order.status]}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pending && (
        <div className="toast" role="status">
          <span>
            Order {pending.code} {pending.label}.
          </span>
          <button type="button" onClick={undo}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
