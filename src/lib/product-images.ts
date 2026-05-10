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
  // Legacy demo IDs
  "inv-1500": inverter,
  "bat-220": battery,
  "cctv-4mp": cctv,
  "dvr-8ch": dvr,
  "sol-330": solar,
  "tv-43": tv,
  "ro-15": purifier,
  "ac-15": ac,

  // CCTV / NVR catalogue (closest available imagery)
  "cp-bullet-24mp": cctv,
  "cp-nvr-64ch-4k": dvr,
  "cp-nvr-32ch-2s": dvr,
  "cp-nvr-32ch-4s": dvr,
  "cp-nvr-8ch-4k": dvr,

  // Desktop / PC components – fall back to TV chassis image as a neutral placeholder
  "iball-cab-mt20": tv,
  "giga-z890-ud": tv,
  "msi-b550m-vdh": tv,
  "apc-2200va-ups": inverter,
  "ant-cpu-ice2": ac,

  // Laptop RAM – battery placeholder until proper renders are uploaded
  "aarvex-ram-8-ddr5-4800": battery,
  "aarvex-ram-16-ddr5-5600": battery,
  "aarvex-ram-4-ddr3-1600": battery,
  "aarvex-ram-8-ddr3-1600": battery,
  "aarvex-ram-8-ddr4-2666": battery,

  // Storage
  "evm-ssd-1tb": purifier,
  "cablet-nvme-c3": purifier,
  "ssd-carry-25": purifier,
  "toshiba-p300-2tb": dvr,
  "seagate-1tb-blue": dvr,
};

export const resolveProductImage = (id: string, fallback?: string | null) =>
  productImageMap[id] ?? fallback ?? "";
