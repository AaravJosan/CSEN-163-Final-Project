import { useLayoutEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { productCategories } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";
import { takeBrowseScrollPosition } from "../utils/browseScroll.js";
import "./BrowseDeals.css";

export default function BrowseDeals() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const { inventory } = useCart();

  useLayoutEffect(() => {
    const scrollY = takeBrowseScrollPosition();
    if (scrollY === null) return undefined;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      });
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return inventory.filter((product) => {
      const matchesCategory =
        category === "All categories" || product.category === category;
      const matchesSearch =
        !searchTerm ||
        `${product.name} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(searchTerm);

      return matchesCategory && matchesSearch;
    });
  }, [category, inventory, search]);

  const expiringProducts = filteredProducts.filter((product) => product.expiringSoon);
  const otherProducts = filteredProducts.filter((product) => !product.expiringSoon);

  return (
    <div className="browse-page">
      <section className="deals-intro">
        <p className="eyebrow">Good food. Better prices.</p>
        <h1>Cellar Deals</h1>
        <p>
          Find your next favorite and help good food find a home. Every price is
          shown in dollars.
        </p>
      </section>

      <section className="deals-controls" aria-label="Find deals">
        <label className="search-field">
          <span className="visually-hidden">Search deals</span>
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search food and drinks"
          />
        </label>
        <label className="category-field">
          <span className="visually-hidden">Filter by category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {productCategories.map((productCategory) => (
              <option key={productCategory} value={productCategory}>
                {productCategory}
              </option>
            ))}
          </select>
        </label>
      </section>

      <p className="results-count" aria-live="polite">
        {filteredProducts.length} {filteredProducts.length === 1 ? "deal" : "deals"}{" "}
        available
      </p>

      {expiringProducts.length > 0 && (
        <section className="deals-section" aria-labelledby="expiring-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Grab them while they last</p>
              <h2 id="expiring-title">Expiring Soon</h2>
            </div>
            <span className="section-count">{expiringProducts.length} deals</span>
          </div>
          <div className="product-grid">
            {expiringProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {otherProducts.length > 0 && (
        <section className="deals-section" aria-labelledby="all-deals-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">More good finds</p>
              <h2 id="all-deals-title">
                {expiringProducts.length > 0 ? "All Deals" : "Browse Deals"}
              </h2>
            </div>
            <span className="section-count">{otherProducts.length} deals</span>
          </div>
          <div className="product-grid">
            {otherProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {filteredProducts.length === 0 && (
        <div className="empty-results">
          <h2>No deals found</h2>
          <p>Try a different search or choose another category.</p>
        </div>
      )}
    </div>
  );
}
