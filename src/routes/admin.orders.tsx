import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/products-api";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "awaiting_verification",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function AdminOrdersPage() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    }
  };

  const getProofUrl = async (path: string) => {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Orders</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review payment proofs and update fulfilment status.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{o.order_number}</p>
                  <p className="mt-0.5 font-semibold">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_email} · {o.customer_phone}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{o.shipping_address}, {o.shipping_city}, {o.shipping_state} {o.shipping_pincode}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{formatINR(Number(o.total))}</p>
                  <p className="text-xs text-muted-foreground">{o.payment_method.replace("_", " ")}</p>
                  {o.payment_reference && <p className="text-xs text-muted-foreground">Ref: {o.payment_reference}</p>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                  className={cn("rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium")}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                {o.payment_proof_url && (
                  <button
                    onClick={() => getProofUrl(o.payment_proof_url!)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-border-strong"
                  >
                    <ExternalLink className="h-3 w-3" /> View payment proof
                  </button>
                )}
                <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
