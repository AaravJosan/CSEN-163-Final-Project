export function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// "today", "tomorrow", or a short date like "Nov 9".
export function formatRelativeDay(value) {
  const date = new Date(value);
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// "5:00–9:00 PM" (drops the first AM/PM when both match).
export function formatTimeRange(start, end) {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  const startMeridiem = startLabel.slice(-2);
  const endMeridiem = endLabel.slice(-2);
  const trimmedStart =
    startMeridiem === endMeridiem ? startLabel.slice(0, -3) : startLabel;
  return `${trimmedStart}–${endLabel}`;
}

export function isExpired(bestBy) {
  const time = new Date(bestBy).getTime();
  return !Number.isFinite(time) || Date.now() > time;
}

export function formatBestBy(bestBy) {
  return `Best by ${formatRelativeDay(bestBy)}, ${formatTime(bestBy)}`;
}

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
