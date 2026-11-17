import { useState } from "react";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import Modal from "./Modal.jsx";

const AMOUNTS = [10, 25, 50, 100];

export default function AddFundsModal({ onClose, message }) {
  const { balance, addFunds } = useCart();
  const [amount, setAmount] = useState(25);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    const result = await addFunds(amount);
    setBusy(false);
    if (result.success) onClose(true);
    else setError(result.error);
  }

  return (
    <Modal
      title="Add funds"
      onClose={() => onClose(false)}
      actions={
        <>
          <button type="button" className="button button--secondary" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button type="button" className="button button--primary" onClick={handleConfirm} disabled={busy}>
            {busy ? "Adding…" : `Add ${formatPrice(amount).replace(".00", "")}`}
          </button>
        </>
      }
    >
      {message && <p className="form-error" role="alert">{message}</p>}
      <p className="modal-text">
        Top up your dining points. Current balance: {formatPrice(balance)}.
      </p>
      <div className="chip-row" role="radiogroup" aria-label="Amount to add">
        {AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={amount === value}
            className={`chip${amount === value ? " chip--selected" : ""}`}
            onClick={() => setAmount(value)}
          >
            ${value}
          </button>
        ))}
      </div>
      <p className="modal-note">Demo only: no real payment is made.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
    </Modal>
  );
}
