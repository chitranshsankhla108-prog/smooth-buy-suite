import { Link } from "@tanstack/react-router";
import { ShoppingCart, Zap } from "lucide-react";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";

export function SiteHeader() {
  const { items } = useCart();
  const { itemCount } = cartTotals(items);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-button">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">Voltzo</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Electronics Marketplace
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/" className="transition-colors hover:text-foreground">
            Shop
          </Link>
          <a className="transition-colors hover:text-foreground" href="#categories">
            Categories
          </a>
          <a className="transition-colors hover:text-foreground" href="#trust">
            B2B
          </a>
          <Link to="/checkout" className="transition-colors hover:text-foreground">
            Checkout
          </Link>
        </nav>

        <button
          onClick={() => cartStore.openDrawer()}
          className="relative inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft transition-all hover:border-border-strong hover:bg-surface-hover"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Cart</span>
          {itemCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
