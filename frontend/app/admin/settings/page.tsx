// app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Icônes SVG
const Icons = {
  Camera: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Save: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Lock: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Globe: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  User: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

interface FormErrors { [key: string]: string; }

export default function SettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingBlog, setSavingBlog] = useState(false);
  const [successProfile, setSuccessProfile] = useState(false);
  const [successPwd, setSuccessPwd] = useState(false);
  const [successBlog, setSuccessBlog] = useState(false);
  const [errorsProfile, setErrorsProfile] = useState<FormErrors>({});
  const [errorsPwd, setErrorsPwd] = useState<FormErrors>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "", bio: "" });
  const [pwd, setPwd] = useState({ old_password: "", new_password: "", new_password_confirm: "" });
  const [blog, setBlog] = useState({ name: "Site Bataille", description: "", email: "", twitter: "", facebook: "", instagram: "" });

  useEffect(() => {
    if (!user) return;
    api.get("/users/me/").then(({ data }) => {
      setProfile({ first_name: data.first_name ?? "", last_name: data.last_name ?? "", email: data.email ?? "", bio: data.bio ?? "" });
      if (data.avatar_url) setAvatarPreview(data.avatar_url);
    }).catch(() => {});
  }, [user]);

  function setProfileField(field: string, value: string) {
    setProfile(f => ({ ...f, [field]: value }));
    setErrorsProfile(e => { const n = { ...e }; delete n[field]; return n; });
    setSuccessProfile(false);
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function validateProfile(): boolean {
    const e: FormErrors = {};
    if (profile.first_name.trim().length < 2) e.first_name = "Prénom trop court.";
    if (profile.last_name.trim().length < 2) e.last_name = "Nom trop court.";
    if (!profile.email.includes("@")) e.email = "Email invalide.";
    setErrorsProfile(e);
    return Object.keys(e).length === 0;
  }

  async function handleSaveProfile() {
    if (!validateProfile()) return;
    setSaving(true); setSuccessProfile(false);
    try {
      const body = new FormData();
      body.append("first_name", profile.first_name);
      body.append("last_name", profile.last_name);
      body.append("email", profile.email);
      body.append("bio", profile.bio);
      if (avatarFile) body.append("avatar", avatarFile);
      await api.patch("/users/me/", body);
      setSuccessProfile(true); setAvatarFile(null);
    } catch (err: any) {
      const mapped: FormErrors = {};
      Object.entries(err.response?.data ?? {}).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
      setErrorsProfile(mapped);
    } finally { setSaving(false); }
  }

  function setPwdField(field: string, value: string) {
    setPwd(f => ({ ...f, [field]: value }));
    setErrorsPwd(e => { const n = { ...e }; delete n[field]; return n; });
    setSuccessPwd(false);
  }

  function validatePwd(): boolean {
    const e: FormErrors = {};
    if (!pwd.old_password) e.old_password = "Mot de passe actuel requis.";
    if (pwd.new_password.length < 8) e.new_password = "Min. 8 caractères.";
    if (pwd.new_password !== pwd.new_password_confirm) e.new_password_confirm = "Les mots de passe ne correspondent pas.";
    setErrorsPwd(e);
    return Object.keys(e).length === 0;
  }

  async function handleSavePwd() {
    if (!validatePwd()) return;
    setSavingPwd(true); setSuccessPwd(false);
    try {
      await api.patch("/users/me/password/", pwd);
      setSuccessPwd(true);
      setPwd({ old_password: "", new_password: "", new_password_confirm: "" });
    } catch (err: any) {
      const mapped: FormErrors = {};
      Object.entries(err.response?.data ?? {}).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
      setErrorsPwd(mapped);
    } finally { setSavingPwd(false); }
  }

  function setBlogField(field: string, value: string) { setBlog(f => ({ ...f, [field]: value })); setSuccessBlog(false); }

  async function handleSaveBlog() {
    setSavingBlog(true); setSuccessBlog(false);
    await new Promise(r => setTimeout(r, 600));
    setSuccessBlog(true); setSavingBlog(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-lg font-extrabold text-[#1c1c2e] tracking-tight">Paramètres</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">Gérez votre profil et vos préférences</p>
      </div>

      {/* ══ PROFIL ══ */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><Icons.User /></div>
          <h2 className="text-[15px] font-bold text-[#1c1c2e]">Mon profil</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-100">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-400">{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
              )}
            </div>
            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#1c1c2e] rounded-xl
              flex items-center justify-center cursor-pointer hover:bg-[#2a2a3e] transition-colors shadow-lg">
              <Icons.Camera />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </label>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1c1c2e]">{profile.first_name} {profile.last_name}</p>
            <p className="text-[11px] text-gray-400">{user?.role === "admin" ? "Administrateur" : "Écrivain"}</p>
            <p className="text-[10px] text-gray-400 mt-1">JPG, PNG — max 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-gray-400 uppercase">Prénom *</Label>
            <Input className="h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl" value={profile.first_name}
              onChange={e => setProfileField("first_name", e.target.value)} />
            {errorsProfile.first_name && <p className="text-[11px] text-red-500">{errorsProfile.first_name}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-gray-400 uppercase">Nom *</Label>
            <Input className="h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl" value={profile.last_name}
              onChange={e => setProfileField("last_name", e.target.value)} />
            {errorsProfile.last_name && <p className="text-[11px] text-red-500">{errorsProfile.last_name}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase">Email *</Label>
          <Input className="h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl" type="email" value={profile.email}
            onChange={e => setProfileField("email", e.target.value)} />
          {errorsProfile.email && <p className="text-[11px] text-red-500">{errorsProfile.email}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase">Biographie</Label>
          <Textarea className="text-sm bg-gray-50 border-gray-100 rounded-2xl resize-none min-h-[90px]"
            placeholder="Quelques mots sur vous…" value={profile.bio}
            onChange={e => setProfileField("bio", e.target.value)} />
          <p className="text-[10px] text-gray-400 text-right">{profile.bio.length} / 500</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button size="sm" className="text-xs gap-2 bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-2xl h-10 px-5 font-semibold shadow-lg"
            disabled={saving} onClick={handleSaveProfile}>
            <Icons.Save /> {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {successProfile && <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><Icons.Check />Profil mis à jour</span>}
        </div>
      </div>

      {/* ══ SÉCURITÉ ══ */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><Icons.Lock /></div>
          <h2 className="text-[15px] font-bold text-[#1c1c2e]">Sécurité</h2>
        </div>

        {["old_password", "new_password", "new_password_confirm"].map((field, i) => (
          <div key={field} className="space-y-2">
            <Label className="text-[11px] font-bold text-gray-400 uppercase">
              {i === 0 ? "Mot de passe actuel" : i === 1 ? "Nouveau mot de passe" : "Confirmer le mot de passe"} *
            </Label>
            <Input className="h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl" type="password"
              value={pwd[field as keyof typeof pwd]}
              onChange={e => setPwdField(field, e.target.value)} />
            {errorsPwd[field] && <p className="text-[11px] text-red-500">{errorsPwd[field]}</p>}
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Button size="sm" className="text-xs gap-2 bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-2xl h-10 px-5 font-semibold shadow-lg"
            disabled={savingPwd} onClick={handleSavePwd}>
            <Icons.Lock /> {savingPwd ? "Enregistrement…" : "Changer le mot de passe"}
          </Button>
          {successPwd && <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><Icons.Check />Mot de passe modifié</span>}
        </div>
      </div>

      {/* ══ BLOG ══ */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><Icons.Globe /></div>
          <h2 className="text-[15px] font-bold text-[#1c1c2e]">À propos du blog</h2>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase">Nom du blog</Label>
          <Input className="h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl" value={blog.name} onChange={e => setBlogField("name", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase">Description</Label>
          <Textarea className="text-sm bg-gray-50 border-gray-100 rounded-2xl resize-none min-h-[80px]"
            placeholder="Courte description du blog…" value={blog.description} onChange={e => setBlogField("description", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase">Email de contact</Label>
          <Input className="h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl" type="email"
            placeholder="contact@monblog.com" value={blog.email} onChange={e => setBlogField("email", e.target.value)} />
        </div>

        <div className="space-y-3">
          <Label className="text-[11px] font-bold text-gray-400 uppercase">Réseaux sociaux</Label>
          {["twitter", "facebook", "instagram"].map(network => (
            <Input key={network} className="h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl"
              placeholder={`${network.charAt(0).toUpperCase() + network.slice(1)} — https://${network}.com/...`}
              value={blog[network as keyof typeof blog]} onChange={e => setBlogField(network, e.target.value)} />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button size="sm" className="text-xs gap-2 bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-2xl h-10 px-5 font-semibold shadow-lg"
            disabled={savingBlog} onClick={handleSaveBlog}>
            <Icons.Save /> {savingBlog ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {successBlog && <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><Icons.Check />Paramètres sauvegardés</span>}
        </div>
      </div>
    </div>
  );
}