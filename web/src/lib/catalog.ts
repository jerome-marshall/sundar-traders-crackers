export interface Product {
  id: string;
  category: string;
  name: string;
  pack: string;
  mrp: number;
  price: number;
  img: string;
}

export interface Family {
  id: string;
  category: string;
  name: string;
  variantIds: string[];
}

export interface CartLine {
  id: string;
  name: string;
  qty: number;
  mrp: number;
  price: number;
  pack: string;
  net: number;
  mrpTotal: number;
}

export interface Totals {
  items: CartLine[];
  mrp: number;
  net: number;
  count: number;
  savings: number;
}

export const WHATSAPP = "919600219655";

/* Variant-family pilot: SPARKLERS grouped by colour/effect. One card per
 * colour, dropdown picks the size. Variant ids stay the orderable unit. */
export const FAMILIES: Family[] = [
  {
    id: "fam-spark-electric",
    category: "SPARKLERS",
    name: "Sparklers Electric",
    variantIds: ["1", "3", "7", "11", "15", "19"],
  },
  {
    id: "fam-spark-colour",
    category: "SPARKLERS",
    name: "Sparklers Colour",
    variantIds: ["2", "4", "8", "12", "16"],
  },
  {
    id: "fam-spark-green",
    category: "SPARKLERS",
    name: "Sparklers Green",
    variantIds: ["5", "9", "13", "17"],
  },
  {
    id: "fam-spark-red",
    category: "SPARKLERS",
    name: "Sparklers Red",
    variantIds: ["6", "10", "14", "18"],
  },
];

export const GROUPED_IDS: Record<string, string> = {};
for (const f of FAMILIES) {
  for (const id of f.variantIds) GROUPED_IDS[id] = f.id;
}

export function productById(products: Product[], id: string): Product | null {
  for (const p of products) if (p.id === id) return p;
  return null;
}

export function familyById(fid: string): Family | null {
  for (const f of FAMILIES) if (f.id === fid) return f;
  return null;
}

export function sizeLabel(p: Product): string {
  const m = /^\s*(\d+\s*CM)/i.exec(p.name);
  return m ? easyText(m[1]) : easyText(p.name);
}

export function rupees(n: number): string {
  const r = Math.round((Number(n) || 0) * 100) / 100;
  return "₹" + r.toLocaleString("en-IN");
}

export function easyText(s: string | null | undefined): string {
  return String(s == null ? "" : s)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function offPct(p: Product): number {
  if (!p.mrp || p.mrp <= p.price) return 0;
  return Math.round((1 - p.price / p.mrp) * 100);
}

export function computeTotals(
  products: Product[],
  qty: Record<string, number>,
): Totals {
  const items: CartLine[] = [];
  let mrp = 0;
  let net = 0;
  let count = 0;
  for (const p of products) {
    const q = Number(qty[p.id] || 0);
    if (q > 0) {
      const line: CartLine = {
        id: p.id,
        name: p.name,
        qty: q,
        mrp: p.mrp,
        price: p.price,
        pack: p.pack || "",
        net: Math.round(p.price * q * 100) / 100,
        mrpTotal: Math.round(p.mrp * q * 100) / 100,
      };
      items.push(line);
      mrp += line.mrpTotal;
      net += line.net;
      count += line.qty;
    }
  }
  return { items, mrp, net, count, savings: mrp - net };
}

export function clampQty(value: unknown): number {
  const n = Math.floor(Number(value) || 0);
  if (n < 0) return 0;
  if (n > 500) return 500;
  return n;
}

export function matchesProduct(
  p: Product,
  category: string,
  query: string,
): boolean {
  if (category !== "All" && p.category !== category) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    (p.name + " " + p.id + " " + p.category + " " + (p.pack || ""))
      .toLowerCase()
      .indexOf(q) !== -1
  );
}

export function matchesFamily(
  products: Product[],
  fam: Family,
  category: string,
  query: string,
): boolean {
  if (category !== "All" && fam.category !== category) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if ((fam.name + " " + fam.category).toLowerCase().indexOf(q) !== -1)
    return true;
  return fam.variantIds.some((id) => {
    const p = productById(products, id);
    return (
      p &&
      (p.name + " " + p.id + " " + (p.pack || ""))
        .toLowerCase()
        .indexOf(q) !== -1
    );
  });
}

export function familyMatchVariant(
  products: Product[],
  fam: Family,
  query: string,
): Product | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const vid of fam.variantIds) {
    const p = productById(products, vid);
    if (
      p &&
      (p.name + " " + p.id + " " + (p.pack || ""))
        .toLowerCase()
        .indexOf(q) !== -1
    )
      return p;
  }
  return null;
}

export function itemCountLabel(count: number): string {
  return count + (count === 1 ? " item" : " items");
}
