import { Link } from "react-router-dom";
import { saveBrowseScrollPosition } from "../utils/browseScroll.js";
import "./ProductCard.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export default function ProductCard({ product }) {
  function rememberBrowsePosition() {
    saveBrowseScrollPosition(window.scrollY);
  }

  return (
    <article className={`product-card${product.expiringSoon ? " expiring" : ""}`}>
      <Link
        className="product-card-image-link"
        to={`/products/${product.id}`}
        aria-label={`View ${product.name}`}
        onClick={rememberBrowsePosition}
      >
        <img
          className="product-card-image"
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      {product.expiringSoon && <span className="deal-badge">Expiring soon</span>}
      <div className="product-card-content">
        <p className="product-category">{product.category}</p>
        <h3>
          <Link to={`/products/${product.id}`} onClick={rememberBrowsePosition}>
            {product.name}
          </Link>
        </h3>
        <div className="product-prices" aria-label="Discounted price">
          <span className="discounted-price">{formatPrice(product.discountedPrice)}</span>
          <span className="original-price">{formatPrice(product.originalPrice)}</span>
        </div>
        <div className="product-meta">
          <span>{product.stock} in stock</span>
          <span>Best by {product.bestBy}</span>
        </div>
      </div>
    </article>
  );
}
