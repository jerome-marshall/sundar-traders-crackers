import { WHATSAPP, easyText, rupees } from "../lib/catalog";
import { useShop } from "../store/shop";
import type { PlacedOrder } from "../store/shop";

export function Success({ order }: { order: PlacedOrder }) {
  const resetOrder = useShop((s) => s.resetOrder);

  const text =
    "Order " +
    order.orderId +
    "\nName: " +
    order.customer.name +
    "\nMobile: " +
    order.customer.phone +
    "\nAddress: " +
    order.customer.address +
    "\nTotal: " +
    rupees(order.netTotal);
  const waHref =
    "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text);

  function printReceipt() {
    document.body.classList.add("receipt");
    window.print();
    document.body.classList.remove("receipt");
  }

  return (
    <section className="success wrap" id="successView">
      <div className="success-card">
        <div className="success-top">
          <button
            className="home-btn"
            type="button"
            id="homeBtn"
            aria-label="Home"
            onClick={() => {
              resetOrder();
              window.scrollTo(0, 0);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3.2 3.5 10.2c-.3.3-.4.7-.3 1.1.1.4.4.7.8.8h1.2V20c0 .6.4 1 1 1h4.2v-5.2h3.2V21h4.2c.6 0 1-.4 1-1v-7.9h1.2c.4 0 .7-.3.8-.8.1-.4 0-.8-.3-1.1L12 3.2z" />
            </svg>
          </button>
        </div>
        <div className="success-party" aria-hidden="true">
          🎉
        </div>
        <h2>Order received</h2>
        <p className="success-thanks">
          Thank you, {order.customer.name}. We will call you to confirm.
        </p>
        <div className="success-oid-label">Order ID</div>
        <div className="oid" id="successId">
          {order.orderId}
        </div>
        <div className="success-items" id="successBody">
          {order.items.map((i) => (
            <div className="success-item" key={i.id}>
              <span>
                {i.qty} × {easyText(i.name)}
                {i.pack ? ` (${i.pack})` : ""}
              </span>
              <span className="amt">{rupees(i.net)}</span>
            </div>
          ))}
          <div className="success-total">
            <span>Net total</span>
            <span>{rupees(order.netTotal)}</span>
          </div>
        </div>
        <div className="success-cta">
          <a
            className="wa"
            id="waLink"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send this order on WhatsApp
          </a>
          <button
            className="print-rate"
            type="button"
            id="printOrder"
            onClick={printReceipt}
          >
            Print receipt
          </button>
        </div>
      </div>
    </section>
  );
}
