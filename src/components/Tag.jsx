// Small pill label. Tones: "deal" (orange), "free" (green), "neutral" (gray).
export default function Tag({ tone = "deal", children }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}
