import { useSyncExternalStore } from "react";
import { PRODUCTS, type Product } from "./catalog";

export type CartItem = { product: Product; qty: number };

type State = {
  items: CartItem[];
  drawerOpen: boolean;
};

let state: State = { items: [], drawerOpen: false };
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

const setState = (next: Partial<State>) => {
  state = { ...state, ...next };
  notify();
};

export const cartStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return state;
  },
  add(productId: string, qty = 1) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    const existing = state.items.find((i) => i.product.id === productId);
    const items = existing
      ? state.items.map((i) =>
          i.product.id === productId ? { ...i, qty: i.qty + qty } : i,
        )
      : [...state.items, { product, qty }];
    setState({ items, drawerOpen: true });
  },
  setQty(productId: string, qty: number) {
    if (qty <= 0) return cartStore.remove(productId);
    setState({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, qty } : i,
      ),
    });
  },
  remove(productId: string) {
    setState({ items: state.items.filter((i) => i.product.id !== productId) });
  },
  clear() {
    setState({ items: [] });
  },
  openDrawer() {
    setState({ drawerOpen: true });
  },
  closeDrawer() {
    setState({ drawerOpen: false });
  },
};

export function useCart() {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getSnapshot,
  );
}

export const cartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const mrpTotal = items.reduce((s, i) => s + i.product.mrp * i.qty, 0);
  const savings = mrpTotal - subtotal;
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  return { subtotal, mrpTotal, savings, itemCount };
};
