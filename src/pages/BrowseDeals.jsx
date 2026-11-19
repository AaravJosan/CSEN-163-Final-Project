import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FoodTile from "../components/FoodTile.jsx";
import ItemCard from "../components/ItemCard.jsx";
import { productCategories } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";
import { takeBrowseScrollPosition } from "../utils/browseScroll.js";
import { isExpired } from "../utils/format.js";
import "./BrowseDeals.css";

const PAGE_SIZE = 8;
const DAY_MS = 24 * 60 * 60 * 1000;
const FILTERS = ["All", ...productCategories];
const SORTS = {
  expiring: {
    label: "Expiring soonest",
    compare: (a, b) => new Date(a.bestBy) - new Date(b.bestBy) || a.stock - b.stock,
  },
  "price-low": {
    label: "Price: low to high",
    compare: (a, b) => a.discountedPrice - b.discountedPrice,
  },
  "price-high": {
    label: "Price: high to low",
    compare: (a, b) => b.discountedPrice - a.discountedPrice,
  },
  name: { label: "Name: A to Z", compare: (a, b) => a.name.localeCompare(b.name) },
};

function matchesFilter(product, filter, underFive) {
  if (underFive && product.discountedPrice >= 5) return false;
  return filter === "All" || product.category === filter;
}

export default function BrowseDeals() {
  const { inventory } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = (searchParams.get("q") ?? "").trim().toLowerCase();
  // Filter and sort live in the URL so Back from a product restores the same view.
  const filter = FILTERS.includes(searchParams.get("cat")) ? searchParams.get("cat") : "All";
  const underFive = searchParams.get("price") === "under5";
  const sort = SORTS[searchParams.get("sort")] ? searchParams.get("sort") : "expiring";

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  }

  function setSort(value) {
    updateParams({ sort: value === "expiring" ? null : value });
  }
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const allItemsRef = useRef(null);

  useLayoutEffect(() => {
    const scrollY = takeBrowseScrollPosition();
    if (scrollY === null) return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    });
  }, []);

  const available = useMemo(
    () => inventory.filter((product) => !isExpired(product.bestBy)),
    [inventory],
  );

  const expiringToday = available
    .filter(
      (product) =>
        product.stock > 0 && new Date(product.bestBy).getTime() - Date.now() < DAY_MS,
    )
    .slice(0, 4);

  const allItems = useMemo(
    () =>
      available
        .filter((product) => matchesFilter(product, filter, underFive))
        .filter(
          (product) =>
            !search ||
            `${product.name} ${product.category} ${product.description}`
              .toLowerCase()
              .includes(search),
        )
        .sort(SORTS[sort].compare),
    [available, filter, underFive, search, sort],
  );

  function scrollToAllItems() {
    allItemsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseFilter(value) {
    updateParams({ cat: value === "All" ? null : value });
    setVisibleCount(PAGE_SIZE);
  }

  function toggleUnderFive() {
    updateParams({ price: underFive ? null : "under5" });
    setVisibleCount(PAGE_SIZE);
  }

  function showAllDeals() {
    updateParams({ cat: null, price: null, sort: null });
    setVisibleCount(PAGE_SIZE);
    scrollToAllItems();
  }

  return (
    <div className="browse-page">
      {!search && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-eyebrow">Today at the Cellar</span>
              <h1 className="hero-title">Grab it before it’s gone.</h1>
              <p className="hero-text">
                Items close to expiry, marked down or free. Reserve now and pick
                up at the counter.
              </p>
              <button
                type="button"
                className="button button--secondary hero-button"
                onClick={showAllDeals}
              >
                See today’s deals
              </button>
            </div>
            <div className="hero-tiles" aria-hidden="true">
              <FoodTile kind="Salad" className="hero-tile" />
              <FoodTile kind="Meal" className="hero-tile" />
              <FoodTile kind="Drink" className="hero-tile" />
            </div>
          </section>

          {expiringToday.length > 0 && (
            <section className="browse-section" aria-labelledby="expiring-title">
              <div className="section-heading">
                <div>
                  <h2 id="expiring-title">Expiring today</h2>
                  <p>Marked down before they’re gone</p>
                </div>
                <button
                  type="button"
                  className="text-link"
                  onClick={showAllDeals}
                >
                  View all →
                </button>
              </div>
              <div className="card-grid">
                {expiringToday.map((product) => (
                  <ItemCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section
        className="browse-section all-items"
        aria-labelledby="all-items-title"
        ref={allItemsRef}
      >
        <div className="section-heading">
          <div>
            <h2 id="all-items-title">
              {search ? `Results for “${searchParams.get("q").trim()}”` : "All items"}
            </h2>
            <p>
              {search
                ? `${allItems.length} ${allItems.length === 1 ? "item" : "items"} found`
                : "Everything in the Cellar right now"}
            </p>
          </div>
        </div>

        <div className="browse-controls">
          <div className="chip-row">
            <div className="chip-row" role="group" aria-label="Category">
              {FILTERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chip${filter === value ? " chip--selected" : ""}`}
                  aria-pressed={filter === value}
                  onClick={() => chooseFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <span className="chip-divider" aria-hidden="true" />
            <button
              type="button"
              className={`chip${underFive ? " chip--selected" : ""}`}
              aria-pressed={underFive}
              onClick={toggleUnderFive}
            >
              Under $5
            </button>
          </div>
          <label className="sort-select">
            <span className="sort-label">Sort:</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              {Object.entries(SORTS).map(([value, option]) => (
                <option key={value} value={value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="sort-caret" aria-hidden="true">
              ▾
            </span>
          </label>
        </div>

        {allItems.length > 0 ? (
          <div className="card-grid">
            {allItems.slice(0, visibleCount).map((product) => (
              <ItemCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state panel">
            <h2>Nothing matches yet</h2>
            <p>Try a different search or filter. New items come in every morning.</p>
          </div>
        )}

        {visibleCount < allItems.length && (
          <div className="load-more">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load more items
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
