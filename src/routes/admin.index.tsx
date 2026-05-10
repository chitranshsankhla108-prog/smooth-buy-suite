import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, ClipboardList, IndianRupee } from "lucide-react";
import { adminProductsQueryOptions, formatINR, stockStatus } from "@/lib/products-api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: products = [] } = useQuery(adminProductsQueryOptions());
  const { data: orderStats } = useQuery({
    queryKey: ["orders", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id,status,total");
      if (error) throw error;
      const total = data.length;
      const pending = data.filter((o) => o.status === "awaiting_verification" || o.status === "pending_payment").length;
      const revenue = data.filter((o) => !["cancelled", "refunded"].includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
      return { total, pending, revenue };
    },
  });

  const lowStock = products.filter((p) => stockStatus(p) === "low").length;
  const outStock = products.filter((p) => stockStatus(p) === "out").length;

  const stats = [
    { label: "Total products", value: products.length, icon: Package, tone: "text-primary" },
    { label: "Low / out of stock", value: `${lowStock} / ${outStock}`, icon: AlertTriangle, tone: "text-warning" },
    { label: "Pending orders", value: orderStats?.pending ?? "—", icon: ClipboardList, tone: "text-primary-deep" },
    { label: "Revenue", value: orderStats ? formatINR(orderStats.revenue) : "—", icon: IndianRupee, tone: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft ${tone}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Welcome to the Mayur Electronics admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the sidebar to manage inventory, review pending orders, and configure payment details
          (UPI, Paytm, bank transfer) shown to customers at checkout.
        </p>
      </div>
    </div>
  );
}
