import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal.jsx";
import StatusTracker from "../components/StatusTracker.jsx";
import Tag from "../components/Tag.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ACTIVE_STATUSES, formatPrice, useCart } from "../context/CartContext.jsx";
import { capitalize, formatRelativeDay } from "../utils/format.js";
import { formatPickup } from "../utils/pickup.js";
import "./MyOrders.css";

const STATUS_TAGS = {
  preparing: { tone: "neutral", label: "Preparing" },
  ready: { tone: "free", label: "Ready for pickup" },
  "picked-up": { tone: "neutral", label: "Picked up" },
  cancelled: { tone: "neutral", label: "Cancelled · refunded" },
  unclaimed: { tone: "deal", label: "Not picked up · refunded" },
};

function itemSummary(order) {
  const names = order.items
    .map((item) => (item.quantity > 1 ? `${item.quantity} × ${item.name}` : item.name))
    .join(", ");
  const refunded = ["cancelled", "unclaimed"].includes(order.status);
  return `${names} · ${formatPrice(order.total)}${refunded ? " refunded" : ""}`;
}

function OrderCard({ order, onCancel, onBuyAgain }) {
  const active = ACTIVE_STATUSES.includes(order.status);
  const tag = STATUS_TAGS[order.status] ?? STATUS_TAGS.preparing;

  return (
    <article className="panel order-card">
      <div className="order-card-head">
        <h2>Order {order.code}</h2>
        <Tag tone={tag.tone}>{tag.label}</Tag>
        <span className="order-card-when">
          {active
            ? capitalize(`pick up ${formatPickup(order.pickupStart, order.pickupEnd)}`)
            : capitalize(formatRelativeDay(order.createdAt))}
        </span>
      </div>
      {active && <StatusTracker status={order.status} />}
      <div className="order-card-foot">
        <p>{itemSummary(order)}</p>
        <div className="order-card-actions">
          {active ? (
            <>
              {order.status === "preparing" && (
                <button type="button" className="button button--secondary" onClick={onCancel}>
                  Cancel order
                </button>
              )}
              <Link className="button button--primary" to={`/order-confirmation/${order.id}`}>
                Show code
              </Link>
            </>
          ) : (
            <button type="button" className="button button--secondary" onClick={onBuyAgain}>
              Buy again
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders: allOrders, cancelOrder, buyAgain } = useCart();
  // Staff can read every order, but this page only lists your own.
  const orders = allOrders.filter((order) => order.userId === user.id);
  const [view, setView] = useState("current");
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState("");

  const current = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const past = orders.filter((order) => !ACTIVE_STATUSES.includes(order.status));

  async function confirmCancel() {
    const result = await cancelOrder(cancelling.id);
    setError(result.success ? "" : result.error);
    setCancelling(null);
  }

  function handleBuyAgain(order) {
    const result = buyAgain(order);
    if (result.success) navigate("/cart");
    else setError(result.error);
  }

  function renderOrders(list) {
    return list.map((order) => (
      <OrderCard
        key={order.id}
        order={order}
        onCancel={() => setCancelling(order)}
        onBuyAgain={() => handleBuyAgain(order)}
      />
    ));
  }

  return (
    <div className="orders-page">
      <h1 className="page-title">My orders</h1>
      <div className="chip-row" role="group" aria-label="Show orders">
        <button
          type="button"
          className={`chip${view === "current" ? " chip--selected" : ""}`}
          aria-pressed={view === "current"}
          onClick={() => setView("current")}
        >
          Current ({current.length})
        </button>
        <button
          type="button"
          className={`chip${view === "past" ? " chip--selected" : ""}`}
          aria-pressed={view === "past"}
          onClick={() => setView("past")}
        >
          Past
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {orders.length === 0 ? (
        <div className="empty-state panel">
          <h2>No orders yet</h2>
          <p>When you reserve something from the Cellar, it shows up here.</p>
          <Link className="button button--primary" to="/deals">
            Browse deals
          </Link>
        </div>
      ) : (
        <>
          {view === "current" &&
            (current.length > 0 ? (
              renderOrders(current)
            ) : (
              <p className="orders-none">No orders waiting for pickup.</p>
            ))}
          {past.length > 0 && (
            <>
              {view === "current" && <h2 className="orders-subtitle">Past orders</h2>}
              {renderOrders(past)}
            </>
          )}
          {view === "past" && past.length === 0 && (
            <p className="orders-none">No past orders yet.</p>
          )}
        </>
      )}

      {cancelling && (
        <Modal
          title="Cancel this order?"
          onClose={() => setCancelling(null)}
          actions={
            <>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setCancelling(null)}
              >
                Keep order
              </button>
              <button type="button" className="button button--danger" onClick={confirmCancel}>
                Cancel order
              </button>
            </>
          }
        >
          <p className="modal-text">
            Order {cancelling.code} will be cancelled. {formatPrice(cancelling.total)} goes
            back to your dining points and the items go back on sale.
          </p>
        </Modal>
      )}
    </div>
  );
}
