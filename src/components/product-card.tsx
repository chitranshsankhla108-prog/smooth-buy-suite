import { useState } from "react";
import { Truck, Wrench, Star, ShoppingCart, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { cartStore } from "@/lib/cart-store";
import { formatINR, type Product } from "@/lib/products-api";

type Props = {
  product: Product;
  initialQty?: number;
};

export function ProductCard({ product, initialQty = 1 }: Props) {
  const [qty, setQty] = useState(initialQty);
  const [compare, setCompare] = useState(false);
  const [added, setAdded] = useState(false);

  const isBulk =
    product.bulkPrice != null &&
    product.bulkMinQty != null &&
    qty >= product.bulkMinQty;
  const effective = isBulk ? product.bulkPrice! : product.price;
  const discount = Math.round(((product.mrp - effective) / product.mrp) * 100);
  const outOfStock = product.stock === 0;

  const handleAdd = () => {
    if (outOfStock) return;
    cartStore.add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
        "hover:-translate-y-1 hover:border-border-strong hover:shadow-elevated",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />

        {discount > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow-soft">
            {discount}% OFF
          </span>
        )}

        {outOfStock && (
          <span className="absolute left-3 bottom-3 inline-flex items-center rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground shadow-soft">
            Out of stock
          </span>
        )}

        <label
          className={cn(
            "absolute right-3 top-3 inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border bg-background/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md transition-all",
            compare
              ? "border-primary text-primary"
              : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border transition-all",
              compare ? "border-primary bg-primary" : "border-border-strong bg-background",
            )}
          >
            {compare && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
          </span>
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
            className="sr-only"
          />
          Compare
        </label>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            {product.brand}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="font-medium text-foreground">{product.rating}</span>
            <span>({product.reviews.toLocaleString("en-IN")})</span>
          </div>
        </div>

        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {product.name}
        </h3>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {formatINR(effective)}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              {formatINR(product.mrp)}
            </span>
          </div>
          {product.bulkAvailable && product.bulkMinQty && (
            <p className="mt-0.5 text-[11px] font-medium text-primary">
              {isBulk
                ? `Bulk price applied (${product.bulkMinQty}+ units)`
                : `Bulk pricing from ${product.bulkMinQty} units`}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {product.fastDelivery && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-muted-foreground">
              <Truck className="h-3 w-3" /> Fast Delivery
            </span>
          )}
          {product.installation && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-muted-foreground">
              <Wrench className="h-3 w-3" /> Installation Available
            </span>
          )}
        </div>

        {product.bulkAvailable && (
          <div className="flex items-center justify-between rounded-lg bg-surface px-2 py-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Qty</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-7 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock || 999, qty + 1))}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
              added
                ? "bg-success text-success-foreground"
                : "bg-gradient-primary text-primary-foreground shadow-button hover:brightness-110 active:scale-[0.98]",
            )}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
              </>
            )}
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary-soft/40 px-3 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary-soft hover:border-primary active:scale-[0.98]">
            <Building2 className="h-3.5 w-3.5" /> Bulk Inquiry
          </button>
        </div>
      </div>
    </article>
  );
}
