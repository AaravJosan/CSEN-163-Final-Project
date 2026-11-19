import { Link } from "react-router-dom";
import "./Profile.css";

const SECTIONS = [
  {
    title: "Ordering",
    points: [
      "Items are close to their best-by time, so they’re marked down or free.",
      "Add items to your cart, pick a pickup window and tap Buy now. You pay with dining points.",
      "Your items are held for you as soon as the order is placed.",
    ],
  },
  {
    title: "Picking up",
    points: [
      "Go to the Cellar counter in Benson Center during your pickup window.",
      "Show the order code (like CD-4821) from My orders. Wait until it says Ready.",
      "Pick up before the item’s best-by time. The cart warns you if a window is too late.",
    ],
  },
  {
    title: "Cancelling and refunds",
    points: [
      "You can cancel from My orders while the order is still Preparing. Your points come straight back.",
      "Once it’s Ready, talk to Cellar staff at the counter.",
      "If you don’t pick up by the end of your window, the order goes back on sale and your points are refunded.",
    ],
  },
  {
    title: "Dining points",
    points: [
      "Your balance is shown at the top of every page.",
      "If you’re short at checkout, add funds and the order is placed right after.",
    ],
  },
  {
    title: "Allergies",
    points: [
      "Each item lists its common allergens. Items are made in a shared kitchen, so ask staff if you have a severe allergy.",
    ],
  },
];

export default function Help() {
  return (
    <div className="profile-page">
      <h1 className="page-title">How Cellar Deals works</h1>
      {SECTIONS.map((section) => (
        <section className="panel help-section" key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
      <Link className="button button--primary" to="/deals" style={{ alignSelf: "flex-start" }}>
        Browse deals
      </Link>
    </div>
  );
}
