import inverter from "@/assets/inverter.jpg";
import battery from "@/assets/battery.jpg";
import cctv from "@/assets/cctv.jpg";
import dvr from "@/assets/dvr.jpg";
import solar from "@/assets/solar.jpg";
import tv from "@/assets/tv.jpg";
import purifier from "@/assets/purifier.jpg";
import ac from "@/assets/ac.jpg";

export type Category = "Power" | "Security" | "Solar" | "Appliances";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  image: string;
  heavy?: boolean;
  installation?: boolean;
  bulkAvailable?: boolean;
  fastDelivery?: boolean;
  crossSellIds?: string[];
};

export const PRODUCTS: Product[] = [
  {
    id: "inv-1500",
    name: "PowerMax 1500VA Pure Sine Wave Inverter",
    brand: "Voltzo",
    category: "Power",
    price: 12499,
    mrp: 15999,
    rating: 4.6,
    reviews: 842,
    image: inverter,
    installation: true,
    bulkAvailable: true,
    fastDelivery: true,
    crossSellIds: ["bat-220"],
  },
  {
    id: "bat-220",
    name: "Tall Tubular Inverter Battery 220Ah",
    brand: "Voltzo",
    category: "Power",
    price: 18750,
    mrp: 22500,
    rating: 4.7,
    reviews: 1204,
    image: battery,
    heavy: true,
    installation: true,
    bulkAvailable: true,
    fastDelivery: true,
    crossSellIds: ["inv-1500"],
  },
  {
    id: "cctv-4mp",
    name: "4MP HD Dome CCTV Camera with Night Vision",
    brand: "Sentinel",
    category: "Security",
    price: 3299,
    mrp: 4499,
    rating: 4.5,
    reviews: 2310,
    image: cctv,
    installation: true,
    bulkAvailable: true,
    fastDelivery: true,
    crossSellIds: ["dvr-8ch"],
  },
  {
    id: "dvr-8ch",
    name: "8-Channel Full HD DVR Recorder",
    brand: "Sentinel",
    category: "Security",
    price: 5999,
    mrp: 7999,
    rating: 4.4,
    reviews: 678,
    image: dvr,
    installation: true,
    bulkAvailable: true,
    fastDelivery: true,
    crossSellIds: ["cctv-4mp"],
  },
  {
    id: "sol-330",
    name: "330W Polycrystalline Solar Panel",
    brand: "SunGrid",
    category: "Solar",
    price: 8999,
    mrp: 11500,
    rating: 4.7,
    reviews: 451,
    image: solar,
    heavy: true,
    installation: true,
    bulkAvailable: true,
    fastDelivery: false,
    crossSellIds: ["inv-1500"],
  },
  {
    id: "tv-43",
    name: '43" 4K Ultra HD Smart LED TV',
    brand: "Pixela",
    category: "Appliances",
    price: 24999,
    mrp: 32999,
    rating: 4.5,
    reviews: 3892,
    image: tv,
    installation: true,
    fastDelivery: true,
  },
  {
    id: "ro-15",
    name: "RO + UV Water Purifier 15L",
    brand: "AquaPure",
    category: "Appliances",
    price: 13499,
    mrp: 17999,
    rating: 4.6,
    reviews: 1523,
    image: purifier,
    installation: true,
    fastDelivery: true,
  },
  {
    id: "ac-15",
    name: "1.5 Ton 5-Star Inverter Split AC",
    brand: "Frosta",
    category: "Appliances",
    price: 38999,
    mrp: 49999,
    rating: 4.7,
    reviews: 2102,
    image: ac,
    heavy: true,
    installation: true,
    fastDelivery: false,
    bulkAvailable: true,
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
