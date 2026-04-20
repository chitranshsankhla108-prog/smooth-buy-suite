import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cartStore, useCart, cartTotals, effectivePrice } from "@/lib/cart-store";
import { formatINR, productsQueryOptions } from "@/lib/products-api";

export function CartDrawer() {
  const { items, drawerOpen } = useCart();
  const { subtotal, savings, itemCount } = cartTotals(items);

  // Fetch products for cross-sell suggestions
  const { data: allProducts = [] } = useQuery(productsQueryOptions());

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const inCartIds = new Set(items.map((i) => i.product.id));
  const suggestionIds = Array.from(
    new Set(items.flatMap((i) => i.product.crossSellIds ?? [])),
  ).filter((id) => !inCartIds.has(id));
  const suggestions = suggestionIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 2);

  const fallbackSuggestions =
    items.length > 0 && suggestions.length === 0
      ? allProducts.filter((p) => !inCartIds.has(p.id)).slice(0, 2)
      : [];

  const finalSuggestions = suggestions.length > 0 ? suggestions : fallbackSuggestions;

  const hasHeavy = items.some((i) => i.product.heavy);

  return (
    <>
      <div
        onClick={() => cartStore.closeDrawer()}
        className={cn(
          "fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm transition-opacity duration-300",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-background shadow-elevated transition-transform duration-300 ease-out sm:rounded-l-3xl",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your Cart</h2>
            <p className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={() => cartStore.closeDrawer()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add products to see them here
              </p>
              <button
                onClick={() => cartStore.closeDrawer()}
                className="mt-5 rounded-full bg-gradient-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-button hover:brightness-110"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {hasHeavy && (
                <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />
                  <div className="text-[12px] leading-snug">
                    <p className="font-semibold text-warning-foreground">Heavy Item</p>
                    <p className="text-muted-foreground">
                      One or more items require specialized handling for safe delivery.
                      Allow 2–4 extra days.
                    </p>
                  </div>
                </div>
              )}

              <ul className="space-y-4">
                {items.map((item) => {
                  const { product, qty } = item;
                  const price = effectivePrice(item);
                  return (
                    <li
                      key={product.id}
                      className="flex gap-3 rounded-2xl border border-border bg-card p-3"
                    >
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-surface">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-1.5"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                              {product.brand}
                            </p>
                            <p className="line-clamp-2 text-sm font-medium leading-snug">
                              {product.name}
                            </p>
                          </div>
                          <button
                            onClick={() => cartStore.remove(product.id)}
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="inline-flex items-center rounded-lg bg-surface">
                            <button
                              onClick={() => cartStore.setQty(product.id, qty - 1)}
                              className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-semibold tabular-nums">
                              {qty}
                            </span>
                            <button
                              onClick={() =>
                                cartStore.setQty(product.id, Math.min(product.stock, qty + 1))
                              }
                              className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatINR(price * qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {finalSuggestions.length > 0 && (
                <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4">
                  <div className="mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-primary-deep">
                      Recommended for you
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {finalSuggestions.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl bg-card p-2.5"
                      >
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-medium">{p.name}</p>
                          <p className="text-xs font-semibold text-foreground">
                            {formatINR(p.price)}
                          </p>
                        </div>
                        <button
                          onClick={() => cartStore.add(p)}
                          className="flex-shrink-0 rounded-lg border border-primary/40 bg-card px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-soft"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border bg-surface/50 px-6 py-5">
            {savings > 0 && (
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">You save</span>
                <span className="font-semibold text-success">{formatINR(savings)}</span>
              </div>
            )}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold tracking-tight">
                {formatINR(subtotal)}
              </span>
            </div>
            <Link
              to="/checkout"
              onClick={() => cartStore.closeDrawer()}
              className="flex w-full items-center justify-between rounded-full bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <span className="inline-flex items-center gap-2">
                Checkout <ArrowRight className="h-4 w-4" />
              </span>
              <span className="tabular-nums">{formatINR(subtotal)}</span>
            </Link>
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
              Secure payments · Easy returns · GST invoice available
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
