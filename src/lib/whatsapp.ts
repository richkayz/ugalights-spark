export function whatsappNumber(raw: string | undefined | null): string {
  return (raw ?? "").replace(/[^0-9]/g, "");
}

export function whatsappLink(number: string | undefined | null, message: string): string {
  const digits = whatsappNumber(number);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function productEnquiryMessage(args: {
  productName: string;
  url: string;
  variant?: string | null;
  quantity?: number;
}): string {
  const lines = [
    `Hello UGALights, I would like to enquire about:`,
    `Product: ${args.productName}`,
  ];
  if (args.variant) lines.push(`Option: ${args.variant}`);
  if (args.quantity) lines.push(`Quantity: ${args.quantity}`);
  lines.push(`Link: ${args.url}`);
  return lines.join("\n");
}

export function orderMessage(args: {
  customerName: string;
  phone: string;
  location: string;
  items: { name: string; variant?: string | null; quantity: number; total: number }[];
  total: number;
  orderNumber?: string;
}): string {
  const lines = [`Hello UGALights, I would like to place an order.`];
  if (args.orderNumber) lines.push(`Order: ${args.orderNumber}`);
  lines.push(`Name: ${args.customerName}`, `Phone: ${args.phone}`);
  lines.push("", "Items:");
  for (const item of args.items) {
    lines.push(
      `- ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.quantity} = UGX ${Math.round(item.total).toLocaleString("en-UG")}`,
    );
  }
  lines.push(
    "",
    `Total: UGX ${Math.round(args.total).toLocaleString("en-UG")}`,
    `Delivery location: ${args.location}`,
  );
  return lines.join("\n");
}
