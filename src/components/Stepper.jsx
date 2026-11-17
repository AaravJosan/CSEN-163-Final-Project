import minusIcon from "../assets/icons/minus.svg";
import plusIcon from "../assets/icons/plus.svg";

export default function Stepper({ value, min = 1, max, onChange, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="stepper-button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <img src={minusIcon} alt="" width="16" height="16" />
      </button>
      <span className="stepper-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="stepper-button"
        aria-label="Increase quantity"
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
      >
        <img src={plusIcon} alt="" width="16" height="16" />
      </button>
    </div>
  );
}
