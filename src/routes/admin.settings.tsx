import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { paymentSettingsQueryOptions } from "@/lib/products-api";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery(paymentSettingsQueryOptions());

  const [form, setForm] = useState({
    upi_id: "",
    paytm_id: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_name: "",
    qr_code_url: "",
    cod_enabled: true,
    notes: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        upi_id: settings.upi_id ?? "",
        paytm_id: settings.paytm_id ?? "",
        bank_account_name: settings.bank_account_name ?? "",
        bank_account_number: settings.bank_account_number ?? "",
        bank_ifsc: settings.bank_ifsc ?? "",
        bank_name: settings.bank_name ?? "",
        qr_code_url: settings.qr_code_url ?? "",
        cod_enabled: settings.cod_enabled,
        notes: settings.notes ?? "",
      });
    }
  }, [settings]);

  const handleQrUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `public/qr-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("qr-codes").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("qr-codes").getPublicUrl(path);
      setForm((f) => ({ ...f, qr_code_url: data.publicUrl }));
      toast.success("QR uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!settings?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("payment_settings").update(form).eq("id", settings.id);
      if (error) throw error;
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const inputCls = "w-full rounded-lg bg-input px-3 py-2 text-sm outline-none focus:bg-card focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Payment Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure how customers can pay you. These details appear at checkout.</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <Section title="UPI / QR">
          <Field label="UPI ID"><input className={inputCls} value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} placeholder="yourname@okhdfc" /></Field>
          <Field label="QR code image" full>
            <div className="flex items-center gap-4">
              {form.qr_code_url && <img src={form.qr_code_url} alt="QR" className="h-20 w-20 rounded-lg border border-border bg-white object-contain p-1" />}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-surface/50 px-3 py-2 text-sm hover:border-primary">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{form.qr_code_url ? "Replace QR" : "Upload QR"}</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && handleQrUpload(e.target.files[0])} />
              </label>
            </div>
          </Field>
        </Section>

        <Section title="Paytm">
          <Field label="Paytm ID / number" full><input className={inputCls} value={form.paytm_id} onChange={(e) => setForm({ ...form, paytm_id: e.target.value })} placeholder="9876543210@paytm" /></Field>
        </Section>

        <Section title="Bank transfer">
          <Field label="Account name"><input className={inputCls} value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} /></Field>
          <Field label="Bank name"><input className={inputCls} value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></Field>
          <Field label="Account number"><input className={inputCls} value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} /></Field>
          <Field label="IFSC"><input className={inputCls} value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} /></Field>
        </Section>

        <Section title="Cash on Delivery">
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" checked={form.cod_enabled} onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })} className="h-4 w-4 accent-primary" />
            <span className="text-sm">Allow COD at checkout</span>
          </label>
        </Section>

        <Section title="Customer-visible notes">
          <Field label="Notes shown at checkout" full>
            <textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="After payment, upload screenshot below…" />
          </Field>
        </Section>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-button hover:brightness-110 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
