import * as React from "react";
import { Minus, Plus } from "lucide-react";
import {
  FAMILIES,
  GROUPED_IDS,
  easyText,
  familyMatchVariant,
  matchesFamily,
  matchesProduct,
  offPct,
  productById,
  rupees,
  sizeLabel,
} from "../lib/catalog";
import type { Family, Product } from "../lib/catalog";
import { useShop } from "../store/shop";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";

export function Stepper({
  products,
  product,
  qty,
}: {
  products: Product[];
  product: Product;
  qty: number;
}) {
  const setQty = useShop((s) => s.setQty);
  return (
    <div className="qty" role="group" aria-label="Quantity">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQty(products, product.id, qty - 1)}
      >
        <Minus strokeWidth={2.5} aria-hidden="true" />
      </button>
      <input
        value={String(qty)}
        inputMode="numeric"
        aria-label="Quantity"
        onChange={(e) => setQty(products, product.id, e.target.value)}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => setQty(products, product.id, qty + 1)}
      >
        <Plus strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}

function BuyZone({
  products,
  product,
  qty,
}: {
  products: Product[];
  product: Product;
  qty: number;
}) {
  const setQty = useShop((s) => s.setQty);
  if (qty === 0) {
    return (
      <button
        type="button"
        className="add-btn"
        onClick={() => setQty(products, product.id, 1)}
      >
        Add <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
      </button>
    );
  }
  return <Stepper products={products} product={product} qty={qty} />;
}

function Prices({ product }: { product: Product }) {
  return (
    <div className="prices">
      <s>{rupees(product.mrp)}</s>
      <span className="now">{rupees(product.price)}</span>
    </div>
  );
}

function DiscountBadge({ product }: { product: Product }) {
  const off = offPct(product);
  if (off <= 0) return null;
  return <span className="off">−{off}%</span>;
}

export function ProductCard({
  products,
  product,
}: {
  products: Product[];
  product: Product;
}) {
  const qty = useShop((s) => Number(s.qty[product.id] || 0));
  return (
    <article className="card" data-id={product.id} data-qty={String(qty)}>
      <div className="photo">
        <img src={product.img} alt={easyText(product.name)} loading="lazy" />
        <DiscountBadge product={product} />
      </div>
      <div className="card-body">
        <div className="name">{easyText(product.name)}</div>
        <div className="pack">{product.pack || ""}</div>
        <Prices product={product} />
        <div className="buy">
          <BuyZone products={products} product={product} qty={qty} />
        </div>
      </div>
    </article>
  );
}

export function FamilyCard({
  fam,
  products,
}: {
  fam: Family;
  products: Product[];
}) {
  const query = useShop((s) => s.query);
  const sel = useShop((s) => s.sel[fam.id]);
  const syncFamilyHit = useShop((s) => s.syncFamilyHit);
  const selectVariant = useShop((s) => s.selectVariant);
  const qtyById = useShop((s) => s.qty);

  const hit = familyMatchVariant(products, fam, query);
  React.useEffect(() => {
    if (hit) syncFamilyHit(fam.id, hit.id);
  }, [hit, fam.id, syncFamilyHit]);

  const stored = sel ? productById(products, sel) : null;
  const first = productById(products, fam.variantIds[0]);
  const selected =
    stored && fam.variantIds.indexOf(stored.id) !== -1 ? stored : first;
  if (!selected || !first) return null;
  const qty = Number(qtyById[selected.id] || 0);

  return (
    <article className="card" data-family={fam.id} data-qty={String(qty)}>
      <div className="photo">
        <img src={first.img} alt={fam.name} loading="lazy" />
        <DiscountBadge product={selected} />
      </div>
      <div className="card-body">
        <div className="fam-head">
          <div className="name">{fam.name}</div>
          <Select
            value={selected.id}
            onValueChange={(vid) => selectVariant(fam.id, vid)}
          >
            <SelectTrigger aria-label="Choose variant">
              {sizeLabel(selected) + (qty > 0 ? " ·" + qty : "")}
            </SelectTrigger>
            <SelectContent>
              {fam.variantIds.map((vid) => {
                const vp = productById(products, vid);
                if (!vp) return null;
                const vq = Number(qtyById[vid] || 0);
                return (
                  <SelectItem key={vid} value={vid}>
                    {sizeLabel(vp) + (vq > 0 ? " ·" + vq : "")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="pack">{selected.pack || ""}</div>
        <Prices product={selected} />
        <div className="buy">
          <BuyZone products={products} product={selected} qty={qty} />
        </div>
      </div>
    </article>
  );
}

interface Entry {
  kind: "family" | "product";
  fam?: Family;
  product?: Product;
}

export function Catalog({ products }: { products: Product[] }) {
  const category = useShop((s) => s.category);
  const query = useShop((s) => s.query);

  const groups: string[] = [];
  const map: Record<string, Entry[]> = {};
  function push(cat: string, entry: Entry) {
    if (!map[cat]) {
      map[cat] = [];
      groups.push(cat);
    }
    map[cat].push(entry);
  }
  for (const fam of FAMILIES) {
    if (matchesFamily(products, fam, category, query))
      push(fam.category, { kind: "family", fam });
  }
  for (const p of products) {
    if (!GROUPED_IDS[p.id] && matchesProduct(p, category, query))
      push(p.category, { kind: "product", product: p });
  }

  if (!groups.length) {
    return <div className="empty">No crackers match your search.</div>;
  }
  return (
    <>
      {groups.map((cat) => (
        <React.Fragment key={cat}>
          <div className="cat-title">{easyText(cat)}</div>
          <div className="grid">
            {map[cat].map((e) =>
              e.kind === "family" && e.fam ? (
                <FamilyCard key={e.fam.id} fam={e.fam} products={products} />
              ) : e.product ? (
                <ProductCard
                  key={e.product.id}
                  products={products}
                  product={e.product}
                />
              ) : null,
            )}
          </div>
        </React.Fragment>
      ))}
    </>
  );
}
