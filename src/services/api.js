// All reads and writes to the Supabase database go through this file.
// Rows are converted to the shapes the React components already use.
import { supabase } from "./supabaseClient.js";

function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    kind: row.kind,
    description: row.description,
    originalPrice: row.original_price === null ? null : Number(row.original_price),
    discountedPrice: Number(row.price),
    stock: row.stock,
    bestBy: row.best_by,
    tag: { label: row.tag_label, tone: row.tag_tone },
    allergens: row.allergens ?? [],
  };
}

function toOrder(row) {
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    status: row.status,
    items: (row.items ?? []).map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
    total: Number(row.total),
    pickupLocation: "the Cellar counter",
    pickupStart: row.pickup_start,
    pickupEnd: row.pickup_end,
    createdAt: row.created_at,
  };
}

async function callFunction(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("best_by");
  if (error) throw new Error(error.message);
  return data.map(toProduct);
}

// Students get their own orders; staff get everyone's (enforced by the database).
export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(toOrder);
}

export async function placeOrder(cart, pickupWindow) {
  const row = await callFunction("place_order", {
    p_items: cart.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    p_pickup_start: pickupWindow.start,
    p_pickup_end: pickupWindow.end,
  });
  return toOrder(row);
}

export async function cancelOrder(orderId) {
  return toOrder(await callFunction("cancel_order", { p_order_id: orderId }));
}

export async function advanceOrderStatus(orderId) {
  return toOrder(await callFunction("advance_order_status", { p_order_id: orderId }));
}

export async function addFunds(amount) {
  return Number(await callFunction("add_funds", { p_amount: amount }));
}

export async function releaseUnclaimedOrders() {
  return callFunction("release_unclaimed_orders");
}
