import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

export type DBProduct = Database["public"]["Tables"]["products"]["Row"];
type VisibleProduct = Database["public"]["Functions"]["get_visible_products"]["Returns"][number];

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  brandName: string;
  modelName: string;
  category: string;
  description: string;
  price: number;
  retailPrice: number;
  dealerPrice: number | null;
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
  voltage: string | null;
  ahRating: string | null;
  resolution: string | null;
  warrantyPeriod: string | null;
  technicalCapacity: string | null;
  active: boolean;
  createdAt: string | null;
};

export const mapDBProduct = (p: DBProduct | VisibleProduct): Product => ({
  id: p.id,
  sku: p.sku,
  name: p.name,
  brand: p.brand,
  brandName: p.brand_name ?? p.brand,
  modelName: p.model_name ?? p.sku,
  category: String(p.category),
  description: p.description ?? "",
  price: Number(p.price),
  retailPrice: Number(p.retail_price ?? p.price),
  dealerPrice: p.dealer_price !== null && p.dealer_price !== undefined ? Number(p.dealer_price) : null,
  mrp: Number(p.mrp),
  bulkPrice: p.bulk_price !== null ? Number(p.bulk_price) : null,
  bulkMinQty: p.bulk_min_qty,
  stock: p.stock,
  lowStockThreshold: p.low_stock_threshold,
  rating: Number(p.rating ?? 4.5),
  reviews: p.reviews ?? 0,
  image: p.image_url ?? "",
  heavy: !!p.heavy,
  installation: !!p.installation,
  bulkAvailable: !!p.bulk_available,
  fastDelivery: !!p.fast_delivery,
  crossSellIds: p.cross_sell_ids ?? [],
  voltage: p.voltage ?? null,
  ahRating: p.ah_rating ?? null,
  resolution: p.resolution ?? null,
  warrantyPeriod: p.warranty_period ?? null,
  technicalCapacity: p.technical_capacity ?? null,
  active: p.active,
  createdAt: (p as { created_at?: string | null }).created_at ?? null,
});

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const productPriceForRole = (p: Product, isDealer: boolean) =>
  isDealer && p.dealerPrice != null ? p.dealerPrice : p.retailPrice;

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "active"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.rpc("get_visible_products");
      if (error) throw error;
      return (data ?? []).map(mapDBProduct);
    },
    staleTime: 30_000,
  });

export const adminProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "admin", "all"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.rpc("get_admin_products");
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

export type Category = { id: string; name: string; sort_order: number };

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await (supabase as any)
        .from("categories")
        .select("id,name,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
  });

export type StockStatus = "out" | "low" | "in";
export const stockStatus = (p: Product): StockStatus => {
  if (p.stock === 0) return "out";
  if (p.stock <= p.lowStockThreshold) return "low";
  return "in";
};
