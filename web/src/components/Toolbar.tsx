import { Search, X } from "lucide-react";
import { easyText } from "../lib/catalog";
import type { Product } from "../lib/catalog";
import { useShop } from "../store/shop";

export function Toolbar({ products }: { products: Product[] }) {
  const query = useShop((s) => s.query);
  const setQuery = useShop((s) => s.setQuery);
  const category = useShop((s) => s.category);
  const setCategory = useShop((s) => s.setCategory);

  const cats = ["All"];
  for (const p of products) {
    if (cats.indexOf(p.category) === -1) cats.push(p.category);
  }

  function pickCategory(c: string) {
    setCategory(c);
    const target =
      document.querySelector(".cat-title") || document.getElementById("catalog");
    const toolbar = document.querySelector(".toolbar");
    const off = (toolbar ? toolbar.clientHeight : 120) + 2;
    if (target) {
      const y = target.getBoundingClientRect().top + window.scrollY - off;
      window.scrollTo({ top: y < 0 ? 0 : y, behavior: "smooth" });
    }
  }

  return (
    <div className="toolbar">
      <div className="search-wrap">
        <input
          className="search"
          id="search"
          type="search"
          placeholder="Search crackers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!query && (
          <span className="search-icon-btn" id="searchMag" aria-hidden="true">
            <Search size={20} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        {!!query && (
          <button
            className="search-icon-btn"
            id="searchClear"
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              document.getElementById("search")?.focus();
            }}
          >
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="chips" id="chips">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={"chip" + (category === c ? " active" : "")}
            onClick={() => pickCategory(c)}
          >
            {c === "All" ? "All" : easyText(c)}
          </button>
        ))}
      </div>
    </div>
  );
}
