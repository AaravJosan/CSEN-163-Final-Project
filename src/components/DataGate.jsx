import { useCart } from "../context/CartContext.jsx";

// Holds the page until products and orders have loaded from Supabase.
export default function DataGate({ children }) {
  const { loading, loadError, retryLoad } = useCart();

  if (loading) {
    return (
      <p className="page-status" role="status">
        Loading deals…
      </p>
    );
  }
  if (loadError) {
    return (
      <div className="empty-state panel" role="alert">
        <h2>Couldn’t reach the Cellar</h2>
        <p>{loadError}</p>
        <button type="button" className="button button--primary" onClick={retryLoad}>
          Try again
        </button>
      </div>
    );
  }
  return children;
}
