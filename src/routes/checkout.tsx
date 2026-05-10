import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Lock, MapPin, ArrowRight, Upload, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useCart, cartTotals, cartStore, effectivePrice } from "@/lib/cart-store";
import { formatINR, paymentSettingsQueryOptions } from "@/lib/products-api";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Mayur Electronics" },
      { name: "description", content: "Complete your order with shipping and payment." },
    ],
  }),
  component: CheckoutPage,
});

const STEPS = ["Info", "Shipping", "Payment"] as const;
type Step = (typeof STEPS)[number];


const infoSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
});
const shipSchema = z.object({
  address: z.string().trim().min(5).max(255),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().trim().min(4).max(10),
  landmark: z.string().max(100).optional(),
});

function CheckoutPage() {
  const { items } = useCart();
  const { subtotal, savings } = cartTotals(items);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { data: paySettings } = useQuery(paymentSettingsQueryOptions());

  const [step, setStep] = useState<Step>("Info");

  const [shipping, setShipping] = useState<"standard" | "express">("standard");
  const [info, setInfo] = useState({
    name: "",
    email: user?.email ?? "",
    phone: "",
  });
  const [ship, setShip] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });
  const [method, setMethod] = useState<"upi_qr" | "paytm" | "bank_transfer">("upi_qr");
  const [paymentRef, setPaymentRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shippingFee = shipping === "express" ? 299 : 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shippingFee + tax;

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    if (step === "Info") {
      const r = infoSchema.safeParse(info);
      if (!r.success) {
        toast.error(r.error.issues[0]?.message ?? "Please fill all fields");
        return;
      }
    }
    if (step === "Shipping") {
      const r = shipSchema.safeParse(ship);
      if (!r.success) {
        toast.error(r.error.issues[0]?.message ?? "Please fill all fields");
        return;
      }
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place an order");
      navigate({ to: "/auth", search: { redirect: "/checkout" } });
      return;
    }
    if (items.length === 0) return;
    if (!proofFile && !paymentRef) {
      toast.error("Please upload payment proof or enter a reference number");
      return;
    }

    setSubmitting(true);
    try {
      const { data: orderId, error } = await supabase.rpc("place_order", {
        _customer_name: info.name,
        _customer_email: info.email,
        _customer_phone: info.phone,
        _shipping_address: ship.address,
        _shipping_city: ship.city,
        _shipping_state: ship.state,
        _shipping_pincode: ship.pincode,
        _shipping_landmark: ship.landmark || "",
        _shipping_speed: shipping,
        _installation: false,
        _payment_method: method,
        _items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
      });
      if (error) throw error;

      // Upload payment proof if any
      let proofUrl: string | null = null;
      if (proofFile && user) {
        const path = `${user.id}/${orderId}-${Date.now()}-${proofFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, proofFile);
        if (!upErr) proofUrl = path;
      }

      // Update order with proof + reference, set status
      await supabase
        .from("orders")
        .update({
          payment_reference: paymentRef || null,
          payment_proof_url: proofUrl,
          status: "awaiting_verification",
        })
        .eq("id", orderId as string);

      cartStore.clear();
      toast.success("Order placed successfully!");
      navigate({ to: "/orders" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-gradient-soft">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Secure Checkout
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Complete your order
            </h1>
          </div>
          <Link to="/" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
            ← Continue shopping
          </Link>
        </div>

        <Stepper step={step} setStep={setStep} />

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[3fr,2fr] lg:items-start">
            <section className="space-y-6">
              {!isAuthenticated && (
                <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                  <div>
                    <p className="font-semibold">Sign in to place your order</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      You can browse the steps below.{" "}
                      <Link to="/auth" search={{ redirect: "/checkout" }} className="font-semibold text-primary underline">
                        Sign in or create an account
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {step === "Info" && <InfoStep info={info} setInfo={setInfo} />}
              {step === "Shipping" && (
                <ShippingStep
                  ship={ship}
                  setShip={setShip}
                  shipping={shipping}
                  setShipping={setShipping}
                />
              )}
              {step === "Payment" && (
                <PaymentStep
                  method={method}
                  setMethod={setMethod}
                  paymentRef={paymentRef}
                  setPaymentRef={setPaymentRef}
                  proofFile={proofFile}
                  setProofFile={setProofFile}
                  settings={paySettings}
                  total={total}
                />
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    const prev = STEPS[stepIndex - 1];
                    if (prev) setStep(prev);
                  }}
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
                  <button
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="inline-flex items-center gap-3 rounded-full bg-gradient-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Place order · {formatINR(total)}
                  </button>
                )}
              </div>
            </section>

            <aside className="lg:sticky lg:top-24">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                savings={savings}
                shippingFee={shippingFee}
                tax={tax}
                total={total}
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

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
              <span className={cn("h-px flex-1 transition-colors", done ? "bg-primary/40" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

const inputCls =
  "w-full rounded-lg bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:bg-card focus:ring-2 focus:ring-primary/30";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Card({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function InfoStep({ info, setInfo }: { info: { name: string; email: string; phone: string }; setInfo: (v: typeof info) => void }) {
  return (
    <Card title="Contact Information" subtitle="We'll send order updates to your email">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2">
          <input className={inputCls} value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} placeholder="Aarav Sharma" />
        </Field>
        <Field label="Email">
          <input type="email" className={inputCls} value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} placeholder="you@example.com" />
        </Field>
        <Field label="Mobile">
          <input className={inputCls} value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="+91 98XXX XXXXX" />
        </Field>
      </div>
    </Card>
  );
}

function ShippingStep({
  ship,
  setShip,
  shipping,
  setShipping,
}: {
  ship: { address: string; city: string; state: string; pincode: string; landmark: string };
  setShip: (v: typeof ship) => void;
  shipping: "standard" | "express";
  setShipping: (s: "standard" | "express") => void;
}) {
  return (
    <>
      <Card title="Shipping Address" subtitle="Where should we deliver?" icon={MapPin}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line" className="sm:col-span-2">
            <input className={inputCls} value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} placeholder="House / Flat, Street, Area" />
          </Field>
          <Field label="City">
            <input className={inputCls} value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={ship.state} onChange={(e) => setShip({ ...ship, state: e.target.value })} />
          </Field>
          <Field label="PIN code">
            <input className={inputCls} value={ship.pincode} onChange={(e) => setShip({ ...ship, pincode: e.target.value })} />
          </Field>
          <Field label="Landmark (optional)">
            <input className={inputCls} value={ship.landmark} onChange={(e) => setShip({ ...ship, landmark: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card title="Delivery Speed">
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { id: "standard", title: "Standard", body: "4–6 business days", price: "Free" },
            { id: "express", title: "Express", body: "1–2 business days", price: "+₹299" },
          ] as const).map((o) => {
            const selected = shipping === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setShipping(o.id)}
                className={cn(
                  "flex items-start justify-between rounded-xl border p-4 text-left transition-all",
                  selected ? "border-primary bg-primary-soft/40 shadow-soft" : "border-border bg-card hover:border-border-strong",
                )}
              >
                <div>
                  <p className="text-sm font-semibold">{o.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{o.body}</p>
                </div>
                <span className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>{o.price}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function PaymentStep({
  method,
  setMethod,
  paymentRef,
  setPaymentRef,
  proofFile,
  setProofFile,
  settings,
  total,
}: {
  method: "upi_qr" | "paytm" | "bank_transfer";
  setMethod: (m: "upi_qr" | "paytm" | "bank_transfer") => void;
  paymentRef: string;
  setPaymentRef: (s: string) => void;
  proofFile: File | null;
  setProofFile: (f: File | null) => void;
  settings: { upi_id: string | null; paytm_id: string | null; bank_account_name: string | null; bank_account_number: string | null; bank_ifsc: string | null; bank_name: string | null; qr_code_url: string | null; notes: string | null } | null | undefined;
  total: number;
}) {
  const methods: Array<{ id: typeof method; label: string; show: boolean }> = [
    { id: "upi_qr", label: "UPI / QR", show: !!settings?.upi_id || !!settings?.qr_code_url },
    { id: "paytm", label: "Paytm", show: !!settings?.paytm_id },
    { id: "bank_transfer", label: "Bank Transfer", show: !!settings?.bank_account_number || !!settings?.bank_name },
  ];

  return (
    <Card title="Payment Method" subtitle="Pay manually and upload proof — admin will verify" icon={Lock}>
      <div className="grid gap-2 sm:grid-cols-4">
        {methods.filter((m) => m.show).map((m) => (
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

      {method === "upi_qr" && (
        <div className="mt-5 space-y-4 rounded-xl border border-border bg-surface/40 p-4">
          {settings?.qr_code_url && (
            <div className="flex justify-center">
              <img src={settings.qr_code_url} alt="UPI QR code" className="h-44 w-44 rounded-lg border border-border bg-white object-contain p-2" />
            </div>
          )}
          {settings?.upi_id && (
            <p className="text-center text-sm">
              UPI ID: <span className="font-semibold">{settings.upi_id}</span>
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Pay {formatINR(total)} via any UPI app, then upload the screenshot below.
          </p>
        </div>
      )}

      {method === "paytm" && settings?.paytm_id && (
        <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4 text-sm">
          Send <span className="font-semibold">{formatINR(total)}</span> to Paytm ID:{" "}
          <span className="font-semibold">{settings.paytm_id}</span>
        </div>
      )}

      {method === "bank_transfer" && settings && (
        <div className="mt-5 space-y-1 rounded-xl border border-border bg-surface/40 p-4 text-sm">
          <p><span className="text-muted-foreground">Account name: </span><span className="font-semibold">{settings.bank_account_name}</span></p>
          <p><span className="text-muted-foreground">Bank: </span><span className="font-semibold">{settings.bank_name}</span></p>
          {settings.bank_account_number && <p><span className="text-muted-foreground">A/C: </span><span className="font-semibold">{settings.bank_account_number}</span></p>}
          {settings.bank_ifsc && <p><span className="text-muted-foreground">IFSC: </span><span className="font-semibold">{settings.bank_ifsc}</span></p>}
          <p className="pt-2 text-xs text-muted-foreground">Transfer {formatINR(total)} and upload proof.</p>
        </div>
      )}


      <div className="mt-5 space-y-4">
          <Field label="Payment reference / UTR (optional)">
            <input className={inputCls} value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="UTR / Transaction ID" />
          </Field>
          <Field label="Upload payment screenshot">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-4 py-3 text-sm transition-colors hover:border-primary hover:bg-primary-soft/30">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{proofFile ? proofFile.name : "Choose image…"}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
          {settings?.notes && (
            <p className="rounded-lg bg-primary-soft/30 px-3 py-2 text-xs text-primary-deep">{settings.notes}</p>
          )}
      </div>
    </Card>
  );
}

function EmptyCart() {
  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center">
      <p className="text-lg font-semibold">Your cart is empty</p>
      <p className="mt-1 text-sm text-muted-foreground">Add products before checking out.</p>
      <Link to="/" className="mt-5 inline-flex rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-button hover:brightness-110">
        Browse catalog
      </Link>
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  savings,
  shippingFee,
  tax,
  total,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  savings: number;
  shippingFee: number;
  tax: number;
  total: number;
}) {
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
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
          {items.map((item) => {
            const { product, qty } = item;
            const price = effectivePrice(item);
            return (
              <li key={product.id} className="flex gap-3">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-card/70">
                  <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-contain p-1" />
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                    {qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatINR(price)} each</p>
                </div>
                <p className="text-xs font-semibold tabular-nums">{formatINR(price * qty)}</p>
              </li>
            );
          })}
        </ul>

        <dl className="mt-6 space-y-2 border-t border-border/50 pt-5 text-sm">
          <Row label="Subtotal" value={formatINR(subtotal)} />
          {savings > 0 && <Row label="You save" value={formatINR(savings)} positive />}
          <Row label="Shipping" value={shippingFee === 0 ? "Free" : formatINR(shippingFee)} />
          <Row label="Tax (18% GST)" value={formatINR(tax)} />
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-border/50 pt-4">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-xl font-semibold tracking-tight">{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium tabular-nums", positive && "text-success")}>{value}</dd>
    </div>
  );
}
