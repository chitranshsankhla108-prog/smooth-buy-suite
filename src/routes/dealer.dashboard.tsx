import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock3, CreditCard, FileText, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/products-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dealer/dashboard")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth", search: { redirect: location.pathname } });
  },
  head: () => ({ meta: [{ title: "Dealer Portal — Mayur Electronics" }] }),
  component: DealerDashboard,
});

function DealerDashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ["dealer", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: inquiries = [] } = useQuery({
    queryKey: ["dealer", "inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dealer_inquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Dealer Portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">B2B Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dealer/orders" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground shadow-soft transition-colors hover:text-foreground"><CreditCard className="h-4 w-4" /> Orders & balance</Link>
          <Link to="/" className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-button">Shop dealer catalog</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={PackageCheck} label="Orders" value={orders.length} />
        <Metric icon={Clock3} label="Pending inquiries" value={inquiries.filter((i) => i.status === "pending").length} />
        <Metric icon={FileText} label="Spec sheets" value="Ready" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Order History" empty="No dealer orders yet.">
          {orders.map((o) => <Row key={o.id} title={o.order_number} meta={new Date(o.created_at).toLocaleDateString()} value={formatINR(Number(o.total))} tone={o.status} />)}
        </Panel>
        <Panel title="Pending Inquiries" empty="No pending inquiries yet.">
          {inquiries.map((i) => <Row key={i.id} title={i.product_name} meta={`${i.quantity} units · ${new Date(i.created_at).toLocaleDateString()}`} value={i.status} tone={i.status} />)}
        </Panel>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof PackageCheck; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

function Panel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="mb-4 text-base font-semibold">{title}</h2>{children.length ? <div className="space-y-3">{children}</div> : <p className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">{empty}</p>}</section>;
}

function Row({ title, meta, value, tone }: { title: string; meta: string; value: string; tone: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3"><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{meta}</p></div><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", tone === "pending" ? "bg-warning/20 text-warning-foreground" : "bg-primary-soft text-primary-deep")}>{value}</span></div>;
}