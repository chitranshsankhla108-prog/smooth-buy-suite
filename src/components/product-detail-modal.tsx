import { useEffect, useState, type ReactNode } from "react";
import { X, Star, Truck, Wrench, ShieldCheck, ShoppingCart, Building2, Check, FileDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cartStore } from "@/lib/cart-store";
import { formatINR, productPriceForRole, type Product } from "@/lib/products-api";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  product: Product | null;
  onClose: () => void;
};

function deriveSpecs(p: Product) {
  const isPower = p.category === "Power";
  const isSecurity = p.category === "Security";
  const isSolar = p.category === "Solar";

  return [
    { label: "Voltage", value: isPower ? "12V / 24V Compatible" : isSolar ? "24V DC" : "220V AC" },
    { label: "AH", value: isPower ? "150 AH" : isSolar ? "100 AH Equivalent" : "N/A" },
    { label: "Resolution", value: isSecurity ? "5MP Ultra HD" : "N/A" },
    {
      label: "Warranty",
      value: isPower ? "24 months" : isSecurity ? "12 months" : isSolar ? "60 months" : "12 months",
    },
    {
      label: "Technical Capacity",
      value: isPower
        ? "1100 VA / 12V"
        : isSecurity
          ? "5MP · IP67"
          : isSolar
            ? "330 W · Mono-PERC"
            : "Standard",
    },
    { label: "Brand", value: p.brand },
    { label: "Model", value: p.sku },
    { label: "In stock", value: p.stock > 0 ? `${p.stock} units` : "Out of stock" },
  ];
}

export function ProductDetailModal({ product, onClose }: Props) {
  const open = !!product;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { isDealer, user } = useAuth();

  useEffect(() => {
    if (product) setQty(1);
  }, [product]);

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!product) return null;

  const isBulk =
    !isDealer && product.bulkPrice != null && product.bulkMinQty != null && qty >= product.bulkMinQty;
  const effective = isBulk ? product.bulkPrice! : productPriceForRole(product, isDealer);
  const discount = Math.round(((product.mrp - effective) / product.mrp) * 100);
  const outOfStock = product.stock === 0;
  const specs = deriveSpecs(product);
  const dealerSavings = Math.max(0, (product.retailPrice - effective) * qty);

  const handleAdd = () => {
    if (outOfStock) return;
    cartStore.add(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      cartStore.openDrawer();
    }, 900);
  };

  const handleBulkQuote = () => {
    if (isDealer && user) {
      supabase.from("dealer_inquiries").insert({ dealer_id: user.id, product_id: product.id, product_name: product.name, quantity: qty }).then(({ error }) => {
        if (error) toast.error(error.message);
        else toast.success("Dealer inquiry submitted");
      });
      return;
    }
    toast.message(`Bulk quote request started for ${product.name}`, {
      description: qty > 1 ? `Requested quantity: ${qty} units.` : "Increase quantity if you need a larger order.",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
    >
      {/* Glassmorphism backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-md backdrop-saturate-150 animate-in fade-in duration-200"
      />

      {/* Dialog */}
      <div
        className="relative z-10 flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-white/40 bg-card/95 shadow-elevated backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground shadow-soft backdrop-blur transition-all hover:bg-card hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          {/* Image side */}
          <div className="relative flex shrink-0 items-center justify-center bg-gradient-soft p-8 md:w-1/2 md:p-10">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[280px] w-full object-contain md:max-h-[460px]"
            />
            {discount > 0 && (
              <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-success px-3 py-1 text-xs font-semibold text-success-foreground shadow-soft">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Specs side */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6 md:w-1/2 md:p-8">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {product.brand}
              </span>
              <h2 id="pdp-title" className="mt-1 text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                {product.name}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-semibold text-foreground">{product.rating}</span>
                <span>({product.reviews.toLocaleString("en-IN")} reviews)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-semibold tracking-tight">
                  {formatINR(effective)}
                </span>
                {product.mrp > effective && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatINR(product.mrp)}
                  </span>
                )}
              </div>
              {isDealer ? (
                <p className="mt-1.5 text-xs font-semibold text-primary">Dealer Exclusive Price</p>
              ) : product.bulkAvailable && product.bulkMinQty && (
                <p className="mt-1.5 text-xs font-medium text-primary">
                  {isBulk
                    ? `✓ Bulk price applied (${product.bulkMinQty}+ units)`
                    : `Bulk pricing from ${product.bulkMinQty} units · ${formatINR(product.bulkPrice ?? 0)}/unit`}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              {product.fastDelivery && (
                <Pill icon={Truck}>Fast Delivery</Pill>
              )}
              {product.installation && (
                <Pill icon={Wrench}>Installation Available</Pill>
              )}
              <Pill icon={ShieldCheck}>Genuine Warranty</Pill>
            </div>

            <div>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Specifications
              </h3>
              <dl className="divide-y divide-border rounded-2xl border border-border bg-card">
                {specs.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="font-medium text-foreground">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {(product.bulkAvailable || isDealer) && (
              <div className="flex items-center justify-between rounded-xl bg-surface px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">{isDealer ? "Bulk Quantity" : "Quantity"}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock || 999, qty + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            {isDealer && (
              <div className="rounded-xl border border-primary/20 bg-primary-soft/35 p-3 text-xs text-primary-deep">
                Total savings vs retail: <span className="font-semibold">{formatINR(dealerSavings)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky CTA bar */}
        <div className="sticky bottom-0 grid gap-3 border-t border-border bg-card/95 p-4 backdrop-blur-xl sm:grid-cols-3 sm:p-5">
          {isDealer && (
            <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary">
              <FileDown className="h-4 w-4" /> Download PDF Brochure
            </a>
          )}
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
              added
                ? "bg-success text-success-foreground"
                : "bg-gradient-primary text-primary-foreground shadow-button hover:brightness-110 active:scale-[0.98]",
            )}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} /> Added to cart
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" /> Add to Cart
              </>
            )}
          </button>
          <button
            onClick={handleBulkQuote}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary-soft/40 px-5 py-3 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary-soft active:scale-[0.98]"
          >
            <Building2 className="h-4 w-4" /> Request Bulk Quote
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ icon: Icon, children }: { icon: typeof Truck; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-muted-foreground">
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}
