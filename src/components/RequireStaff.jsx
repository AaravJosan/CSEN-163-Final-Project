import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Staff pages. The database enforces this too; this just explains it.
export default function RequireStaff({ children }) {
  const { profile } = useAuth();
  if (profile?.isStaff) return children;
  return (
    <div className="empty-state panel">
      <h2>Staff only</h2>
      <p>This page is for Cellar staff. Ask an admin to mark your account as staff.</p>
      <Link className="button button--primary" to="/deals">
        Back to deals
      </Link>
    </div>
  );
}
