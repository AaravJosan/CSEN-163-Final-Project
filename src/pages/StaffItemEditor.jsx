import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Tag from "../components/Tag.jsx";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import { productCategories } from "../data/products.js";
import "./StaffInventory.css";

const KINDS = ["Meal", "Drink", "Fruit", "Salad"];
const ALLERGENS = ["dairy", "eggs", "fish", "gluten", "nuts", "peanuts", "sesame", "shellfish", "soy"];
const DISCOUNTS = [
  { id: "none", label: "No discount" },
  { id: "percent", label: "Percent off" },
  { id: "free", label: "Free" },
  { id: "bogo", label: "Buy 1 get 1" },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

// <input type="datetime-local"> wants local time without a zone.
function toLocalInput(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function tonightAtNine() {
  const date = new Date();
  date.setHours(21, 0, 0, 0);
  return toLocalInput(date);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

// Works out which discount an existing item has from its price and tag.
function formFromProduct(product, presetPercent) {
  const regular = product.originalPrice ?? product.discountedPrice;
  let discount = "none";
  let percent = 50;
  if (product.tag.tone === "free" || (product.discountedPrice === 0 && regular > 0)) discount = "free";
  else if (/buy 1 get 1/i.test(product.tag.label)) discount = "bogo";
  else if (product.originalPrice !== null && product.discountedPrice < product.originalPrice) {
    discount = "percent";
    percent = Math.round((1 - product.discountedPrice / product.originalPrice) * 100);
  }
  if (presetPercent) {
    discount = "percent";
    percent = presetPercent;
  }
  return {
    name: product.name,
    category: product.category,
    kind: product.kind,
    description: product.description,
    regularPrice: String(regular),
    discount,
    percent: String(percent),
    stock: String(product.stock),
    bestBy: toLocalInput(product.bestBy),
    allergens: product.allergens,
    noAllergens: product.allergens.length === 0,
  };
}

function emptyForm() {
  return {
  name: "",
  category: productCategories[0],
  kind: KINDS[0],
  description: "",
  regularPrice: "",
  discount: "none",
  percent: "50",
  stock: "1",
  bestBy: tonightAtNine(),
  allergens: [],
  noAllergens: false,
  };
}

function validate(form) {
  const errors = {};
  const price = Number(form.regularPrice);
  const percent = Number(form.percent);
  const stock = Number(form.stock);
  if (!form.name.trim()) errors.name = "Give the item a name.";
  if (form.regularPrice === "" || !Number.isFinite(price) || price < 0)
    errors.regularPrice = "Enter a price of $0 or more, e.g. 6.50.";
  if (form.discount === "percent" && (!Number.isInteger(percent) || percent < 1 || percent > 99))
    errors.percent = "Use a whole number from 1 to 99.";
  if (form.stock === "" || !Number.isInteger(stock) || stock < 0)
    errors.stock = "Enter a whole number of 0 or more.";
  if (!form.bestBy || !Number.isFinite(new Date(form.bestBy).getTime()))
    errors.bestBy = "Choose a best-by date and time.";
  else if (new Date(form.bestBy).getTime() <= Date.now())
    errors.bestBy = "Best-by is in the past, so students won’t see this item.";
  if (form.allergens.length === 0 && !form.noAllergens)
    errors.allergens = "Pick the allergens, or tick “No common allergens”.";
  return errors;
}

// The price and tag students will see for the chosen discount.
function priced(form) {
  const regular = Math.round(Number(form.regularPrice || 0) * 100) / 100;
  switch (form.discount) {
    case "percent": {
      const percent = Number(form.percent) || 0;
      return {
        originalPrice: regular,
        // Work in whole cents so 8.95 at 50% off is 4.48, not 4.47.
        discountedPrice: Math.round((Math.round(regular * 100) * (100 - percent)) / 100) / 100,
        tag: { label: `${percent}% off`, tone: "deal" },
      };
    }
    case "free":
      return { originalPrice: regular, discountedPrice: 0, tag: { label: "Free", tone: "free" } };
    case "bogo":
      return { originalPrice: null, discountedPrice: regular, tag: { label: "Buy 1 get 1", tone: "deal" } };
    default:
      return { originalPrice: null, discountedPrice: regular, tag: { label: "In stock", tone: "neutral" } };
  }
}

export default function StaffItemEditor() {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { inventory, saveProduct } = useCart();
  const existing = itemId ? inventory.find((item) => item.id === itemId) : null;
  const presetPercent = Number(searchParams.get("discount")) || null;
  const [form, setForm] = useState(() => (existing ? formFromProduct(existing, presetPercent) : emptyForm()));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [itemId]);

  if (itemId && !existing) {
    return (
      <div className="empty-state panel">
        <h2>Item not found</h2>
        <p>It may have been removed. Go back to the inventory to pick another item.</p>
        <Link className="button button--primary" to="/staff/inventory">
          Back to inventory
        </Link>
      </div>
    );
  }

  const errors = validate(form);
  const showErrors = touched ? errors : {};
  const preview = priced(form);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleAllergen(allergen) {
    setForm((current) => {
      const allergens = current.allergens.includes(allergen)
        ? current.allergens.filter((item) => item !== allergen)
        : [...current.allergens, allergen];
      return { ...current, allergens, noAllergens: allergens.length ? false : current.noAllergens };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    let id = existing?.id;
    if (!id) {
      const base = slugify(form.name) || "item";
      id = base;
      for (let n = 2; inventory.some((item) => item.id === id); n += 1) id = `${base}-${n}`;
    }

    setSaving(true);
    const result = await saveProduct(
      {
        id,
        name: form.name.trim(),
        category: form.category,
        kind: form.kind,
        description: form.description.trim(),
        stock: Number(form.stock),
        bestBy: new Date(form.bestBy).toISOString(),
        allergens: form.allergens,
        ...preview,
      },
      !existing,
    );
    setSaving(false);
    if (result.success) {
      navigate("/staff/inventory", { state: { saved: result.product.name } });
    } else {
      setSaveError(result.error);
    }
  }

  function fieldProps(field) {
    return {
      "aria-invalid": showErrors[field] ? true : undefined,
      "aria-describedby": showErrors[field] ? `${field}-error` : undefined,
    };
  }

  function fieldError(field) {
    return (
      showErrors[field] && (
        <span className="editor-field-error" id={`${field}-error`}>
          {showErrors[field]}
        </span>
      )
    );
  }

  return (
    <div className="staff-page">
      <div>
        <p className="eyebrow">Staff tools</p>
        <h1 className="page-title">{existing ? `Edit ${existing.name}` : "Add an item"}</h1>
        <p className="staff-intro">
          Set the price, stock, best-by time and deal. Students see changes right away.
        </p>
      </div>

      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      {touched && Object.keys(errors).length > 0 && (
        <p className="form-error" role="alert">
          Fix the highlighted fields to save.
        </p>
      )}

      <form className="panel editor-form" onSubmit={handleSubmit} noValidate>
        <label className="editor-field editor-field--wide">
          <span>Name</span>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} {...fieldProps("name")} />
          {fieldError("name")}
        </label>

        <label className="editor-field">
          <span>Category</span>
          <select value={form.category} onChange={(event) => set("category", event.target.value)}>
            {productCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="editor-field">
          <span>Picture</span>
          <select value={form.kind} onChange={(event) => set("kind", event.target.value)}>
            {KINDS.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </label>

        <label className="editor-field editor-field--wide">
          <span>Description</span>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} />
        </label>

        <label className="editor-field">
          <span>Regular price ($)</span>
          <input
            inputMode="decimal"
            placeholder="6.50"
            value={form.regularPrice}
            onChange={(event) => set("regularPrice", event.target.value)}
            {...fieldProps("regularPrice")}
          />
          {fieldError("regularPrice")}
        </label>

        <label className="editor-field">
          <span>In stock</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(event) => set("stock", event.target.value)}
            {...fieldProps("stock")}
          />
          {fieldError("stock")}
        </label>

        <div className="editor-field editor-field--wide">
          <fieldset>
            <legend>Deal</legend>
            <div className="chip-row" role="radiogroup" aria-label="Deal" style={{ marginTop: 8 }}>
              {DISCOUNTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={form.discount === option.id}
                  className={`chip${form.discount === option.id ? " chip--selected" : ""}`}
                  onClick={() => set("discount", option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {form.discount === "percent" && (
          <label className="editor-field">
            <span>Percent off</span>
            <input
              type="number"
              min="1"
              max="99"
              value={form.percent}
              onChange={(event) => set("percent", event.target.value)}
              {...fieldProps("percent")}
            />
            {fieldError("percent")}
          </label>
        )}

        <label className={`editor-field${form.discount === "percent" ? "" : " editor-field--wide"}`}>
          <span>Best by</span>
          <input
            type="datetime-local"
            value={form.bestBy}
            onChange={(event) => set("bestBy", event.target.value)}
            {...fieldProps("bestBy")}
          />
          <span className="editor-hint">After this time the item is hidden and can’t be ordered.</span>
          {fieldError("bestBy")}
        </label>

        <div className="editor-field editor-field--wide">
          <fieldset aria-describedby={showErrors.allergens ? "allergens-error" : undefined}>
            <legend>Allergens (required)</legend>
            <div className="chip-row" style={{ marginTop: 8 }}>
              {ALLERGENS.map((allergen) => (
                <button
                  key={allergen}
                  type="button"
                  aria-pressed={form.allergens.includes(allergen)}
                  className={`chip${form.allergens.includes(allergen) ? " chip--selected" : ""}`}
                  onClick={() => toggleAllergen(allergen)}
                >
                  {allergen}
                </button>
              ))}
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.noAllergens}
                disabled={form.allergens.length > 0}
                onChange={(event) => set("noAllergens", event.target.checked)}
              />
              No common allergens
            </label>
          </fieldset>
          {fieldError("allergens")}
        </div>

        <div className="editor-field editor-field--wide">
          <span>Students will see</span>
          <div className="editor-preview">
            <Tag tone={preview.tag.tone}>{preview.tag.label}</Tag>
            <strong className="price">{formatPrice(preview.discountedPrice)}</strong>
            {preview.originalPrice !== null && preview.originalPrice !== preview.discountedPrice && (
              <span className="price-was">{formatPrice(preview.originalPrice)}</span>
            )}
            <span className="editor-hint">· {Number(form.stock) || 0} left</span>
          </div>
        </div>

        <div className="editor-actions editor-field--wide">
          <Link className="button button--secondary" to="/staff/inventory">
            Cancel
          </Link>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Saving…" : existing ? "Save changes" : "Add item"}
          </button>
        </div>
      </form>
    </div>
  );
}
