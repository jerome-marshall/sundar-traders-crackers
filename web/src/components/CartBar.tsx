import * as React from "react";
import { ChevronUp, Minus, Plus, X } from "lucide-react";
import { easyText, itemCountLabel, rupees } from "../lib/catalog";
import type { Product, Totals } from "../lib/catalog";
import { useShop } from "../store/shop";

interface Props {
  products: Product[];
  totals: Totals;
  show: boolean;
  open: boolean;
  onToggle: () => void;
  onBuy: () => void;
  barRef: React.RefObject<HTMLElement | null>;
}

export function CartBar({
  products,
  totals,
  show,
  open,
  onToggle,
  onBuy,
  barRef,
}: Props) {
  const setQty = useShop((s) => s.setQty);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        onToggle();
      }
    }
  }

  return (
    <div
      className={"bar" + (show ? " show" : "") + (open ? " open" : "")}
      id="bar"
      ref={barRef as React.RefObject<HTMLDivElement>}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={
        open
          ? `Hide order details, ${itemCountLabel(totals.count)}`
          : `Show order details, ${itemCountLabel(totals.count)}`
      }
    >
      <div className="bar-items" id="barItems">
        <div
          className="bar-items-in"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          {totals.items.map((i) => (
            <div className="bar-item" key={i.id}>
              <div className="bar-item-name">
                <span className="bar-item-title">
                  {easyText(i.name)}
                  {i.pack ? ` (${i.pack})` : ""}
                </span>
                <span className="bar-unit">{rupees(i.price)} each</span>
              </div>
              <div className="bar-item-ctl">
                <button
                  type="button"
                  className="bar-step"
                  aria-label={`Decrease ${easyText(i.name)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setQty(products, i.id, i.qty - 1);
                  }}
                >
                  <Minus size={14} strokeWidth={2.5} aria-hidden="true" />
                </button>
                <span className="bar-qty" aria-label="Quantity">
                  {String(i.qty)}
                </span>
                <button
                  type="button"
                  className="bar-step"
                  aria-label={`Increase ${easyText(i.name)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setQty(products, i.id, i.qty + 1);
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
                </button>
                <span className="qr">{rupees(i.net)}</span>
                <button
                  type="button"
                  className="bar-remove"
                  aria-label={`Remove ${easyText(i.name)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setQty(products, i.id, 0);
                  }}
                >
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bar-main">
        <span className="bar-chevron" aria-hidden="true">
          <ChevronUp size={20} strokeWidth={2.5} />
        </span>
        <div className="bar-meta">
          <div id="barCount">{itemCountLabel(totals.count)}</div>
          <div className="tot" id="barTotal">
            {rupees(totals.net)}
          </div>
        </div>
        <button
          className="bar-cta"
          id="barCta"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBuy();
          }}
        >
          Buy
        </button>
      </div>
    </div>
  );
}
