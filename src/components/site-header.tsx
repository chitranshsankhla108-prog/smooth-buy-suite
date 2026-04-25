import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Zap, LayoutDashboard, LogOut, User, BriefcaseBusiness } from "lucide-react";
import { cartStore, useCart, cartTotals } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function SiteHeader() {
  const { items } = useCart();
  const { itemCount } = cartTotals(items);
  const { isAuthenticated, isAdmin, isDealer, signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-button">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight">Mayur Electronics</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Electronics Marketplace
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/" className="transition-colors hover:text-foreground">
            Shop
          </Link>
          <Link to="/checkout" className="transition-colors hover:text-foreground">
            Checkout
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary-deep transition-colors hover:bg-primary-soft/70"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          )}
          {isDealer && !isAdmin && (
            <Link
              to="/dealer/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-semibold text-primary-deep transition-colors hover:bg-primary-soft/70"
            >
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Dealer Portal
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-soft transition-all hover:border-border-strong hover:text-foreground sm:inline-flex"
              title={user?.email ?? ""}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-soft transition-all hover:border-border-strong hover:text-foreground sm:inline-flex"
            >
              <User className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}

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
      </div>
    </header>
  );
}
