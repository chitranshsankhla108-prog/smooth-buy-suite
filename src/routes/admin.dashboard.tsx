import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Edit2,
  X,
  Loader2,
  Package,
  AlertTriangle,
  Minus,
  Plus,
  UserCheck,
  UserX,
  Trash2,
  PlusCircle,
  Tag,
  Pencil,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { toast } from "sonner";
import {
  adminProductsQueryOptions,
  categoriesQueryOptions,
  formatINR,
  stockStatus,
  type Product,
} from "@/lib/products-api";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Stock Management — Mayur Electronics Admin" }],
  }),
  component: StockDashboard,
});

type Tab = "overview" | "stock" | "categories" | "dealers";

function StockDashboard() {
  const { data: products = [], isLoading } = useQuery(adminProductsQueryOptions());
  const { data: categories = [] } = useQuery(categoriesQueryOptions());
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [brand, setBrand] = useState<string>("All");
  const [tab, setTab] = useState<Tab>("stock");
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", "dashboard-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("created_at,total,status")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

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
      const matchBrand = brand === "All" || p.brand === brand;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchBrand && matchQ;
    });
  }, [products, query, cat, brand]);
  const brands = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.brand))).sort((a, b) => a.localeCompare(b))],
    [products],
  );

  const lowCount = products.filter((p) => stockStatus(p) === "low").length;
  const outCount = products.filter((p) => stockStatus(p) === "out").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Stock Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, filter, add and update inventory in real time.
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
          {tab === "stock" && (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Add product
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap rounded-xl bg-surface p-1 text-sm font-semibold">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "stock", label: "Inventory" },
              { id: "categories", label: "Categories" },
              { id: "dealers", label: `Pending Dealers (${pendingDealers.length})` },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 min-w-[120px] rounded-lg px-3 py-2 transition-colors",
                tab === t.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "stock" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, brand or SKU…"
                className="w-full rounded-2xl border border-border bg-input pl-9 pr-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-[180px] rounded-xl bg-card">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {["All", ...categories.map((c) => c.name)].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="w-[180px] rounded-xl bg-card">
                  <SelectValue placeholder="Filter by brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {tab === "dealers" && (
        <PendingDealers
          dealers={pendingDealers}
          onDone={() => qc.invalidateQueries({ queryKey: ["dealers", "pending"] })}
        />
      )}

      {tab === "categories" && <CategoriesPanel />}
      {tab === "overview" && <OverviewTab products={products} orders={orders} />}

      {tab === "stock" && (
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
                              className="h-11 w-11 shrink-0 rounded-2xl border border-border bg-surface object-contain p-1"
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
                        <td className="px-5 py-4 text-right tabular-nums">
                          {formatINR(p.price)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={s} />
                            <Badge variant={p.active ? "default" : "secondary"} className="rounded-full text-[11px]">
                              {p.active ? "Published" : "Hidden"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditing(p)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
                            >
                              <Edit2 className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(p)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <EditDrawer product={editing} onClose={() => setEditing(null)} categories={categories.map((c) => c.name)} />
      <AddProductDrawer
        open={adding}
        onClose={() => setAdding(false)}
        categories={categories.map((c) => c.name)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.name ?? "product"}?`}
        description="This will permanently remove the product from your store. This action cannot be undone."
        confirmLabel="Yes, delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          const { error } = await supabase.from("products").delete().eq("id", confirmDelete.id);
          if (error) {
            toast.error(error.message);
            return;
          }
          toast.success("Product deleted");
          qc.invalidateQueries({ queryKey: ["products"] });
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof stockStatus> }) {
  const map = {
    in: { label: "In stock", cls: "border-transparent bg-primary-soft text-primary-deep" },
    low: { label: "Low stock", cls: "border-transparent bg-warning/20 text-warning-foreground" },
    out: { label: "Out of stock", cls: "border-transparent bg-destructive/15 text-destructive" },
  } as const;
  const v = map[status];
  return <Badge className={cn("rounded-full text-[11px] font-semibold", v.cls)}>{v.label}</Badge>;
}

function OverviewTab({
  products,
  orders,
}: {
  products: Product[];
  orders: Array<{ created_at: string; total: number; status: string }>;
}) {
  const chartData = useMemo(() => {
    const map = new Map<string, { day: string; revenue: number; orders: number }>();
    const since = new Date();
    since.setDate(since.getDate() - 13);

    for (const order of orders) {
      const dt = new Date(order.created_at);
      if (dt < since) continue;
      const day = dt.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const current = map.get(day) ?? { day, revenue: 0, orders: 0 };
      current.revenue += Number(order.total ?? 0);
      current.orders += 1;
      map.set(day, current);
    }
    return Array.from(map.values());
  }, [orders]);

  const chartConfig = {
    revenue: { label: "Revenue", color: "var(--color-primary)" },
    orders: { label: "Orders", color: "var(--color-success)" },
  } satisfies ChartConfig;

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle>{formatINR(totalRevenue)}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Total Orders</CardDescription>
          <CardTitle>{orders.length}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Products In Catalog</CardDescription>
          <CardTitle>{products.length}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue Trend (Last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="revenue" type="monotone" fill="var(--color-revenue)" fillOpacity={0.25} stroke="var(--color-revenue)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Trend (Last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Categories panel ---------------- */

function CategoriesPanel() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery(categoriesQueryOptions());
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  const inputCls =
    "w-full rounded-2xl border border-border bg-input px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20";

  const refetch = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await (supabase as any)
      .from("categories")
      .insert({ name: trimmed, sort_order: (categories.at(-1)?.sort_order ?? 0) + 10 });
    if (error) return toast.error(error.message);
    toast.success("Category added");
    setName("");
    refetch();
  };

  const handleRename = async () => {
    if (!renaming) return;
    const trimmed = renaming.name.trim();
    if (!trimmed) return;
    const original = categories.find((c) => c.id === renaming.id);
    const { error } = await (supabase as any)
      .from("categories")
      .update({ name: trimmed })
      .eq("id", renaming.id);
    if (error) return toast.error(error.message);
    if (original && original.name !== trimmed) {
      // Cascade rename to products
      await supabase
        .from("products")
        .update({ category: trimmed })
        .eq("category", original.name);
    }
    toast.success("Category renamed");
    setRenaming(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const handleDelete = async () => {
    if (!confirm) return;
    const { error } = await (supabase as any).from("categories").delete().eq("id", confirm.id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    setConfirm(null);
    refetch();
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-sm font-semibold">Manage categories</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Categories appear on the storefront filters and the Add Product form.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New category (e.g. Inverters)"
          className={inputCls}
        />
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110 disabled:opacity-50"
        >
          <PlusCircle className="h-4 w-4" /> Add category
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-2xl bg-surface p-5 text-sm text-muted-foreground">
            No categories yet. Add your first one above.
          </p>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/50 p-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-deep">
                  <Tag className="h-3.5 w-3.5" />
                </span>
                {renaming?.id === c.id ? (
                  <input
                    autoFocus
                    value={renaming.name}
                    onChange={(e) => setRenaming({ id: c.id, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    className="rounded-xl border border-border bg-input px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:bg-card"
                  />
                ) : (
                  <span className="text-sm font-medium">{c.name}</span>
                )}
              </div>
              <div className="flex gap-1.5">
                {renaming?.id === c.id ? (
                  <>
                    <button
                      onClick={handleRename}
                      className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenaming(null)}
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setRenaming({ id: c.id, name: c.name })}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                    >
                      <Pencil className="h-3 w-3" /> Rename
                    </button>
                    <button
                      onClick={() => setConfirm({ id: c.id, name: c.name })}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={`Delete category “${confirm?.name ?? ""}”?`}
        description="Products using this category will keep their label but the filter will disappear from the storefront."
        confirmLabel="Yes, delete"
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ---------------- Pending dealers (unchanged) ---------------- */

function PendingDealers({
  dealers,
  onDone,
}: {
  dealers: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    business_name: string | null;
    gst_number: string | null;
    created_at: string;
  }>;
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
      if (roleError && !roleError.message.toLowerCase().includes("duplicate"))
        return toast.error(roleError.message);
    }
    toast.success(approved ? "Dealer approved" : "Dealer rejected");
    onDone();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {dealers.length === 0 ? (
        <p className="rounded-2xl bg-surface p-5 text-sm text-muted-foreground">
          No pending dealer applications.
        </p>
      ) : (
        <div className="space-y-3">
          {dealers.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface/50 p-4"
            >
              <div>
                <p className="font-semibold">{d.business_name ?? "Unnamed business"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {d.full_name} · {d.email}
                </p>
                <p className="mt-1 font-mono text-xs text-primary-deep">
                  GST: {d.gst_number ?? "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDecision(d.id, false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
                >
                  <UserX className="h-3.5 w-3.5" /> Reject
                </button>
                <button
                  onClick={() => handleDecision(d.id, true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-button"
                >
                  <UserCheck className="h-3.5 w-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Add Product Drawer ---------------- */

function AddProductDrawer({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: string[];
}) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    sku: "",
    name: "",
    brandName: "",
    modelName: "",
    category: categories[0] ?? "",
    description: "",
    status: "in_stock" as "in_stock" | "out_of_stock",
    voltage: "",
    ahRating: "",
    resolution: "",
    warrantyPeriod: "",
    technicalCapacity: "",
    mrp: 0,
    retailPrice: 0,
    dealerPrice: "" as number | "",
    stock: 0,
    lowThreshold: 5,
    imageUrl: "",
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, category: categories[0] ?? f.category }));
    }
  }, [open, categories]);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  const handleSave = async () => {
    if (!form.name.trim() || !form.brandName.trim() || !form.category) {
      toast.error("Name, brand and category are required");
      return;
    }
    if (!form.retailPrice || !form.mrp) {
      toast.error("Set MRP and retail price");
      return;
    }
    setSaving(true);
    try {
      const safeStr = (v: unknown): string =>
        typeof v === "string" ? v : v != null && typeof v === "object" && "secure_url" in (v as Record<string, unknown>) ? String((v as Record<string, unknown>).secure_url) : String(v ?? "");

      const id = safeStr(form.id).trim() || `${slugify(form.brandName)}-${slugify(form.name)}-${Date.now().toString(36)}`;
      const sku = safeStr(form.sku).trim() || id.toUpperCase();
      // Only send columns that actually exist in the products table.
      // Missing from DB: brand_name, model_name, description, voltage,
      // ah_rating, resolution, warranty_period, technical_capacity.
      const { error } = await supabase.from("products").insert({
        id,
        sku,
        name: safeStr(form.name).trim(),
        brand: safeStr(form.brandName).trim(),
        category: safeStr(form.category),
        price: form.retailPrice,
        retail_price: form.retailPrice,
        mrp: form.mrp,
        dealer_price: form.dealerPrice === "" ? null : Number(form.dealerPrice),
        stock: form.stock,
        low_stock_threshold: form.lowThreshold,
        image_url: safeStr(form.imageUrl).trim() || null,
        active: form.status === "in_stock",
      } as any);
      if (error) throw error;
      toast.success("Item added");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
      setForm({
        id: "",
        sku: "",
        name: "",
        brandName: "",
        modelName: "",
        category: categories[0] ?? "",
        description: "",
        status: "in_stock",
        voltage: "",
        ahRating: "",
        resolution: "",
        warrantyPeriod: "",
        technicalCapacity: "",
        mrp: 0,
        retailPrice: 0,
        dealerPrice: "",
        stock: 0,
        lowThreshold: 5,
        imageUrl: "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-elevated transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              New product
            </p>
            <h3 className="text-sm font-semibold">Add to inventory</h3>
            <p className="text-xs text-muted-foreground">Saved directly to your storefront.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Luminous Eco Volt 1100"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Brand">
                  <Input
                    value={form.brandName}
                    onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    placeholder="Luminous"
                  />
                </Field>
                <Field label="Model">
                  <Input
                    value={form.modelName}
                    onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                    placeholder="Eco Volt 1100"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(value: "in_stock" | "out_of_stock") =>
                      setForm({ ...form, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short product overview for catalog and PDP"
                  rows={3}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="MRP (₹)">
                <Input
                  type="number"
                  min={0}
                  value={form.mrp || ""}
                  onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
                />
              </Field>
              <Field label="Retail Price (₹)">
                <Input
                  type="number"
                  min={0}
                  value={form.retailPrice || ""}
                  onChange={(e) => setForm({ ...form, retailPrice: Number(e.target.value) })}
                />
              </Field>
              <Field label="Dealer Price (₹)">
                <Input
                  type="number"
                  min={0}
                  value={form.dealerPrice}
                  onChange={(e) =>
                    setForm({ ...form, dealerPrice: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Technical Specs</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Voltage">
                <Input value={form.voltage} onChange={(e) => setForm({ ...form, voltage: e.target.value })} placeholder="12V / 24V" />
              </Field>
              <Field label="AH">
                <Input value={form.ahRating} onChange={(e) => setForm({ ...form, ahRating: e.target.value })} placeholder="150 AH" />
              </Field>
              <Field label="Resolution">
                <Input value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} placeholder="5MP" />
              </Field>
              <Field label="Warranty">
                <Input value={form.warrantyPeriod} onChange={(e) => setForm({ ...form, warrantyPeriod: e.target.value })} placeholder="24 months" />
              </Field>
              <Field label="Technical Capacity">
                <Input
                  value={form.technicalCapacity}
                  onChange={(e) => setForm({ ...form, technicalCapacity: e.target.value })}
                  placeholder="1100 VA / 12V"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Field label="Current Stock">
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </Field>
              <Field label="Low Stock Alert">
                <Input
                  type="number"
                  min={0}
                  value={form.lowThreshold}
                  onChange={(e) => setForm({ ...form, lowThreshold: Number(e.target.value) })}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Identifiers & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU (auto if blank)">
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="LUM-EV-1100"
                  />
                </Field>
                <Field label="Product ID (auto if blank)">
                  <Input
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="auto"
                  />
                </Field>
              </div>
              <Field label="Image URL">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://.../image.jpg"
                />
              </Field>
            </CardContent>
          </Card>
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
            Add product
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Confirm dialog ---------------- */

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-elevated"
      >
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <Trash2 className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-soft transition-all hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Edit drawer ---------------- */

function EditDrawer({
  product,
  onClose,
  categories,
}: {
  product: Product | null;
  onClose: () => void;
  categories: string[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"in_stock" | "out_of_stock">("in_stock");
  const [stock, setStock] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [dealerPrice, setDealerPrice] = useState<number | "">("");
  const [category, setCategory] = useState<string>("");
  const [voltage, setVoltage] = useState("");
  const [ahRating, setAhRating] = useState("");
  const [resolution, setResolution] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState("");
  const [technicalCapacity, setTechnicalCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [lowThreshold, setLowThreshold] = useState(5);
  const [adjustment, setAdjustment] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBrandName(product.brandName || product.brand);
      setModelName(product.modelName || product.sku);
      setDescription(product.description || "");
      setStatus(product.active ? "in_stock" : "out_of_stock");
      setStock(product.stock);
      setRetailPrice(product.retailPrice);
      setMrp(product.mrp);
      setDealerPrice(product.dealerPrice ?? "");
      setCategory(product.category);
      setVoltage(product.voltage ?? "");
      setAhRating(product.ahRating ?? "");
      setResolution(product.resolution ?? "");
      setWarrantyPeriod(product.warrantyPeriod ?? "");
      setTechnicalCapacity(product.technicalCapacity ?? "");
      setImageUrl(product.image);
      setLowThreshold(product.lowStockThreshold);
      setAdjustment(1);
    }
  }, [product]);

  const open = !!product;

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const safeStr = (v: unknown): string =>
        typeof v === "string" ? v : v != null && typeof v === "object" && "secure_url" in (v as Record<string, unknown>) ? String((v as Record<string, unknown>).secure_url) : String(v ?? "");

      // Only send columns that actually exist in the products table.
      // Missing from DB: brand_name, model_name, description, voltage,
      // ah_rating, resolution, warranty_period, technical_capacity.
      const { error } = await supabase
        .from("products")
        .update({
          name: safeStr(name).trim(),
          brand: safeStr(brandName).trim(),
          category: safeStr(category),
          stock,
          price: retailPrice,
          mrp,
          retail_price: retailPrice,
          dealer_price: dealerPrice === "" ? null : Number(dealerPrice),
          image_url: safeStr(imageUrl).trim() || null,
          low_stock_threshold: lowThreshold,
          active: status === "in_stock",
        } as any)
        .eq("id", product.id);
      if (error) throw error;
      toast.success("Item updated");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const adjustStock = (delta: number) => setStock((c) => Math.max(0, c + delta));

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
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
                  className="h-12 w-12 rounded-2xl border border-border bg-surface object-contain p-1"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Edit product
                  </p>
                  <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
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
                      Adjust stock
                    </p>
                    <p className="mt-1 text-sm">Quick increment or deduction.</p>
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
                    <Input
                      type="number"
                      min={1}
                      value={adjustment}
                      onChange={(e) =>
                        setAdjustment(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-16 text-center text-sm font-semibold tabular-nums"
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

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Name">
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Brand">
                      <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                    </Field>
                    <Field label="Model">
                      <Input value={modelName} onChange={(e) => setModelName(e.target.value)} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                          {categories.indexOf(category) === -1 && category && (
                            <SelectItem value={category}>{category}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Status">
                      <Select value={status} onValueChange={(value: "in_stock" | "out_of_stock") => setStatus(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Description">
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                  </Field>
                  <Field label="Image URL">
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../image.jpg" />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="MRP (₹)">
                    <Input type="number" min={0} value={mrp} onChange={(e) => setMrp(Number(e.target.value))} />
                  </Field>
                  <Field label="Retail Price (₹)">
                    <Input type="number" min={0} value={retailPrice} onChange={(e) => setRetailPrice(Number(e.target.value))} />
                  </Field>
                  <Field label="Dealer Price (₹)">
                    <Input
                      type="number"
                      min={0}
                      value={dealerPrice}
                      onChange={(e) => setDealerPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Technical Specs</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Voltage">
                    <Input value={voltage} onChange={(e) => setVoltage(e.target.value)} />
                  </Field>
                  <Field label="AH">
                    <Input value={ahRating} onChange={(e) => setAhRating(e.target.value)} />
                  </Field>
                  <Field label="Resolution">
                    <Input value={resolution} onChange={(e) => setResolution(e.target.value)} />
                  </Field>
                  <Field label="Warranty">
                    <Input value={warrantyPeriod} onChange={(e) => setWarrantyPeriod(e.target.value)} />
                  </Field>
                  <Field label="Technical Capacity">
                    <Input value={technicalCapacity} onChange={(e) => setTechnicalCapacity(e.target.value)} />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Inventory</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Field label="Current stock">
                    <Input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
                  </Field>
                  <Field label="Low-stock alert">
                    <Input type="number" min={0} value={lowThreshold} onChange={(e) => setLowThreshold(Number(e.target.value))} />
                  </Field>
                </CardContent>
              </Card>
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
