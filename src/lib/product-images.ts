// Map DB product IDs to bundled image assets (DB only stores image_url that may be empty)
import inverter from "@/assets/inverter.jpg";
import battery from "@/assets/battery.jpg";
import cctv from "@/assets/cctv.jpg";
import dvr from "@/assets/dvr.jpg";
import solar from "@/assets/solar.jpg";
import tv from "@/assets/tv.jpg";
import purifier from "@/assets/purifier.jpg";
import ac from "@/assets/ac.jpg";

export const productImageMap: Record<string, string> = {
  "inv-1500": inverter,
  "bat-220": battery,
  "cctv-4mp": cctv,
  "dvr-8ch": dvr,
  "sol-330": solar,
  "tv-43": tv,
  "ro-15": purifier,
  "ac-15": ac,
};

export const resolveProductImage = (id: string, fallback?: string | null) =>
  productImageMap[id] ?? fallback ?? "";
