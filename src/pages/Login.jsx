import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import leafIcon from "../assets/icons/logo-leaf-green.svg";
import FoodTile from "../components/FoodTile.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const { user, profile, loading, authError, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  if (user && profile) {
    return <Navigate to={location.state?.from ?? "/deals"} replace />;
  }

  async function handleSignIn() {
    setRedirecting(true);
    await signInWithGoogle();
    // On success the browser leaves for Google; this only runs if it failed.
    setRedirecting(false);
  }

  const busy = loading || redirecting;

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
          {authError && (
            <p className="form-error" role="alert">
              {authError}
            </p>
          )}
          <button
            type="button"
            className="button button--primary button--block"
            onClick={handleSignIn}
            disabled={busy}
          >
            {redirecting
              ? "Opening SCU sign-in…"
              : loading
                ? "Checking your session…"
                : "Sign in with SCU SSO"}
          </button>
          <hr className="divider" />
          <p className="login-card-note">
            Students and Cellar staff use the same login. Your name and dining
            points come from your SCU account. Only @scu.edu accounts can sign in.
          </p>
        </div>
      </section>
    </div>
  );
}
