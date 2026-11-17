import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, useCart } from "../context/CartContext.jsx";
import { supabase } from "../services/supabaseClient.js";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { diningPoints, addFunds } = useCart();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          maxWidth: 520,
          margin: "60px auto",
          padding: "32px",
          textAlign: "center",
          background: "var(--color-surface, #fff)",
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "var(--radius-lg, 12px)",
        }}
      >
        <h2>Not Signed In</h2>
        <p style={{ color: "var(--color-text-muted, #666)", marginBottom: "20px" }}>
          Sign in with your SCU school account to view your profile and dining
          points.
        </p>
        <Link
          to="/login"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#861f41",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: 600,
          }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Santa Clara Student";
  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.identities?.[0]?.identity_data?.avatar_url ||
    user.identities?.[0]?.identity_data?.picture;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: "32px",
        background: "var(--color-surface, #fff)",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: "var(--radius-lg, 12px)",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          paddingBottom: "24px",
          borderBottom: "1px solid var(--color-border, #e5e7eb)",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile avatar"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #861f41",
            }}
          />
        ) : (
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#861f41",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: 700,
            }}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem" }}>{fullName}</h1>
          <p style={{ margin: "0 0 6px", color: "var(--color-text-muted, #666)" }}>
            {user.email}
          </p>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "12px",
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
            }}
          >
            Verified SCU Student
          </span>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>
          Dining Account
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Available Dining Points
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "#111827",
                marginTop: "2px",
              }}
            >
              {formatPrice(diningPoints)}
            </div>
          </div>
          <button
            onClick={() => addFunds(15)}
            style={{
              padding: "8px 16px",
              background: "#861f41",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add $15.00
          </button>
        </div>
      </div>
    </div>
  );
}
