import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { itemCountLabel, rupees } from "../lib/catalog";
import type { Totals } from "../lib/catalog";
import { useShop } from "../store/shop";
import type { Customer } from "../store/shop";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const schema = z.object({
  name: z.string().min(2, "Please enter your name."),
  phone: z
    .string()
    .refine(
      (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")),
      "Enter a valid 10-digit mobile number.",
    ),
  address: z.string().min(8, "Please enter your full address."),
  notes: z.string(),
});

type Fields = z.infer<typeof schema>;

interface Props {
  totals: Totals;
  banner: string;
  setBanner: (msg: string) => void;
  onShowDetails: () => void;
  summaryRef: React.RefObject<HTMLDivElement | null>;
}

export function Checkout({
  totals,
  banner,
  setBanner,
  onShowDetails,
  summaryRef,
}: Props) {
  const customer = useShop((s) => s.customer);
  const setCustomer = useShop((s) => s.setCustomer);
  const placeOrder = useShop((s) => s.placeOrder);
  const sectionRef = React.useRef<HTMLElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: customer,
  });

  React.useEffect(() => {
    const sub = watch((v) => {
      setCustomer({
        name: v.name ?? "",
        phone: v.phone ?? "",
        address: v.address ?? "",
        notes: v.notes ?? "",
      });
    });
    return () => sub.unsubscribe();
  }, [watch, setCustomer]);

  function scrollToCheckout() {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onValid(data: Fields) {
    const cust: Customer = {
      name: data.name.trim(),
      phone: data.phone.replace(/\D/g, ""),
      address: data.address.trim(),
      notes: data.notes.trim(),
    };
    setCustomer(cust);
    setBanner("");
    placeOrder({
      orderId: "ST-" + Date.now().toString().slice(-6),
      netTotal: totals.net,
      items: totals.items,
      customer: cust,
    });
    window.scrollTo(0, 0);
  }

  function onSubmit(e: React.FormEvent) {
    if (!totals.count) {
      e.preventDefault();
      setBanner("Add quantity for at least one cracker.");
      scrollToCheckout();
      return;
    }
    void handleSubmit(onValid, scrollToCheckout)(e);
  }

  return (
    <section
      className="checkout"
      id="checkout"
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      <h2>Your details</h2>
      <p className="tagline">
        Name, address and mobile are required so we can confirm the order.
      </p>
      <form onSubmit={onSubmit} noValidate>
        <label className="field-label" htmlFor="custName">
          Your name <span className="req">*</span>
          <Input
            id="custName"
            className="field-input"
            autoComplete="name"
            {...register("name")}
          />
        </label>
        {errors.name ? (
          <p className="field-error">{errors.name.message}</p>
        ) : null}
        <label className="field-label" htmlFor="custPhone">
          Mobile number <span className="req">*</span>
          <Input
            id="custPhone"
            className="field-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            placeholder="10-digit number"
            {...register("phone")}
          />
        </label>
        {errors.phone ? (
          <p className="field-error">{errors.phone.message}</p>
        ) : null}
        <label className="field-label" htmlFor="custAddress">
          Address <span className="req">*</span>
          <Textarea
            id="custAddress"
            className="field-input"
            autoComplete="street-address"
            placeholder="House / street, area, city, pincode"
            {...register("address")}
          />
        </label>
        {errors.address ? (
          <p className="field-error">{errors.address.message}</p>
        ) : null}
        <label className="field-label" htmlFor="custNotes">
          Notes (optional)
          <Textarea
            id="custNotes"
            className="field-input"
            placeholder="Preferred time, landmarks, etc."
            {...register("notes")}
          />
        </label>
        <div className="summary" id="orderSummary" ref={summaryRef}>
          <div className="sum-line">
            <span>Items</span>
            <span>{String(totals.count)}</span>
          </div>
          <div className="sum-line">
            <span>MRP total</span>
            <span>{rupees(totals.mrp)}</span>
          </div>
          <div className="sum-line">
            <span>You save</span>
            <span>{rupees(totals.savings)}</span>
          </div>
          <div className="sum-line grand">
            <span>Net total</span>
            <span>{rupees(totals.net)}</span>
          </div>
        </div>
        {totals.count > 0 ? (
          <button
            className="details-link"
            id="detailsLink"
            type="button"
            onClick={onShowDetails}
          >
            View order details ({itemCountLabel(totals.count)})
          </button>
        ) : null}
        <p className="courier-note">
          Courier charges extra based on the location.
        </p>
        <div className="error" id="formError">
          {banner}
        </div>
        <button className="submit" id="submitBtn" type="submit">
          Place order 🪔
        </button>
      </form>
    </section>
  );
}
