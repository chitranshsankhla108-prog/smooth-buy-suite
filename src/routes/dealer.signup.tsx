import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, BriefcaseBusiness, Loader2, Mail, Lock, User, Landmark } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dealer/signup")({
  head: () => ({ meta: [{ title: "Dealer Registration — Mayur Electronics" }] }),
  component: DealerSignup,
});

const schema = z.object({
  fullName: z.string().trim().min(1, "Name required").max(100),
  businessName: z.string().trim().min(2, "Business name required").max(140),
  gstNumber: z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid GST number"),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
});

function DealerSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", businessName: "", gstNumber: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message])));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dealer/dashboard`,
          data: {
            full_name: form.fullName,
            business_name: form.businessName,
            gst_number: form.gstNumber.toUpperCase(),
          },
        },
      });
      if (error) throw error;
      toast.success("Dealer application submitted for approval");
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">
        <section className="rounded-3xl border border-border bg-gradient-soft p-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Dealer Registration</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Apply for B2B access, dealer-exclusive pricing, spec sheets, and bulk inquiry support.
          </p>
          <Link to="/auth" className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">
            Already approved? Sign in
          </Link>
        </section>

        <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" icon={User} value={form.fullName} onChange={set("fullName")} error={errors.fullName} />
            <Field label="Business name" icon={BriefcaseBusiness} value={form.businessName} onChange={set("businessName")} error={errors.businessName} />
            <Field label="GST number" icon={Landmark} value={form.gstNumber} onChange={(v) => set("gstNumber")(v.toUpperCase())} error={errors.gstNumber} />
            <Field label="Email" icon={Mail} type="email" value={form.email} onChange={set("email")} error={errors.email} />
            <div className="sm:col-span-2">
              <Field label="Password" icon={Lock} type="password" value={form.password} onChange={set("password")} error={errors.password} />
            </div>
          </div>
          <button disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Submit for approval
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, icon: Icon, type = "text", value, onChange, error }: { label: string; icon: typeof Mail; type?: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cn("w-full rounded-xl border border-border bg-input px-10 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20", error && "border-destructive")} />
      </div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}