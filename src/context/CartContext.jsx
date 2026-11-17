import { createContext, useContext, useState } from "react";
import products from "../data/products.js";
import { formatPrice, isExpired } from "../utils/format.js";

const STORAGE_KEY = "cellar-deals-state-v2";
const STARTING_BALANCE = 42.5;
const CartContext = createContext(null);

export const ACTIVE_STATUSES = ["preparing", "ready"];

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function createInitialState() {
  return {
    inventory: products,
    cart: [],
    balance: STARTING_BALANCE,
    orders: [],
  };
}

function loadSavedState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return createInitialState();

    const parsedState = JSON.parse(savedState);
    const savedInventory = Array.isArray(parsedState.inventory)
      ? parsedState.inventory
      : [];
    const inventory = products.map((product) => {
      const savedProduct = savedInventory.find((item) => item.id === product.id);
      return savedProduct &&
        Number.isInteger(savedProduct.stock) &&
        savedProduct.stock >= 0
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
          : STARTING_BALANCE,
      orders: Array.isArray(parsedState.orders) ? parsedState.orders : [],
    };
  } catch (error) {
    console.error("Could not load saved Cellar Deals data:", error);
    return createInitialState();
  }
}

function restock(inventory, items) {
  const quantities = new Map(items.map((item) => [item.id, item.quantity]));
  return inventory.map((product) => ({
    ...product,
    stock: product.stock + (quantities.get(product.id) ?? 0),
  }));
}

// Applies the order rules that depend on time passing:
// - expired items are removed from the cart
// - orders not picked up by the end of their window go back on sale and are refunded
function applyTimeRules(state) {
  const removedNames = [];
  const cart = state.cart.filter((cartItem) => {
    const product = state.inventory.find((item) => item.id === cartItem.productId);
    if (product && isExpired(product.bestBy)) {
      removedNames.push(product.name);
      return false;
    }
    return true;
  });

  let { inventory, balance } = state;
  const orders = state.orders.map((order) => {
    if (!ACTIVE_STATUSES.includes(order.status)) return order;
    if (Date.now() <= new Date(order.pickupEnd).getTime()) return order;
    inventory = restock(inventory, order.items);
    balance = roundMoney(balance + order.total);
    return { ...order, status: "unclaimed" };
  });

  return { state: { ...state, cart, inventory, balance, orders }, removedNames };
}

function readInitialState() {
  return applyTimeRules(loadSavedState());
}

function createOrderCode() {
  return `CD-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function CartProvider({ children }) {
  const [initial] = useState(readInitialState);
  const [state, setState] = useState(initial.state);
  const [expiredNotice, setExpiredNotice] = useState(initial.removedNames);
  const [storageError, setStorageError] = useState("");

  function saveState(nextState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      setState(nextState);
      setStorageError("");
      return true;
    } catch (error) {
      console.error("Could not save Cellar Deals data:", error);
      setStorageError(
        "Your changes could not be saved. Check your browser storage and try again.",
      );
      return false;
    }
  }

  function saveResult(nextState, failureMessage) {
    return saveState(nextState)
      ? { success: true }
      : { success: false, error: failureMessage };
  }

  function addToCart(productId, amount = 1) {
    const product = state.inventory.find((item) => item.id === productId);
    if (!product) return { success: false, error: "This item is no longer available." };
    if (isExpired(product.bestBy)) {
      return { success: false, error: `${product.name} has expired.` };
    }

    const cartItem = state.cart.find((item) => item.productId === productId);
    const quantity = (cartItem?.quantity ?? 0) + amount;
    if (quantity > product.stock) {
      return {
        success: false,
        error:
          product.stock === 0
            ? `${product.name} is sold out.`
            : `Only ${product.stock} ${product.name} left.`,
      };
    }

    const cart = cartItem
      ? state.cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        )
      : [...state.cart, { productId, quantity }];

    return saveResult({ ...state, cart }, "Could not save your cart. Please try again.");
  }

  function setCartQuantity(productId, quantity) {
    if (quantity <= 0) return removeFromCart(productId);

    const product = state.inventory.find((item) => item.id === productId);
    if (!product || !Number.isInteger(quantity) || quantity > product.stock) {
      return {
        success: false,
        error: `Only ${product?.stock ?? 0} ${product?.name ?? "items"} left.`,
      };
    }

    const cart = state.cart.map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    );
    return saveResult({ ...state, cart }, "Could not save your cart. Please try again.");
  }

  function removeFromCart(productId) {
    const cart = state.cart.filter((item) => item.productId !== productId);
    return saveResult({ ...state, cart }, "Could not save your cart. Please try again.");
  }

  function addFunds(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Choose an amount to add." };
    }
    return saveResult(
      { ...state, balance: roundMoney(state.balance + amount) },
      "Could not update your balance. Please try again.",
    );
  }

  function checkout(pickupWindow) {
    if (state.cart.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }
    if (!pickupWindow) {
      return { success: false, error: "Choose a pickup window." };
    }

    const items = state.cart.map((cartItem) => {
      const product = state.inventory.find((item) => item.id === cartItem.productId);
      return product ? { ...product, quantity: cartItem.quantity } : null;
    });

    if (items.some((item) => !item)) {
      return {
        success: false,
        error: "A cart item is no longer available. Remove it and try again.",
      };
    }

    const unavailableItem = items.find((item) => item.quantity > item.stock);
    if (unavailableItem) {
      return {
        success: false,
        error:
          unavailableItem.stock === 0
            ? `${unavailableItem.name} sold out. Remove it to continue.`
            : `Only ${unavailableItem.stock} ${unavailableItem.name} left. Update your cart to continue.`,
      };
    }

    const expiredItem = items.find((item) => isExpired(item.bestBy));
    if (expiredItem) {
      return {
        success: false,
        error: `${expiredItem.name} passed its best-by time. Remove it to continue.`,
      };
    }

    const total = roundMoney(
      items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0),
    );
    if (total > state.balance) {
      return {
        success: false,
        insufficientFunds: true,
        error: `You need ${formatPrice(total - state.balance)} more in dining points.`,
      };
    }

    const order = {
      id: crypto.randomUUID(),
      code: createOrderCode(),
      status: "preparing",
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        kind: item.kind,
        quantity: item.quantity,
        unitPrice: item.discountedPrice,
      })),
      total,
      pickupLocation: "the Cellar counter",
      pickupStart: pickupWindow.start,
      pickupEnd: pickupWindow.end,
      createdAt: new Date().toISOString(),
    };
    const purchased = new Map(items.map((item) => [item.id, item.quantity]));
    const inventory = state.inventory.map((product) => ({
      ...product,
      stock: product.stock - (purchased.get(product.id) ?? 0),
    }));

    return saveState({
      ...state,
      inventory,
      cart: [],
      balance: roundMoney(state.balance - total),
      orders: [order, ...state.orders],
    })
      ? { success: true, order }
      : { success: false, error: "Could not save your order. Please try again." };
  }

  function cancelOrder(orderId) {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || order.status !== "preparing") {
      return { success: false, error: "Only orders that are still being prepared can be cancelled." };
    }
    return saveResult(
      {
        ...state,
        inventory: restock(state.inventory, order.items),
        balance: roundMoney(state.balance + order.total),
        orders: state.orders.map((item) =>
          item.id === orderId ? { ...item, status: "cancelled" } : item,
        ),
      },
      "Could not cancel your order. Please try again.",
    );
  }

  // Staff moves an order from preparing → ready → picked up.
  function advanceOrderStatus(orderId) {
    const nextStatus = { preparing: "ready", ready: "picked-up" };
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || !nextStatus[order.status]) {
      return { success: false, error: "This order can't be updated." };
    }
    return saveResult(
      {
        ...state,
        orders: state.orders.map((item) =>
          item.id === orderId ? { ...item, status: nextStatus[item.status] } : item,
        ),
      },
      "Could not update the order. Please try again.",
    );
  }

  // Adds an earlier order's items back to the cart, as many as are still in stock.
  function buyAgain(order) {
    let cart = [...state.cart];
    let added = 0;
    order.items.forEach((orderItem) => {
      const product = state.inventory.find((item) => item.id === orderItem.id);
      if (!product || isExpired(product.bestBy)) return;
      const existing = cart.find((item) => item.productId === orderItem.id);
      const inCart = existing?.quantity ?? 0;
      const quantity = Math.min(product.stock, inCart + orderItem.quantity);
      if (quantity <= inCart) return;
      added += quantity - inCart;
      cart = existing
        ? cart.map((item) => (item.productId === orderItem.id ? { ...item, quantity } : item))
        : [...cart, { productId: orderItem.id, quantity }];
    });

    if (added === 0) {
      return { success: false, error: "These items aren’t available right now." };
    }
    return saveResult({ ...state, cart }, "Could not save your cart. Please try again.");
  }

  const cartItems = state.cart
    .map((cartItem) => ({
      ...cartItem,
      product: state.inventory.find((product) => product.id === cartItem.productId),
    }))
    .filter((item) => item.product);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = roundMoney(
    cartItems.reduce((total, item) => total + item.product.discountedPrice * item.quantity, 0),
  );
  const cartSubtotal = roundMoney(
    cartItems.reduce(
      (total, item) =>
        total + (item.product.originalPrice ?? item.product.discountedPrice) * item.quantity,
      0,
    ),
  );

  return (
    <CartContext.Provider
      value={{
        inventory: state.inventory,
        cartItems,
        cartCount,
        cartTotal,
        cartSubtotal,
        balance: state.balance,
        orders: state.orders,
        storageError,
        expiredNotice,
        dismissExpiredNotice: () => setExpiredNotice([]),
        addToCart,
        setCartQuantity,
        removeFromCart,
        addFunds,
        checkout,
        cancelOrder,
        advanceOrderStatus,
        buyAgain,
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
