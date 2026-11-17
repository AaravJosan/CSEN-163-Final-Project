import { capitalize, formatRelativeDay, formatTimeRange } from "./format.js";

const WINDOWS = [
  { startHour: 12, endHour: 17 },
  { startHour: 17, endHour: 21 },
];

function windowOn(dayOffset, { startHour, endHour }) {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(endHour, 0, 0, 0);
  return {
    id: `${dayOffset}-${startHour}`,
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${capitalize(formatRelativeDay(start))} · ${formatTimeRange(start, end)}`,
  };
}

// Pickup windows that haven't ended yet: the rest of today, then tomorrow.
export function getPickupWindows() {
  const now = Date.now();
  return [0, 1]
    .flatMap((dayOffset) => WINDOWS.map((window) => windowOn(dayOffset, window)))
    .filter((window) => new Date(window.end).getTime() > now)
    .slice(0, 3);
}

export function formatPickup(start, end) {
  return `${formatRelativeDay(start)}, ${formatTimeRange(start, end)}`;
}
