import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { CartBar } from "./components/CartBar";
import { Catalog } from "./components/Catalog";
import { Checkout } from "./components/Checkout";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { OrderModal } from "./components/OrderModal";
import { Success } from "./components/Success";
import { Toolbar } from "./components/Toolbar";
import type { Product } from "./lib/catalog";
import { selectTotals } from "./store/shop";
import { useShop } from "./store/shop";

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("products.json");
  if (!res.ok) throw new Error("products load failed");
  return (await res.json()) as Product[];
}

export function ShopPage() {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: Infinity,
  });

  const qty = useShop((s) => s.qty);
  const view = useShop((s) => s.view);
  const order = useShop((s) => s.order);

  const totals = React.useMemo(
    () => selectTotals(products ?? [], qty),
    [products, qty],
  );

  const summaryRef = React.useRef<HTMLDivElement | null>(null);
  const barRef = React.useRef<HTMLElement | null>(null);
  const lastY = React.useRef(0);
  const [barOpen, setBarOpen] = React.useState(false);
  const [barShow, setBarShow] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [banner, setBanner] = React.useState("");

  React.useEffect(() => {
    lastY.current = window.scrollY || 0;
    function summaryMostlyVisible(): boolean {
      const s = summaryRef.current;
      if (!s) return false;
      const r = s.getBoundingClientRect();
      if (r.height <= 0) return false;
      const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      return vis >= r.height * 0.5;
    }
    function onScroll() {
      const y = window.scrollY || 0;
      if (Math.abs(y - lastY.current) > 5) setBarOpen(false);
      lastY.current = y;
      setBarShow(totals.count > 0 && !summaryMostlyVisible());
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [totals.count, view]);

  React.useEffect(() => {
    if (!totals.count) setBarOpen(false);
  }, [totals.count]);

  React.useEffect(() => {
    if (!barOpen) return;
    function onDocClick(e: MouseEvent) {
      if (
        barRef.current &&
        e.target instanceof Node &&
        !barRef.current.contains(e.target)
      ) {
        setBarOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [barOpen]);

  function buyNow() {
    setBarOpen(false);
    document
      .getElementById("checkout")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (view === "success" && order) {
    return (
      <>
        <Hero />
        <Success order={order} />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Hero />
      <main className="wrap" id="shopView">
        {isLoading || !products ? (
          <div className="toolbar">
            <div className="empty">Loading crackers…</div>
          </div>
        ) : isError ? (
          <div className="toolbar">
            <div className="empty">
              Could not load products. Please refresh.
            </div>
          </div>
        ) : (
          <>
            <Toolbar products={products} />
            <div id="catalog">
              <Catalog products={products} />
            </div>
          </>
        )}
        <CartBar
          products={products ?? []}
          totals={totals}
          show={barShow}
          open={barOpen}
          onToggle={() => setBarOpen((o) => !o)}
          onBuy={buyNow}
          barRef={barRef}
        />
        <Checkout
          totals={totals}
          banner={banner}
          setBanner={setBanner}
          onShowDetails={() => setDetailsOpen(true)}
          summaryRef={summaryRef}
        />
      </main>
      {products ? (
        <OrderModal
          products={products}
          totals={totals}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      ) : null}
      <Footer />
    </>
  );
}
