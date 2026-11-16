import { createContext, useContext, useState } from "react";
import products from "../data/products.js";

const STORAGE_KEY = "cellar-deals-state";
const CartContext = createContext(null);

function createInitialState() {
  return {
    inventory: products,
    cart: [],
    balance: 2000,
    orders: [],
  };
}

function readState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return createInitialState();

    const parsedState = JSON.parse(savedState);
    const savedInventory = Array.isArray(parsedState.inventory)
      ? parsedState.inventory
      : [];
    const inventory = products.map((product) => {
      const savedProduct = savedInventory.find((item) => item.id === product.id);
      return savedProduct && Number.isInteger(savedProduct.stock) && savedProduct.stock >= 0
        ? { ...product, stock: savedProduct.stock }
        : product;
    });
    const inventoryIds = new Set(inventory.map((product) => product.id));
    const cart = Array.isArray(parsedState.cart)
      ? parsedState.cart.filter(
          (item) =>
            inventoryIds.has(item.productId) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        )
      : [];

    return {
      inventory,
      cart,
      balance:
        Number.isFinite(parsedState.balance) && parsedState.balance >= 0
          ? parsedState.balance
          : 2000,
      orders: Array.isArray(parsedState.orders) ? parsedState.orders : [],
    };
  } catch (error) {
    console.error("Could not load saved Cellar Deals data:", error);
    return createInitialState();
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function isPastBestBy(bestBy) {
  const dateParts = /^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/.exec(bestBy);
  if (!dateParts) return true;
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].indexOf(dateParts[1]);
  if (month < 0) return true;

  const day = Number(dateParts[2]);
  const year = Number(dateParts[3]);
  const date = new Date(year, month, day, 23, 59, 59, 999);
  if (date.getMonth() !== month || date.getDate() !== day) return true;
  return Date.now() > date.getTime();
}

function createOrderCode() {
  return `CD-${crypto.randomUUID().toUpperCase()}`;
}

export function CartProvider({ children }) {
  const [state, setState] = useState(readState);
  const [storageError, setStorageError] = useState("");

  function saveState(nextState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      setState(nextState);
      setStorageError("");
      return true;
    } catch (error) {
      console.error("Could not save Cellar Deals data:", error);
      setStorageError("Your changes could not be saved. Check your browser storage and try again.");
      return false;
    }
  }

  function addToCart(productId) {
    const product = state.inventory.find((item) => item.id === productId);
    if (!product) return { success: false, error: "This product is no longer available." };

    const cartItem = state.cart.find((item) => item.productId === productId);
    const quantity = cartItem?.quantity ?? 0;
    if (quantity >= product.stock) {
      return {
        success: false,
        error: `Only ${product.stock} ${product.name} available.`,
      };
    }

    const cart = cartItem
      ? state.cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      : [...state.cart, { productId, quantity: 1 }];

    return saveState({ ...state, cart })
      ? { success: true }
      : { success: false, error: "Could not save your cart. Please try again." };
  }

  function setCartQuantity(productId, quantity) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    const product = state.inventory.find((item) => item.id === productId);
    if (!product || !Number.isInteger(quantity) || quantity > product.stock) {
      return {
        success: false,
        error: `Only ${product?.stock ?? 0} ${product?.name ?? "items"} available.`,
      };
    }

    const cart = state.cart.map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    );
    return saveState({ ...state, cart })
      ? { success: true }
      : { success: false, error: "Could not save your cart. Please try again." };
  }

  function removeFromCart(productId) {
    const cart = state.cart.filter((item) => item.productId !== productId);
    return saveState({ ...state, cart })
      ? { success: true }
      : { success: false, error: "Could not save your cart. Please try again." };
  }

  function addFunds(amount = 500) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Enter a valid amount to add." };
    }
    return saveState({ ...state, balance: state.balance + amount })
      ? { success: true }
      : { success: false, error: "Could not update your balance. Please try again." };
  }

  function checkout() {
    if (state.cart.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    const items = state.cart.map((cartItem) => {
      const product = state.inventory.find((item) => item.id === cartItem.productId);
      return product ? { ...product, quantity: cartItem.quantity } : null;
    });

    if (items.some((item) => !item)) {
      return { success: false, error: "A cart item is no longer available. Remove it and try again." };
    }

    const unavailableItem = items.find((item) => item.quantity > item.stock);
    if (unavailableItem) {
      return {
        success: false,
        error: `Only ${unavailableItem.stock} ${unavailableItem.name} available. Update your cart to continue.`,
      };
    }

    const expiredItem = items.find((item) => isPastBestBy(item.bestBy));
    if (expiredItem) {
      return {
        success: false,
        error: `${expiredItem.name} passed its best-by date and cannot be purchased.`,
      };
    }

    const total = Math.round(
      items.reduce(
        (sum, item) => sum + item.discountedPrice * item.quantity,
        0,
      ) * 100,
    ) / 100;
    if (total > state.balance) {
      return {
        success: false,
        insufficientFunds: true,
        error: `You need ${formatPrice(total - state.balance)} more dining points to complete this order.`,
      };
    }

    const createdAt = new Date();
    const order = {
      id: crypto.randomUUID(),
      code: createOrderCode(),
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        unitPrice: item.discountedPrice,
      })),
      total,
      pickupLocation: "The Cellar",
      pickupStart: new Date(createdAt.getTime() + 15 * 60 * 1000).toISOString(),
      pickupEnd: new Date(createdAt.getTime() + 60 * 60 * 1000).toISOString(),
      createdAt: createdAt.toISOString(),
    };
    const purchasedQuantities = new Map(
      items.map((item) => [item.id, item.quantity]),
    );
    const inventory = state.inventory.map((product) => ({
      ...product,
      stock: product.stock - (purchasedQuantities.get(product.id) ?? 0),
    }));
    const nextState = {
      ...state,
      inventory,
      cart: [],
      balance: Math.round((state.balance - total) * 100) / 100,
      orders: [order, ...state.orders],
    };

    return saveState(nextState)
      ? { success: true, order }
      : { success: false, error: "Could not save your order. Please try again." };
  }

  const cartItems = state.cart.map((cartItem) => ({
    ...cartItem,
    product: state.inventory.find((product) => product.id === cartItem.productId),
  }));
  const cartCount = state.cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) =>
      total + (item.product?.discountedPrice ?? 0) * item.quantity,
    0,
  );
  const roundedCartTotal = Math.round(cartTotal * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        inventory: state.inventory,
        cartItems,
        cartCount,
        cartTotal: roundedCartTotal,
        balance: state.balance,
        orders: state.orders,
        storageError,
        addToCart,
        setCartQuantity,
        removeFromCart,
        addFunds,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}

export { formatPrice };
