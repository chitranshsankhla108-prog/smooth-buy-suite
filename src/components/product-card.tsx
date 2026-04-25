import { useState } from "react";
import { Truck, Wrench, Star, ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { cartStore } from "@/lib/cart-store";
import { formatINR, productPriceForRole, type Product } from "@/lib/products-api";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { useAuth } from "@/lib/auth";

type Props = {
  product: Product;
  initialQty?: number;
};

export function ProductCard({ product }: Props) {
  const [compare, setCompare] = useState(false);
  const [added, setAdded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const { isDealer } = useAuth();

  const effective = productPriceForRole(product, isDealer);
  const discount = Math.round(((product.mrp - effective) / product.mrp) * 100);
  const outOfStock = product.stock === 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    cartStore.add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const openDetails = () => setDetailOpen(true);

  return (
    <>
    <article
      onClick={openDetails}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
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

        {isDealer ? (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-soft">
            Dealer Exclusive Price
          </span>
        ) : discount > 0 && (
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
          onClick={(e) => e.stopPropagation()}
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
            {!isDealer && <span className="text-xs text-muted-foreground line-through">
              {formatINR(product.mrp)}
            </span>}
          </div>
          {isDealer && (
            <p className="mt-0.5 text-[11px] font-semibold text-primary">Dealer Exclusive Price</p>
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




        <div className="mt-auto pt-1">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
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
        </div>
      </div>
    </article>
    <ProductDetailModal
      product={detailOpen ? product : null}
      onClose={() => setDetailOpen(false)}
    />
    </>
  );
}
