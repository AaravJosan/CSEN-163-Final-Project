import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";

const AuthContext = createContext(null);

const SCU_ONLY_MESSAGE = "Only @scu.edu accounts can use Cellar Deals.";

// Reads an OAuth error that Supabase sends back in the URL after a failed sign-in
// (for example when the database rejects a non-@scu.edu account).
function readRedirectError() {
  const params = new URLSearchParams(
    `${window.location.search.slice(1)}&${window.location.hash.slice(1)}`,
  );
  const description = params.get("error_description");
  if (!description) return "";
  window.history.replaceState(null, "", window.location.pathname);
  return /database error/i.test(description) ? SCU_ONLY_MESSAGE : description;
}

function toProfile(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    points: Number(row.points),
    isStaff: row.is_staff,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(readRedirectError);

  const user = session?.user ?? null;

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      setAuthError(error.message);
      return null;
    }
    if (!data) {
      // Signed in with Google, but the account isn't an @scu.edu account.
      setAuthError(SCU_ONLY_MESSAGE);
      await supabase.auth.signOut();
      return null;
    }
    const next = toProfile(data);
    setProfile(next);
    return next;
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load the profile (points, staff flag) and keep it live.
  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    refreshProfile().finally(() => {
      if (active) setLoading(false);
    });

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => setProfile(toProfile(payload.new)),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, refreshProfile]);

  async function signInWithGoogle() {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}login`,
        // Shows SCU Google accounts first in the account picker.
        queryParams: { hd: "scu.edu", prompt: "select_account" },
      },
    });
    if (error) setAuthError(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const metadata = user?.user_metadata ?? {};
  const displayName =
    profile?.fullName || metadata.full_name || metadata.name || user?.email?.split("@")[0] || "";
  const avatarUrl = metadata.avatar_url || metadata.picture || "";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        displayName,
        avatarUrl,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
