import { useState } from "react";
import { Heart, Minus, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { cartStore } from "@/lib/cart-store";
import { formatINR, productPriceForRole, type Product } from "@/lib/products-api";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { useAuth } from "@/lib/auth";

type Props = {
  product: Product;
};

// Stable pseudo-IDs derived from the product id so the catalogue mirrors the
// reference template (Product ID + Item CD chips) without schema changes.
const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const pid = (id: string) => {
  const h = hashCode(id);
  const letter = String.fromCharCode(65 + (h % 26));
  return `${letter}${(h % 9000 + 1000).toString().padStart(4, "0")}`;
};
const itemCd = (id: string) => {
  const h = hashCode(id + "x");
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  let n = h;
  for (let i = 0; i < 6; i++) {
    out += letters[n % letters.length];
    n = Math.floor(n / letters.length) + 7;
  }
  return out;
};

export function ProductCard({ product }: Props) {
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const { isDealer } = useAuth();

  const effective = productPriceForRole(product, isDealer);
  const outOfStock = product.stock === 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    cartStore.add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <article
        onClick={() => setDetailOpen(true)}
        className={cn(
          "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated",
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-surface">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
          {isDealer && (
            <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-soft">
              Dealer
            </span>
          )}
          {outOfStock && (
            <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground shadow-soft">
              Out
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-foreground">
            {product.name}
          </h3>

          <div className="flex flex-col gap-1 text-[10px]">
            <span className="inline-flex w-fit items-center rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary-deep">
              Product ID:{pid(product.id)}
            </span>
            <span className="inline-flex w-fit items-center rounded-md bg-surface px-1.5 py-0.5 font-medium text-muted-foreground">
              Item CD:{itemCd(product.id)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-base font-bold tracking-tight text-foreground">
              {formatINR(effective)}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold",
                outOfStock ? "text-destructive" : "text-success",
              )}
            >
              {outOfStock ? "Out of Stock" : "In Stock"}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="rounded-md bg-surface px-1.5 py-0.5 font-semibold uppercase tracking-wide text-primary">
              {product.brand}
            </span>
            {product.fastDelivery && <span>· Fast delivery</span>}
          </div>

          {/* Qty + Add to cart */}
          <div className="mt-2 flex items-stretch gap-1.5" onClick={stop}>
            <div className="flex items-center rounded-xl border border-border bg-input">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-xs font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="flex h-8 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-bold uppercase tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50",
                added
                  ? "bg-success text-success-foreground"
                  : "bg-gradient-primary text-primary-foreground shadow-button hover:brightness-110 active:scale-[0.98]",
              )}
            >
              {added ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={3} /> Added
                </>
              ) : (
                "Add to Cart"
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setWishlisted((w) => !w);
            }}
            className={cn(
              "mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-input transition-colors",
              wishlisted ? "text-destructive" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Wishlist"
          >
            <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-current")} />
          </button>
        </div>
      </article>

      <ProductDetailModal
        product={detailOpen ? product : null}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
