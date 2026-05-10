import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ShieldCheck, Truck, Wrench, Building2, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { productsQueryOptions, categoriesQueryOptions } from "@/lib/products-api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shop Electronics — Mayur Electronics" },
      {
        name: "description",
        content:
          "Discover inverters, batteries, CCTV, solar panels and home appliances at Mayur Electronics. Genuine brands with installation across India.",
      },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(productsQueryOptions()),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]),
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const { data: categories = [] } = useQuery(categoriesQueryOptions());
  const { isDealer } = useAuth();
  const [active, setActive] = useState<string>("All");
  type SortKey = "featured" | "price-asc" | "price-desc" | "newest";
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = active === "All" ? products : products.filter((p) => p.category === active);
  const effectivePrice = (p: typeof products[number]) =>
    isDealer && p.dealerPrice != null ? p.dealerPrice : p.retailPrice;
  const visible = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return effectivePrice(a) - effectivePrice(b);
    if (sort === "price-desc") return effectivePrice(b) - effectivePrice(a);
    if (sort === "newest") {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    }
    return 0;
  });
  const counts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const filters: { name: string; count: number }[] = [
    { name: "All", count: products.length },
    ...categories.map((c) => ({ name: c.name, count: counts[c.name] ?? 0 })),
  ];
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "featured", label: "Featured" },
    { key: "price-asc", label: "Price: Low to High" },
    { key: "price-desc", label: "Price: High to Low" },
    { key: "newest", label: "Newest" },
  ];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-gradient-soft">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-primary-deep/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr,1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-deep">
                <Sparkles className="h-3 w-3" />
                {isDealer ? "Dealer catalogue" : "Trusted electronics store"}
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Power, security &{" "}
                <span className="bg-gradient-to-r from-primary to-primary-deep bg-clip-text text-transparent">
                  smart appliances
                </span>{" "}
                for every Indian home & business.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                {isDealer
                  ? "Your regular shopping experience with confidential dealer-only pricing across eligible products."
                  : "Genuine brands, transparent pricing, installation included. Shipped fast across India by Mayur Electronics."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  Shop the catalog
                </a>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
                {[
                  { label: "Brands", value: "120+" },
                  { label: "Cities served", value: "850+" },
                  { label: "Avg. rating", value: "4.7★" },
                ].map((s) => (
                  <div key={s.label}>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="trust" className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Truck, title: "Fast Delivery", body: "2–4 day shipping in metros" },
                { icon: Wrench, title: "Installation", body: "Certified technicians on-site" },
                { icon: ShieldCheck, title: "Genuine warranty", body: "Brand-backed, no fakes" },
                { icon: Building2, title: "Pan-India service", body: "Stores across India" },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:border-border-strong hover:shadow-elevated"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="categories" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Featured catalog
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Curated from top Indian electronics brands
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-primary-soft/60 p-1.5">
              {filters.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActive(c.name)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                    active === c.name
                      ? "bg-gradient-primary text-primary-foreground shadow-button"
                      : "text-primary-deep hover:bg-primary-soft",
                  )}
                >
                  {c.name}
                  <span
                    className={cn(
                      "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      active === c.name
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary-soft text-primary-deep",
                    )}
                  >
                    {c.count}
                  </span>
                </button>
              ))}
            </div>
            <label className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft">
              <span className="text-muted-foreground">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer bg-transparent text-xs font-semibold text-primary-deep outline-none"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold">Mayur Electronics</p>
              <p className="mt-1 text-xs text-muted-foreground">
                © {new Date().getFullYear()} Mayur Electronics · Power, security & solar specialists
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-muted-foreground">
              <a className="hover:text-foreground" href="#">Privacy</a>
              <a className="hover:text-foreground" href="#">Terms</a>
              <a className="hover:text-foreground" href="#">Returns</a>
              <a className="hover:text-foreground" href="#">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
