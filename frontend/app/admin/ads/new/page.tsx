"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, CheckCircle } from "lucide-react";
import Link from "next/link";
import { CountryPhoneInput } from "@/components/ui/country-select";

interface Advertiser { id: string; name: string; }
interface FormErrors { [key: string]: string; }

const FORMATS = [
  { value: "banner_top",    label: "Bannière haut de page" },
  { value: "banner_bottom", label: "Bannière bas de page" },
  { value: "sidebar",       label: "Sidebar" },
  { value: "in_content",    label: "Dans l'article" },
  { value: "sticky_footer", label: "Footer collant" },
];

const CATEGORIES = [
  { value: "all",        label: "Toutes catégories" },
  { value: "medical",    label: "Médical" },
  { value: "travel",     label: "Voyage" },
  { value: "technology", label: "Technologie" },
  { value: "education",  label: "Éducation" },
  { value: "lifestyle",  label: "Lifestyle" },
  { value: "science",    label: "Science" },
  { value: "legal",      label: "Juridique" },
  { value: "finance",    label: "Finance" },
];

// ── Utilitaire normalisation URL ──
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

// ══ MODALE CRÉATION ANNONCEUR ══
function CreateAdvertiserModal({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (adv: Advertiser) => void;
}) {
  const [form, setForm] = useState({
    name: "", contact_name: "", email: "",
    phone: "", website: "", notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function setField(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())         e.name         = "Nom requis.";
    if (!form.contact_name.trim()) e.contact_name = "Contact requis.";
    if (!form.email.includes("@")) e.email        = "Email invalide.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSuccessMessage("");
    try {
      // ✅ Normaliser l'URL avant envoi (sécurité si onBlur pas déclenché)
      const payload = {
        ...form,
        website: normalizeUrl(form.website),
      };

      const { data } = await api.post("/admin/advertisers/", payload);

      setSuccessMessage(`"${data.name}" créé avec succès !`);
      onCreated({ id: data.id, name: data.name });

      setTimeout(() => {
        onClose();
        setForm({ name: "", contact_name: "", email: "", phone: "", website: "", notes: "" });
        setErrors({});
        setSuccessMessage("");
      }, 1500);

    } catch (err: any) {
      const mapped: Record<string, string> = {};
      Object.entries(err.response?.data ?? {}).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : String(v);
      });
      setErrors(mapped);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Nouvel annonceur</DialogTitle>
        </DialogHeader>

        {successMessage && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2.5 rounded-md">
            <CheckCircle size={14} />
            {successMessage}
          </div>
        )}

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Société <span className="text-red-500">*</span>
              </Label>
              <Input className="text-sm h-8" placeholder="Nom de la société"
                value={form.name} onChange={e => setField("name", e.target.value)} />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Contact <span className="text-red-500">*</span>
              </Label>
              <Input className="text-sm h-8" placeholder="Nom du contact"
                value={form.contact_name} onChange={e => setField("contact_name", e.target.value)} />
              {errors.contact_name && <p className="text-[11px] text-red-500">{errors.contact_name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input className="text-sm h-8" type="email" placeholder="contact@societe.com"
                value={form.email} onChange={e => setField("email", e.target.value)} />
              {errors.email && <p className="text-[11px] text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Téléphone</Label>
              <CountryPhoneInput
                value={form.phone}
                onChange={(val) => setField("phone", val)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Site web</Label>
            <Input
              className="text-sm h-8"
              placeholder="https://www.societe.com"
              value={form.website}
              onChange={e => setField("website", e.target.value)}
              onBlur={e => {
                // ✅ Normaliser visuellement dès que l'utilisateur quitte le champ
                const normalized = normalizeUrl(e.target.value);
                if (normalized !== form.website) setField("website", normalized);
              }}
            />
            {errors.website && <p className="text-[11px] text-red-500">{errors.website}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes internes</Label>
            <Textarea className="text-sm resize-none min-h-[60px]"
              placeholder="Remarques, conditions…"
              value={form.notes} onChange={e => setField("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Annuler
          </Button>
          <Button size="sm" className="text-xs bg-[#1c1c2e] hover:bg-[#1c1c2e]/90 text-white"
            onClick={handleSave} disabled={saving || !!successMessage}>
            {saving ? "Création…" : successMessage ? "Créé !" : "Créer l'annonceur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══ PAGE PRINCIPALE ══
export default function NewAdPage() {
  const router = useRouter();
  const [advertisers, setAdvertisers]           = useState<Advertiser[]>([]);
  const [saving, setSaving]                     = useState(false);
  const [errors, setErrors]                     = useState<FormErrors>({});
  const [imageFile, setImageFile]               = useState<File | null>(null);
  const [imagePreview, setImagePreview]         = useState<string | null>(null);
  const [showAdvertiserModal, setShowAdvertiserModal] = useState(false);

  const [form, setFormState] = useState({
    advertiser:      "",
    title:           "",
    destination_url: "",
    alt_text:        "",
    format:          "banner_top",
    target_category: "all",
    priority:        "1",
    start_date:      "",
    end_date:        "",
    max_impressions: "",
    max_clicks:      "",
  });

  useEffect(() => {
    api.get("/admin/advertisers/")
      .then(({ data }) => setAdvertisers(data.results ?? data))
      .catch(() => {});
  }, []);

  function setField(field: string, value: string) {
    setFormState((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function handleAdvertiserCreated(adv: Advertiser) {
    setAdvertisers(prev => [...prev, adv]);
    setField("advertiser", adv.id);
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((e) => { const n = { ...e }; delete n.image; return n; });
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.advertiser)      e.advertiser      = "Annonceur requis.";
    if (!form.title.trim())    e.title           = "Titre requis.";
    if (!form.destination_url) e.destination_url = "URL de destination requise.";
    if (!form.format)          e.format          = "Format requis.";
    if (!imageFile)            e.image           = "Image requise.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) body.append(k, v);
      });
      if (imageFile) body.append("image", imageFile);
      await api.post("/admin/ads/", body);
      router.push("/admin/ads");
    } catch (err: any) {
      const mapped: FormErrors = {};
      Object.entries(err.response?.data ?? {}).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : String(v);
      });
      setErrors(mapped);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/ads">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft size={15} />
          </Button>
        </Link>
        <div>
          <h1 className="text-base font-semibold text-[#1c1c2e]">Nouvelle publicité</h1>
          <p className="text-[11px] text-gray-400">Remplissez les champs obligatoires</p>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── Annonceur ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">
              Annonceur <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setShowAdvertiserModal(true)}
              className="flex items-center gap-1 text-[11px] border border-[#1c1c2e] text-[#1c1c2e] px-3 py-1.5 rounded-md hover:bg-[#1c1c2e] hover:text-white transition-colors"
            >
              <Plus size={10} /> Créer un annonceur
            </button>
          </div>
          <Select value={form.advertiser} onValueChange={(v) => setField("advertiser", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Choisir un annonceur" />
            </SelectTrigger>
            <SelectContent>
              {advertisers.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-400">
                  Aucun annonceur — cliquez sur "Créer un annonceur"
                </div>
              ) : (
                advertisers.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.advertiser && <p className="text-[11px] text-red-500">{errors.advertiser}</p>}
        </div>

        {/* ── Titre ── */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            Titre <span className="text-red-500">*</span>
          </Label>
          <Input className="text-sm" placeholder="Titre de la publicité"
            value={form.title} onChange={(e) => setField("title", e.target.value)} />
          {errors.title && <p className="text-[11px] text-red-500">{errors.title}</p>}
        </div>

        {/* ── URL destination ── */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            URL de destination <span className="text-red-500">*</span>
          </Label>
          <Input className="text-sm" placeholder="https://exemple.com"
            value={form.destination_url} onChange={(e) => setField("destination_url", e.target.value)} />
          {errors.destination_url && <p className="text-[11px] text-red-500">{errors.destination_url}</p>}
        </div>

        {/* ── Image ── */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            Image <span className="text-red-500">*</span>
          </Label>
          <input type="file" accept="image/*" onChange={handleImage}
            className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md
            file:border-0 file:text-xs file:bg-[#1c1c2e] file:text-white cursor-pointer" />
          {imagePreview && (
            <img src={imagePreview} alt="preview"
              className="mt-2 h-24 w-auto rounded-lg border border-gray-100 object-cover" />
          )}
          {errors.image && <p className="text-[11px] text-red-500">{errors.image}</p>}
        </div>

        {/* ── Texte alternatif ── */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Texte alternatif</Label>
          <Input className="text-sm" placeholder="Description de l'image pour l'accessibilité"
            value={form.alt_text} onChange={(e) => setField("alt_text", e.target.value)} />
        </div>

        {/* ── Format + Catégorie ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Format</Label>
            <Select value={form.format} onValueChange={(v) => setField("format", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.format && <p className="text-[11px] text-red-500">{errors.format}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Catégorie ciblée</Label>
            <Select value={form.target_category} onValueChange={(v) => setField("target_category", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Priorité ── */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Priorité</Label>
          <Input type="number" min="1" className="text-sm w-24"
            value={form.priority} onChange={(e) => setField("priority", e.target.value)} />
          <p className="text-[10px] text-gray-400">
            Plus le chiffre est élevé, plus la pub est prioritaire.
          </p>
        </div>

        {/* ── Dates ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Date de début</Label>
            <Input type="datetime-local" className="text-sm"
              value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Date de fin <span className="text-gray-400">(optionnel)</span>
            </Label>
            <Input type="datetime-local" className="text-sm"
              value={form.end_date} onChange={(e) => setField("end_date", e.target.value)} />
          </div>
        </div>

        {/* ── Limites ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Impressions max <span className="text-gray-400">(optionnel)</span>
            </Label>
            <Input type="number" min="1" className="text-sm"
              value={form.max_impressions} onChange={(e) => setField("max_impressions", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Clics max <span className="text-gray-400">(optionnel)</span>
            </Label>
            <Input type="number" min="1" className="text-sm"
              value={form.max_clicks} onChange={(e) => setField("max_clicks", e.target.value)} />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" size="sm" className="text-xs"
            onClick={() => router.push("/admin/ads")}>
            Annuler
          </Button>
          <Button size="sm" className="text-xs bg-[#1c1c2e] hover:bg-[#1c1c2e]/90 text-white gap-1.5"
            disabled={saving} onClick={handleSubmit}>
            <Save size={13} /> {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* ── Modale création annonceur ── */}
      <CreateAdvertiserModal
        open={showAdvertiserModal}
        onClose={() => setShowAdvertiserModal(false)}
        onCreated={handleAdvertiserCreated}
      />
    </div>
  );
}