import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "customer" | "dealer";

type AuthValue = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDealer: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function fetchRoles(userId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) {
    console.error("fetchRoles", error);
    return [];
  }
  return (data ?? []).map((r) => r.role as Role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (cancelled) return;
      setSession(sess);
      if (sess?.user) {
        setLoading(true);
        // Defer fetchRoles so the Supabase client has stored the session
        // token internally before we make an authenticated query.
        setTimeout(() => {
          if (cancelled) return;
          fetchRoles(sess.user.id).then((r) => {
            if (cancelled) return;
            setRoles(r);
            setLoading(false);
          });
        }, 0);
      } else {
        setRoles([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      roles,
      loading,
      isAuthenticated: !!session?.user,
      isAdmin: roles.includes("admin"),
      isDealer: roles.includes("dealer"),
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      async signUp(email, password, fullName) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, roles, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
