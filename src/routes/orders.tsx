import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/products-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: OrdersPage,
});

const statusColor: Record<string, string> = {
  pending_payment: "bg-warning/20 text-warning-foreground",
  awaiting_verification: "bg-primary-soft text-primary-deep",
  paid: "bg-success/15 text-success",
  processing: "bg-primary-soft text-primary-deep",
  shipped: "bg-success/15 text-success",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

function OrdersPage() {
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">No orders yet</p>
          <Link to="/" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-button hover:brightness-110">
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", statusColor[o.status] ?? "bg-surface")}>
                  {o.status.replace("_", " ")}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {o.order_items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1">{it.product_name} × {it.qty}</span>
                    <span className="font-medium tabular-nums">{formatINR(Number(it.line_total))}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-base font-semibold">{formatINR(Number(o.total))}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
