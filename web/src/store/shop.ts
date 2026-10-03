import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clampQty,
  computeTotals,
  familyById,
  productById,
} from "../lib/catalog";
import type { Product, Totals } from "../lib/catalog";

export interface Customer {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export interface PlacedOrder {
  orderId: string;
  netTotal: number;
  items: Totals["items"];
  customer: Customer;
}

interface ShopState {
  qty: Record<string, number>;
  sel: Record<string, string>;
  category: string;
  query: string;
  customer: Customer;
  view: "shop" | "success";
  order: PlacedOrder | null;
  setQty: (products: Product[], id: string, value: unknown) => void;
  selectVariant: (fid: string, vid: string) => void;
  syncFamilyHit: (fid: string, vid: string) => void;
  setCategory: (c: string) => void;
  setQuery: (q: string) => void;
  setCustomer: (c: Customer) => void;
  placeOrder: (order: PlacedOrder) => void;
  resetOrder: () => void;
}

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      qty: {},
      sel: {},
      category: "All",
      query: "",
      customer: { name: "", phone: "", address: "", notes: "" },
      view: "shop",
      order: null,
      setQty: (products, id, value) =>
        set((s) => {
          const n = clampQty(value);
          const qty = { ...s.qty };
          if (n === 0) delete qty[id];
          else qty[id] = n;
          // Keep a family dropdown pointing at a variant that still exists.
          const sel = { ...s.sel };
          for (const fid of Object.keys(sel)) {
            const fam = familyById(fid);
            if (
              fam &&
              fam.variantIds.indexOf(sel[fid]) === -1 &&
              productById(products, sel[fid]) == null
            ) {
              delete sel[fid];
            }
          }
          return { qty, sel };
        }),
      selectVariant: (fid, vid) => {
        const fam = familyById(fid);
        if (!fam || fam.variantIds.indexOf(vid) === -1) return;
        set((s) => ({ sel: { ...s.sel, [fid]: vid } }));
      },
      syncFamilyHit: (fid, vid) =>
        set((s) => (s.sel[fid] === vid ? s : { sel: { ...s.sel, [fid]: vid } })),
      setCategory: (c) => set({ category: c }),
      setQuery: (q) => set({ query: q }),
      setCustomer: (c) => set({ customer: c }),
      placeOrder: (order) => set({ view: "success", order }),
      resetOrder: () => set({ qty: {}, view: "shop", order: null }),
    }),
    {
      name: "sundar-traders-cart",
      partialize: (s) => ({
        qty: s.qty,
        sel: s.sel,
        category: s.category,
        query: s.query,
        customer: s.customer,
      }),
    },
  ),
);

export function selectTotals(
  products: Product[],
  qty: Record<string, number>,
): Totals {
  return computeTotals(products, qty);
}
