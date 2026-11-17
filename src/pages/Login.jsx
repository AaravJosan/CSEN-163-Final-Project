import { useNavigate } from "react-router-dom";
import leafIcon from "../assets/icons/logo-leaf-green.svg";
import FoodTile from "../components/FoodTile.jsx";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <section className="login-brand">
        <div className="login-logo">
          <span className="login-logo-mark">
            <img src={leafIcon} alt="" width="22" height="22" />
          </span>
          <span>Cellar Deals</span>
        </div>
        <h1 className="login-headline">
          Save food.
          <br />
          Save points.
        </h1>
        <p className="login-intro">
          Cellar items close to their expiry date, discounted or free. Reserve in a
          few taps and pick up at the counter.
        </p>
        <div className="login-tiles">
          <FoodTile kind="Meal" className="login-tile" />
          <FoodTile kind="Drink" className="login-tile" />
          <FoodTile kind="Fruit" className="login-tile" />
        </div>
      </section>

      <section className="login-area">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-card-text">
            Sign in with your SCU account to see today’s deals and your dining
            points.
          </p>
          <button
            type="button"
            className="button button--primary button--block"
            onClick={() => navigate("/deals")}
          >
            Sign in with SCU SSO
          </button>
          <hr className="divider" />
          <p className="login-card-note">
            Students and Cellar staff use the same login. Your name and dining
            points come from your SCU account.
          </p>
        </div>
      </section>
    </div>
  );
}
