import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { resolveProductImage } from "./product-images";

export type DBProduct = Database["public"]["Tables"]["products"]["Row"];

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: DBProduct["category"];
  price: number;
  mrp: number;
  bulkPrice: number | null;
  bulkMinQty: number | null;
  stock: number;
  lowStockThreshold: number;
  rating: number;
  reviews: number;
  image: string;
  heavy: boolean;
  installation: boolean;
  bulkAvailable: boolean;
  fastDelivery: boolean;
  crossSellIds: string[];
  active: boolean;
};

export const mapDBProduct = (p: DBProduct): Product => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: Number(p.price),
  mrp: Number(p.mrp),
  bulkPrice: p.bulk_price !== null ? Number(p.bulk_price) : null,
  bulkMinQty: p.bulk_min_qty,
  stock: p.stock,
  lowStockThreshold: p.low_stock_threshold,
  rating: Number(p.rating ?? 4.5),
  reviews: p.reviews ?? 0,
  image: resolveProductImage(p.id, p.image_url),
  heavy: !!p.heavy,
  installation: !!p.installation,
  bulkAvailable: !!p.bulk_available,
  fastDelivery: !!p.fast_delivery,
  crossSellIds: p.cross_sell_ids ?? [],
  active: p.active,
});

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "active"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map(mapDBProduct);
    },
    staleTime: 30_000,
  });

export const adminProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "admin", "all"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []).map(mapDBProduct);
    },
    staleTime: 10_000,
  });

export const paymentSettingsQueryOptions = () =>
  queryOptions({
    queryKey: ["payment_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

export type StockStatus = "out" | "low" | "in";
export const stockStatus = (p: Product): StockStatus => {
  if (p.stock === 0) return "out";
  if (p.stock <= p.lowStockThreshold) return "low";
  return "in";
};
