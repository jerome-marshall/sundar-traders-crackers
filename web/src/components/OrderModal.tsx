import * as React from "react";
import { Minus, Plus, X } from "lucide-react";
import { easyText, itemCountLabel, rupees } from "../lib/catalog";
import type { Product, Totals } from "../lib/catalog";
import { useShop } from "../store/shop";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";

interface Props {
  products: Product[];
  totals: Totals;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderModal({ products, totals, open, onOpenChange }: Props) {
  const setQty = useShop((s) => s.setQty);

  React.useEffect(() => {
    if (open && !totals.count) onOpenChange(false);
  }, [open, totals.count, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="flex flex-col">
        <DialogHeader>
          <DialogTitle>Your order ({itemCountLabel(totals.count)})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[40vh] w-full overflow-y-auto">
          {totals.items.map((i) => (
            <div
              key={i.id}
              className="border-b border-dashed border-line py-2 last:border-b-0"
            >
              <div className="text-sm font-semibold">
                {easyText(i.name)}
                {i.pack ? ` (${i.pack})` : ""}
                <span className="font-normal text-muted text-xs">
                  {" "}
                  · {rupees(i.price)} each
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 border-[1.5px] border-accent text-accent"
                  aria-label="Decrease quantity"
                  onClick={() => setQty(products, i.id, i.qty - 1)}
                >
                  <Minus size={16} strokeWidth={2.5} aria-hidden="true" />
                </Button>
                <span className="min-w-10 text-center text-base font-extrabold tabular-nums">
                  {String(i.qty)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 border-[1.5px] border-accent text-accent"
                  aria-label="Increase quantity"
                  onClick={() => setQty(products, i.id, i.qty + 1)}
                >
                  <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                </Button>
                <span className="ml-auto font-bold tabular-nums">{rupees(i.net)}</span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-danger"
                  aria-label="Remove item"
                  onClick={() => setQty(products, i.id, 0)}
                >
                  <X size={18} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <Separator />
          <div className="flex justify-between pt-2.5 font-extrabold text-accent">
            <span>Net total</span>
            <span>{rupees(totals.net)}</span>
          </div>
          <Button
            type="button"
            className="mt-3 w-full bg-accent py-3 text-base font-bold"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
