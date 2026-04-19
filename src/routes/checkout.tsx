import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  Truck,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, cartTotals } from "@/lib/cart-store";
import { formatINR } from "@/lib/catalog";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Voltzo" },
      {
        name: "description",
        content: "Complete your order with shipping, installation and secure payment.",
      },
    ],
  }),
  component: CheckoutPage,
});

const STEPS = ["Info", "Shipping", "Payment"] as const;
type Step = (typeof STEPS)[number];

const INSTALL_FEE = 499;

function CheckoutPage() {
  const { items } = useCart();
  const { subtotal, savings } = cartTotals(items);
  const [step, setStep] = useState<Step>("Info");
  const [installation, setInstallation] = useState(true);
  const [shipping, setShipping] = useState<"standard" | "express">("standard");

  const shippingFee = shipping === "express" ? 299 : 0;
  const installFee = installation ? INSTALL_FEE : 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shippingFee + installFee + tax;

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };
  const goPrev = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  return (
    <main className="bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Secure Checkout
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Complete your order
            </h1>
          </div>
          <Link
            to="/"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            ← Continue shopping
          </Link>
        </div>

        {/* Stepper */}
        <Stepper step={step} setStep={setStep} />

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[3fr,2fr] lg:items-start">
            {/* LEFT 60% */}
            <section className="space-y-6">
              {step === "Info" && <InfoStep />}
              {step === "Shipping" && (
                <ShippingStep
                  installation={installation}
                  setInstallation={setInstallation}
                  shipping={shipping}
                  setShipping={setShipping}
                />
              )}
              {step === "Payment" && <PaymentStep />}

              {/* Step nav */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={goPrev}
                  disabled={stepIndex === 0}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  ← Back
                </button>
                {step !== "Payment" ? (
                  <button
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition-transform hover:scale-[1.02]"
                  >
                    Continue <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <PlaceOrderButton total={total} />
                )}
              </div>
            </section>

            {/* RIGHT 40% — Sticky glass summary */}
            <aside className="lg:sticky lg:top-24">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                savings={savings}
                shippingFee={shippingFee}
                installFee={installFee}
                tax={tax}
                total={total}
                installation={installation}
                shipping={shipping}
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------- Stepper ---------- */
function Stepper({ step, setStep }: { step: Step; setStep: (s: Step) => void }) {
  const idx = STEPS.indexOf(step);
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setStep(s)}
              className={cn(
                "flex items-center gap-2.5 rounded-full px-3 py-2 text-left transition-all",
                active && "bg-primary-soft",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  done && "bg-success text-success-foreground",
                  active && "bg-primary text-primary-foreground shadow-button",
                  !active && !done && "bg-surface text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:inline",
                  active ? "text-primary-deep" : "text-muted-foreground",
                )}
              >
                {s}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  done ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Inputs ---------- */
const inputCls =
  "w-full rounded-lg bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:bg-card focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ---------- Step contents ---------- */
function InfoStep() {
  return (
    <Card title="Contact Information" subtitle="We'll send order updates to your email">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2">
          <input className={inputCls} placeholder="Aarav Sharma" defaultValue="Aarav Sharma" />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputCls}
            placeholder="you@example.com"
            defaultValue="aarav@voltzo.in"
          />
        </Field>
        <Field label="Mobile">
          <input
            className={inputCls}
            placeholder="+91 98XXX XXXXX"
            defaultValue="+91 98765 43210"
          />
        </Field>
      </div>
    </Card>
  );
}

function ShippingStep({
  installation,
  setInstallation,
  shipping,
  setShipping,
}: {
  installation: boolean;
  setInstallation: (b: boolean) => void;
  shipping: "standard" | "express";
  setShipping: (s: "standard" | "express") => void;
}) {
  return (
    <>
      <Card
        title="Shipping Address"
        subtitle="Where should we deliver your order?"
        icon={MapPin}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line" className="sm:col-span-2">
            <input
              className={inputCls}
              placeholder="House / Flat, Street, Area"
              defaultValue="A-204, Sunshine Heights, Andheri West"
            />
          </Field>
          <Field label="City">
            <input className={inputCls} defaultValue="Mumbai" />
          </Field>
          <Field label="State">
            <input className={inputCls} defaultValue="Maharashtra" />
          </Field>
          <Field label="PIN code">
            <input className={inputCls} defaultValue="400053" />
          </Field>
          <Field label="Landmark (optional)">
            <input className={inputCls} placeholder="Near…" />
          </Field>
        </div>
      </Card>

      <Card title="Delivery Speed">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: "standard",
                title: "Standard",
                body: "4–6 business days",
                price: "Free",
              },
              {
                id: "express",
                title: "Express",
                body: "1–2 business days",
                price: "+₹299",
              },
            ] as const
          ).map((o) => {
            const selected = shipping === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setShipping(o.id)}
                className={cn(
                  "flex items-start justify-between rounded-xl border p-4 text-left transition-all",
                  selected
                    ? "border-primary bg-primary-soft/40 shadow-soft"
                    : "border-border bg-card hover:border-border-strong",
                )}
              >
                <div>
                  <p className="text-sm font-semibold">{o.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{o.body}</p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-primary" : "text-foreground",
                  )}
                >
                  {o.price}
                </span>
              </button>
            );
          })}
        </div>

        {/* Installation toggle */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-surface/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Professional Installation</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Certified technician on-site · {formatINR(INSTALL_FEE)}
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={installation}
            onClick={() => setInstallation(!installation)}
            className={cn(
              "relative h-7 w-12 flex-shrink-0 rounded-full transition-colors",
              installation ? "bg-primary" : "bg-border-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-card shadow-soft transition-transform",
                installation && "translate-x-5",
              )}
            />
          </button>
        </div>
      </Card>
    </>
  );
}

function PaymentStep() {
  const [method, setMethod] = useState<"card" | "upi" | "cod">("card");
  return (
    <Card title="Payment Method" subtitle="All transactions are secured & encrypted" icon={Lock}>
      <div className="grid gap-2 sm:grid-cols-3">
        {(
          [
            { id: "card", label: "Card" },
            { id: "upi", label: "UPI" },
            { id: "cod", label: "Cash on Delivery" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
              method === m.id
                ? "border-primary bg-primary-soft/40 text-primary-deep shadow-soft"
                : "border-border bg-card text-muted-foreground hover:border-border-strong",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === "card" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Card number" className="sm:col-span-2">
            <div className="relative">
              <input className={cn(inputCls, "pr-10")} placeholder="1234 5678 9012 3456" />
              <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>
          <Field label="Expiry">
            <input className={inputCls} placeholder="MM / YY" />
          </Field>
          <Field label="CVV">
            <input className={inputCls} placeholder="123" />
          </Field>
        </div>
      )}

      {method === "upi" && (
        <div className="mt-5">
          <Field label="UPI ID">
            <input className={inputCls} placeholder="yourname@okhdfc" />
          </Field>
        </div>
      )}

      {method === "cod" && (
        <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-xs text-muted-foreground">
          Pay in cash when your order arrives. ID verification may be required for orders above
          ₹25,000.
        </p>
      )}
    </Card>
  );
}

function PlaceOrderButton({ total }: { total: number }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => setDone(true)}
      className={cn(
        "inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold shadow-button transition-all",
        done
          ? "bg-success text-success-foreground"
          : "bg-gradient-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]",
      )}
    >
      {done ? (
        <>
          <Check className="h-4 w-4" strokeWidth={3} /> Order placed
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" /> Place order · {formatINR(total)}
        </>
      )}
    </button>
  );
}

/* ---------- Order summary ---------- */
function OrderSummary({
  items,
  subtotal,
  savings,
  shippingFee,
  installFee,
  tax,
  total,
  installation,
  shipping,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  savings: number;
  shippingFee: number;
  installFee: number;
  tax: number;
  total: number;
  installation: boolean;
  shipping: "standard" | "express";
}) {
  const itemCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  return (
    <div className="glass-card overflow-hidden rounded-3xl">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Order Summary</h2>
          <span className="rounded-full bg-card/70 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {itemCount} items
          </span>
        </div>

        <ul className="mt-5 space-y-3">
          {items.map(({ product, qty }) => (
            <li key={product.id} className="flex gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-card/70">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-1"
                />
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                  {qty}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium leading-snug">
                  {product.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{product.brand}</p>
              </div>
              <span className="text-xs font-semibold tabular-nums">
                {formatINR(product.price * qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 border-t border-border/60 pt-4 text-sm">
          <Row label="Subtotal" value={formatINR(subtotal)} />
          {savings > 0 && (
            <Row
              label="You save"
              value={`− ${formatINR(savings)}`}
              valueClass="text-success"
            />
          )}
          <Row
            label={`Shipping · ${shipping === "express" ? "Express" : "Standard"}`}
            value={shippingFee === 0 ? "Free" : formatINR(shippingFee)}
          />
          {installation && (
            <Row label="Professional Installation" value={formatINR(installFee)} />
          )}
          <Row label="GST (18%)" value={formatINR(tax)} />
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-4">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatINR(total)}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
          <Trust icon={ShieldCheck} label="Secure" />
          <Trust icon={Truck} label="Tracked" />
          <Trust icon={Wrench} label="Installed" />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}

function Trust({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-card/60 py-2">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ---------- Card primitive ---------- */
function Card({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

function EmptyCart() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
        <CreditCard className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">Nothing to check out</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Your cart is empty. Add a few products and come back to complete your order.
      </p>
      <Link
        to="/"
        className="mt-5 rounded-full bg-gradient-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-button hover:brightness-110"
      >
        Browse catalog
      </Link>
    </div>
  );
}
