import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import plusIcon from "../assets/icons/plus-white.svg";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import { saveBrowseScrollPosition } from "../utils/browseScroll.js";
import FoodTile from "./FoodTile.jsx";
import Tag from "./Tag.jsx";
import "./ItemCard.css";

export default function ItemCard({ product }) {
  const { addToCart, cartItems } = useCart();
  const [feedback, setFeedback] = useState(null);
  const timer = useRef(null);
  const inCart = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
  const soldOut = product.stock === 0;
  const allInCart = !soldOut && inCart >= product.stock;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleAdd() {
    const result = addToCart(product.id);
    setFeedback(result.success ? { ok: true, text: "Added" } : { ok: false, text: result.error });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <article className="item-card">
      <Link
        className="item-card-link"
        to={`/products/${product.id}`}
        onClick={() => saveBrowseScrollPosition(window.scrollY)}
      >
        <FoodTile kind={product.kind} className="item-card-tile" />
        <span className="visually-hidden">{product.name}</span>
      </Link>
      <div className="item-card-body">
        <div className="item-card-row">
          <Tag tone={soldOut ? "neutral" : product.tag.tone}>
            {soldOut ? "Sold out" : product.tag.label}
          </Tag>
          {!soldOut && (
            <span className="item-card-stock">
              {allInCart ? "All in your cart" : `${product.stock} left`}
            </span>
          )}
        </div>
        <h3 className="item-card-name">
          <Link to={`/products/${product.id}`} onClick={() => saveBrowseScrollPosition(window.scrollY)}>
            {product.name}
          </Link>
        </h3>
        <div className="item-card-row item-card-price-row">
          <span className="price">{formatPrice(product.discountedPrice)}</span>
          {product.originalPrice !== null && (
            <span className="price-was">{formatPrice(product.originalPrice)}</span>
          )}
          <button
            type="button"
            className="add-button"
            aria-label={
              soldOut
                ? `${product.name} is sold out`
                : allInCart
                  ? `All ${product.name} are in your cart`
                  : `Add ${product.name} to cart`
            }
            title={soldOut ? "Sold out" : allInCart ? "All in your cart" : "Add to cart"}
            disabled={soldOut || allInCart}
            onClick={handleAdd}
          >
            <img src={plusIcon} alt="" width="18" height="18" />
          </button>
        </div>
        <p
          className={`item-card-feedback${feedback && !feedback.ok ? " item-card-feedback--error" : ""}`}
          role="status"
        >
          {feedback?.text}
          {feedback?.ok && (
            <>
              {" · "}
              <Link to="/cart">View cart</Link>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
