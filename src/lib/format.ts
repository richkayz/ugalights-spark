export function formatUGX(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0);
  return `UGX ${Math.round(value).toLocaleString("en-UG")}`;
}

export function effectivePrice(price: number, salePrice: number | null): number {
  return salePrice != null && salePrice > 0 && salePrice < price ? salePrice : price;
}

export function discountPercent(price: number, salePrice: number | null): number | null {
  if (salePrice == null || salePrice <= 0 || salePrice >= price) return null;
  return Math.round(((price - salePrice) / price) * 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cod: "Cash on Delivery",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  mobile_money: "Mobile Money",
  whatsapp: "WhatsApp Order",
};

export const UGANDA_LOCATIONS = [
  "Kampala - Central",
  "Kampala - Nakawa",
  "Kampala - Kawempe",
  "Kampala - Makindye",
  "Kampala - Rubaga",
  "Wakiso",
  "Entebbe",
  "Mukono",
  "Jinja",
  "Mbarara",
  "Gulu",
  "Mbale",
  "Fort Portal",
  "Masaka",
  "Arua",
  "Lira",
  "Other (upcountry)",
];
