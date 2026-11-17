import checkIcon from "../assets/icons/check-small.svg";

const STEPS = [
  { id: "placed", label: "Placed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "picked-up", label: "Picked up" },
];

// Placed → Preparing → Ready → Picked up. Steps before the current one are checked.
export default function StatusTracker({ status }) {
  const currentIndex = Math.max(
    STEPS.findIndex((step) => step.id === status),
    1,
  );

  return (
    <ol className="status-tracker" aria-label="Order status">
      {STEPS.map((step, index) => {
        const state =
          index < currentIndex || status === "picked-up"
            ? "done"
            : index === currentIndex
              ? "current"
              : "todo";
        return (
          <li
            key={step.id}
            className={`status-step status-step--${state}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            {index > 0 && <span className="status-line" aria-hidden="true" />}
            <span className="status-dot" aria-hidden="true">
              {state === "done" && <img src={checkIcon} alt="" width="14" height="14" />}
            </span>
            <span className="status-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
