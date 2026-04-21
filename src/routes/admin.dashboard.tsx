import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Edit2, X, Loader2, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  adminProductsQueryOptions,
  formatINR,
  stockStatus,
  type Product,
} from "@/lib/products-api";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Stock Management — Voltzo Admin" }],
  }),
  component: StockDashboard,
});

const CATEGORIES = ["All", "Power", "Security", "Solar", "Appliances"] as const;
type Cat = (typeof CATEGORIES)[number];

function StockDashboard() {
  const { data: products = [], isLoading } = useQuery(adminProductsQueryOptions());
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = cat === "All" || p.category === cat;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, query, cat]);

  const lowCount = products.filter((p) => stockStatus(p) === "low").length;
  const outCount = products.filter((p) => stockStatus(p) === "out").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Stock Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, filter and update inventory levels and pricing tiers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
            <Package className="h-3.5 w-3.5" /> {products.length} SKUs
          </span>
          {(lowCount > 0 || outCount > 0) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning-foreground">
              <AlertTriangle className="h-3.5 w-3.5" /> {lowCount} low · {outCount} out
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, brand or SKU…"
              className="w-full rounded-xl border border-border bg-input pl-9 pr-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  cat === c
                    ? "border-primary bg-primary text-primary-foreground shadow-button"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No products match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Product</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Stock</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Retail</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Bulk price</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const s = stockStatus(p);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-surface/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-xl border border-border bg-surface object-contain p-1"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.brand} · <span className="font-mono">{p.sku}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums">
                        {p.stock}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">{formatINR(p.price)}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                        {p.bulkPrice != null ? (
                          <>
                            {formatINR(p.bulkPrice)}
                            <span className="ml-1 text-[11px]">@ {p.bulkMinQty}+</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={s} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setEditing(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
                        >
                          <Edit2 className="h-3 w-3" /> Edit Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditDrawer product={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof stockStatus> }) {
  const map = {
    in: { label: "In stock", cls: "bg-primary-soft text-primary-deep" },
    low: { label: "Low stock", cls: "bg-warning/20 text-warning-foreground" },
    out: { label: "Out of stock", cls: "bg-destructive/15 text-destructive" },
  } as const;
  const v = map[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        v.cls,
      )}
    >
      {v.label}
    </span>
  );
}

function EditDrawer({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);
  const [bulkPrice, setBulkPrice] = useState<number | "">("");
  const [bulkMinQty, setBulkMinQty] = useState<number | "">("");
  const [lowThreshold, setLowThreshold] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setStock(product.stock);
      setPrice(product.price);
      setBulkPrice(product.bulkPrice ?? "");
      setBulkMinQty(product.bulkMinQty ?? "");
      setLowThreshold(product.lowStockThreshold);
    }
  }, [product]);

  const open = !!product;

  const handleSave = async () => {
    if (!product) return;
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
      toast.success("Stock & pricing updated");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20";

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-elevated transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {product && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="flex items-center gap-3">
                <img
                  src={product.image}
                  alt=""
                  className="h-12 w-12 rounded-xl border border-border bg-surface object-contain p-1"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Edit Stock
                  </p>
                  <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {product.brand} · {product.category}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Current stock">
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Low-stock alert at">
                  <input
                    type="number"
                    min={0}
                    value={lowThreshold}
                    onChange={(e) => setLowThreshold(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Retail price (₹)">
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={inputCls}
                />
              </Field>

              <div className="rounded-2xl bg-surface/60 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Bulk Tier Pricing
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bulk price (₹)">
                    <input
                      type="number"
                      min={0}
                      value={bulkPrice}
                      onChange={(e) =>
                        setBulkPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="optional"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Min qty">
                    <input
                      type="number"
                      min={2}
                      value={bulkMinQty}
                      onChange={(e) =>
                        setBulkMinQty(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="e.g. 10"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Customers ordering above the min quantity will see the bulk price applied
                  automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border p-5">
              <button
                onClick={onClose}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
