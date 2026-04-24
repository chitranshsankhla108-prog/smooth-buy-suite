import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, FileText, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/products-api";
import { cn } from "@/lib/utils";

const unpaidStatuses = new Set(["pending_payment", "awaiting_verification"]);

export const Route = createFileRoute("/dealer/orders")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth", search: { redirect: location.pathname } });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    if (!(roles ?? []).some((r) => r.role === "dealer")) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Dealer Orders & Balance — Voltzo" }] }),
  component: DealerOrdersPage,
});

function DealerOrdersPage() {
  const { data: orders = [] } = useQuery({
    queryKey: ["dealer", "orders", "balance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const outstanding = orders.reduce(
    (sum, order) => sum + (unpaidStatuses.has(order.status) ? Number(order.total) : 0),
    0,
  );
  const paidTotal = orders.reduce(
    (sum, order) => sum + (!unpaidStatuses.has(order.status) ? Number(order.total) : 0),
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Dealer Portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Orders & Payment Balance</h1>
        </div>
        <Link to="/dealer/dashboard" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-soft transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to portal
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={CreditCard} label="Payment balance" value={formatINR(outstanding)} emphasis />
        <Metric icon={PackageCheck} label="Total orders" value={orders.length} />
        <Metric icon={FileText} label="Paid / processing" value={formatINR(paidTotal)} />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Order History</h2>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary-deep">
            {orders.length} records
          </span>
        </div>

        {orders.length ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1.1fr,1fr,0.8fr,0.8fr] bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Order</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            {orders.map((order) => (
              <div key={order.id} className="grid grid-cols-[1.1fr,1fr,0.8fr,0.8fr] items-center border-t border-border px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{order.order_items?.length ?? 0} items</p>
                </div>
                <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className={cn("w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold", unpaidStatuses.has(order.status) ? "bg-warning/20 text-warning-foreground" : "bg-primary-soft text-primary-deep")}>
                  {order.status.replaceAll("_", " ")}
                </span>
                <span className="text-right font-semibold">{formatINR(Number(order.total))}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">No dealer orders yet. Shop the catalogue to place your first order.</p>
        )}
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, emphasis = false }: { icon: typeof CreditCard; label: string; value: string | number; emphasis?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", emphasis && "border-primary/30 bg-primary-soft/30")}>
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}