import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Edit2, X, Loader2, Package, AlertTriangle, Minus, Plus, UserCheck, UserX } from "lucide-react";
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
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const [tab, setTab] = useState<"stock" | "dealers">("stock");
  const { data: pendingDealers = [] } = useQuery({
    queryKey: ["dealers", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, business_name, gst_number, dealer_status, created_at")
        .eq("dealer_status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

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
        <div className="mb-4 flex rounded-xl bg-surface p-1 text-sm font-semibold">
          <button onClick={() => setTab("stock")} className={cn("flex-1 rounded-lg px-3 py-2 transition-colors", tab === "stock" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground")}>Inventory</button>
          <button onClick={() => setTab("dealers")} className={cn("flex-1 rounded-lg px-3 py-2 transition-colors", tab === "dealers" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground")}>Pending Dealers ({pendingDealers.length})</button>
        </div>
        {tab === "stock" && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </div>}
      </div>

      {tab === "dealers" ? <PendingDealers dealers={pendingDealers} onDone={() => qc.invalidateQueries({ queryKey: ["dealers", "pending"] })} /> : <div className="overflow-hidden rounded-2xl border border-border bg-card">
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
      </div>}

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

function PendingDealers({
  dealers,
  onDone,
}: {
  dealers: Array<{ id: string; full_name: string | null; email: string | null; business_name: string | null; gst_number: string | null; created_at: string }>;
  onDone: () => void;
}) {
  const handleDecision = async (id: string, approved: boolean) => {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ dealer_status: approved ? "approved" : "rejected" })
      .eq("id", id);
    if (profileError) return toast.error(profileError.message);
    if (approved) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: id, role: "dealer" });
      if (roleError && !roleError.message.toLowerCase().includes("duplicate")) return toast.error(roleError.message);
    }
    toast.success(approved ? "Dealer approved" : "Dealer rejected");
    onDone();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {dealers.length === 0 ? (
        <p className="rounded-xl bg-surface p-5 text-sm text-muted-foreground">No pending dealer applications.</p>
      ) : (
        <div className="space-y-3">
          {dealers.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface/50 p-4">
              <div>
                <p className="font-semibold">{d.business_name ?? "Unnamed business"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{d.full_name} · {d.email}</p>
                <p className="mt-1 font-mono text-xs text-primary-deep">GST: {d.gst_number ?? "—"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDecision(d.id, false)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"><UserX className="h-3.5 w-3.5" /> Reject</button>
                <button onClick={() => handleDecision(d.id, true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-button"><UserCheck className="h-3.5 w-3.5" /> Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
  const [dealerPrice, setDealerPrice] = useState<number | "">("");
  const [bulkPrice, setBulkPrice] = useState<number | "">("");
  const [bulkMinQty, setBulkMinQty] = useState<number | "">("");
  const [lowThreshold, setLowThreshold] = useState(5);
  const [adjustment, setAdjustment] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setStock(product.stock);
      setPrice(product.price);
      setDealerPrice(product.dealerPrice ?? "");
      setBulkPrice(product.bulkPrice ?? "");
      setBulkMinQty(product.bulkMinQty ?? "");
      setLowThreshold(product.lowStockThreshold);
      setAdjustment(1);
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
          retail_price: price,
          dealer_price: dealerPrice === "" ? null : Number(dealerPrice),
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

  const adjustStock = (delta: number) => {
    setStock((current) => Math.max(0, current + delta));
  };

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
              <div className="rounded-2xl border border-border bg-surface/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Adjust Stock
                    </p>
                    <p className="mt-1 text-sm text-foreground">Apply a quick increment or deduction.</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1 shadow-soft">
                    <button
                      type="button"
                      onClick={() => adjustStock(-adjustment)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      aria-label="Decrease stock"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={adjustment}
                      onChange={(e) => setAdjustment(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 rounded-lg bg-input px-2 py-1.5 text-center text-sm font-semibold tabular-nums outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => adjustStock(adjustment)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-button transition-all hover:brightness-110"
                      aria-label="Increase stock"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

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

              <Field label="Dealer price (₹)">
                <input
                  type="number"
                  min={0}
                  value={dealerPrice}
                  onChange={(e) => setDealerPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputCls}
                  placeholder="private B2B price"
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
                  Customers ordering above the minimum quantity automatically receive the bulk price.
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
