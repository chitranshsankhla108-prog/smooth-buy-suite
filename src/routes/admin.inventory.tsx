import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminProductsQueryOptions, formatINR, stockStatus, type Product } from "@/lib/products-api";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const { data: products = [], isLoading } = useQuery(adminProductsQueryOptions());
  const [editing, setEditing] = useState<Product | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage stock levels and pricing tiers.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 text-right font-medium">Retail</th>
                <th className="px-4 py-3 text-right font-medium">Bulk</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const s = stockStatus(p);
                return (
                  <tr key={p.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="h-10 w-10 rounded-lg border border-border bg-surface object-contain p-1" />
                        <div>
                          <p className="line-clamp-1 font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.brand} · {p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.price)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {p.bulkPrice != null ? `${formatINR(p.bulkPrice)} @ ${p.bulkMinQty}+` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{p.stock}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:border-border-strong"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && <EditModal product={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof stockStatus> }) {
  const map = {
    in: { label: "In stock", cls: "bg-success/15 text-success" },
    low: { label: "Low stock", cls: "bg-warning/20 text-warning-foreground" },
    out: { label: "Out of stock", cls: "bg-destructive/15 text-destructive" },
  } as const;
  const v = map[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold", v.cls)}>{v.label}</span>;
}

function EditModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [stock, setStock] = useState(product.stock);
  const [price, setPrice] = useState(product.price);
  const [bulkPrice, setBulkPrice] = useState<number | "">(product.bulkPrice ?? "");
  const [bulkMinQty, setBulkMinQty] = useState<number | "">(product.bulkMinQty ?? "");
  const [lowThreshold, setLowThreshold] = useState(product.lowStockThreshold);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          stock,
          price,
          bulk_price: bulkPrice === "" ? null : Number(bulkPrice),
          bulk_min_qty: bulkMinQty === "" ? null : Number(bulkMinQty),
          low_stock_threshold: lowThreshold,
          bulk_available: bulkPrice !== "" && bulkMinQty !== "",
        })
        .eq("id", product.id);
      if (error) throw error;
      toast.success("Product updated");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg bg-input px-3 py-2 text-sm outline-none focus:bg-card focus:ring-2 focus:ring-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Edit product</h3>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stock"><input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Low-stock threshold"><input type="number" min={0} value={lowThreshold} onChange={(e) => setLowThreshold(Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Retail price (₹)" full><input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className={inputCls} /></Field>
          <div className="sm:col-span-2 mt-2 rounded-xl bg-surface/50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bulk Tier Pricing</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bulk price (₹)"><input type="number" min={0} value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} placeholder="leave blank" /></Field>
              <Field label="Min qty"><input type="number" min={2} value={bulkMinQty} onChange={(e) => setBulkMinQty(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} placeholder="e.g. 10" /></Field>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-button hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
