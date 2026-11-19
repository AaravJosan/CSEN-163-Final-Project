import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as api from "../services/api.js";
import { supabase } from "../services/supabaseClient.js";
import { friendlyError } from "../utils/errors.js";
import { formatPrice, isExpired } from "../utils/format.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export const ACTIVE_STATUSES = ["preparing", "ready"];

const INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS:";

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function readCart(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter(
          (item) => typeof item.productId === "string" && Number.isInteger(item.quantity) && item.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}

// Products, orders and points live in Supabase. The cart stays in this browser
// (one per account) until the student taps Buy now.
export function CartProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth();
  const userId = user?.id ?? null;
  const cartKey = userId ? `cellar-deals-cart-${userId}` : null;

  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [expiredNotice, setExpiredNotice] = useState([]);
  const expiryChecked = useRef(false);
  const reloadTimer = useRef(null);
  const refreshProfileRef = useRef(refreshProfile);
  refreshProfileRef.current = refreshProfile;

  const reload = useCallback(async () => {
    const [products, orderRows] = await Promise.all([api.fetchProducts(), api.fetchOrders()]);
    setInventory(products);
    setOrders(orderRows);
  }, []);

  // Load data for the signed-in account and keep it live.
  useEffect(() => {
    setCart(cartKey ? readCart(cartKey) : []);
    expiryChecked.current = false;
    if (!userId) {
      setInventory([]);
      setOrders([]);
      return undefined;
    }

    let active = true;
    setLoading(true);
    (async () => {
      try {
        const released = await api.releaseUnclaimedOrders();
        if (released > 0) refreshProfileRef.current();
        await reload();
        if (active) setLoadError("");
      } catch (error) {
        if (active) setLoadError(friendlyError(error, "The deals couldn’t be loaded."));
      } finally {
        if (active) setLoading(false);
      }
    })();

    function scheduleReload() {
      window.clearTimeout(reloadTimer.current);
      reloadTimer.current = window.setTimeout(() => {
        reload().catch((error) => setLoadError(friendlyError(error, "The deals couldn’t be loaded.")));
      }, 250);
    }

    const channel = supabase
      .channel(`cellar-data-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, scheduleReload)
      .subscribe();

    return () => {
      active = false;
      window.clearTimeout(reloadTimer.current);
      supabase.removeChannel(channel);
    };
  }, [userId, cartKey, reload]);

  function saveCart(nextCart) {
    setCart(nextCart);
    try {
      if (cartKey) localStorage.setItem(cartKey, JSON.stringify(nextCart));
      setStorageError("");
    } catch {
      setStorageError("Your cart could not be saved in this browser.");
    }
    return { success: true };
  }

  // After the first load, drop cart items that expired or were removed.
  useEffect(() => {
    if (loading || expiryChecked.current || inventory.length === 0) return;
    expiryChecked.current = true;
    const removedNames = [];
    const kept = cart.filter((cartItem) => {
      const product = inventory.find((item) => item.id === cartItem.productId);
      if (!product) return false;
      if (isExpired(product.bestBy)) {
        removedNames.push(product.name);
        return false;
      }
      return true;
    });
    if (kept.length !== cart.length) saveCart(kept);
    setExpiredNotice(removedNames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, inventory]);

  function addToCart(productId, amount = 1) {
    const product = inventory.find((item) => item.id === productId);
    if (!product) return { success: false, error: "This item is no longer available." };
    if (isExpired(product.bestBy)) return { success: false, error: `${product.name} has expired.` };

    const cartItem = cart.find((item) => item.productId === productId);
    const quantity = (cartItem?.quantity ?? 0) + amount;
    if (quantity > product.stock) {
      return {
        success: false,
        error: product.stock === 0 ? `${product.name} is sold out.` : `Only ${product.stock} ${product.name} left.`,
      };
    }
    return saveCart(
      cartItem
        ? cart.map((item) => (item.productId === productId ? { ...item, quantity } : item))
        : [...cart, { productId, quantity }],
    );
  }

  function setCartQuantity(productId, quantity) {
    if (quantity <= 0) return removeFromCart(productId);
    const product = inventory.find((item) => item.id === productId);
    if (!product || !Number.isInteger(quantity) || quantity > product.stock) {
      return { success: false, error: `Only ${product?.stock ?? 0} ${product?.name ?? "items"} left.` };
    }
    return saveCart(cart.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  }

  function removeFromCart(productId) {
    return saveCart(cart.filter((item) => item.productId !== productId));
  }

  async function addFunds(amount) {
    try {
      await api.addFunds(amount);
      await refreshProfile();
      return { success: true };
    } catch (error) {
      return { success: false, error: friendlyError(error, "Couldn’t add funds. Your balance hasn’t changed. Try again.") };
    }
  }

  async function checkout(pickupWindow) {
    if (cart.length === 0) return { success: false, error: "Your cart is empty." };
    if (!pickupWindow) return { success: false, error: "Choose a pickup window." };
    try {
      const order = await api.placeOrder(cart, pickupWindow);
      saveCart([]);
      setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      refreshProfile();
      reload().catch(() => {});
      return { success: true, order };
    } catch (error) {
      if (error.message.startsWith(INSUFFICIENT_FUNDS)) {
        return {
          success: false,
          insufficientFunds: true,
          error: error.message.slice(INSUFFICIENT_FUNDS.length),
        };
      }
      reload().catch(() => {});
      return {
        success: false,
        error: friendlyError(error, "Couldn’t place your order. No points were taken. Try again."),
      };
    }
  }

  async function updateOrder(action, orderId) {
    try {
      const order = await action(orderId);
      setOrders((current) => current.map((item) => (item.id === order.id ? order : item)));
      reload().catch(() => {});
      return { success: true, order };
    } catch (error) {
      return { success: false, error: friendlyError(error, "Couldn’t update this order. Refresh the page and try again.") };
    }
  }

  async function cancelOrder(orderId) {
    const result = await updateOrder(api.cancelOrder, orderId);
    if (result.success) refreshProfile();
    return result;
  }

  function advanceOrderStatus(orderId) {
    return updateOrder(api.advanceOrderStatus, orderId);
  }

  // Adds an earlier order's items back to the cart, as many as are still in stock.
  function buyAgain(order) {
    let nextCart = [...cart];
    let added = 0;
    order.items.forEach((orderItem) => {
      const product = inventory.find((item) => item.id === orderItem.id);
      if (!product || isExpired(product.bestBy)) return;
      const existing = nextCart.find((item) => item.productId === orderItem.id);
      const inCart = existing?.quantity ?? 0;
      const quantity = Math.min(product.stock, inCart + orderItem.quantity);
      if (quantity <= inCart) return;
      added += quantity - inCart;
      nextCart = existing
        ? nextCart.map((item) => (item.productId === orderItem.id ? { ...item, quantity } : item))
        : [...nextCart, { productId: orderItem.id, quantity }];
    });
    if (added === 0) return { success: false, error: "These items aren’t available right now." };
    return saveCart(nextCart);
  }

  const cartItems = cart
    .map((cartItem) => ({
      ...cartItem,
      product: inventory.find((product) => product.id === cartItem.productId),
    }))
    .filter((item) => item.product);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = roundMoney(
    cartItems.reduce((total, item) => total + item.product.discountedPrice * item.quantity, 0),
  );
  const cartSubtotal = roundMoney(
    cartItems.reduce(
      (total, item) => total + (item.product.originalPrice ?? item.product.discountedPrice) * item.quantity,
      0,
    ),
  );

  return (
    <CartContext.Provider
      value={{
        loading,
        loadError,
        retryLoad: () =>
          reload()
            .then(() => setLoadError(""))
            .catch((error) => setLoadError(friendlyError(error, "The deals couldn’t be loaded."))),
        inventory,
        cartItems,
        cartCount,
        cartTotal,
        cartSubtotal,
        balance: profile?.points ?? 0,
        orders,
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
