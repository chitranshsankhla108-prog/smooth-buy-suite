import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LayoutDashboard, Package, Settings, ClipboardList, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) {
      throw redirect({ to: "/", search: {} } as never);
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const loc = useLocation();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const items = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/inventory", label: "Inventory", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ClipboardList },
    { to: "/admin/settings", label: "Payment Settings", icon: Settings },
  ];

  if (!ready) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Voltzo Dashboard</h1>
        </div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <aside>
          <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2">
            {items.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary-deep"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
