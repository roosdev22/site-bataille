// app/admin/users/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icônes SVG
const Icons = {
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
  ChevronLeft: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>,
  MoreHorizontal: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  Shield: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  PenLine: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  UserCheck: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  UserX: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>,
  Trash: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Pencil: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Loader: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
};

interface User {
  id: string; email: string; first_name: string; last_name: string;
  full_name: string; role: "admin" | "writer"; is_active: boolean; date_joined: string;
}
interface PaginatedUsers { count: number; results: User[]; }

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

interface UserFormData {
  email: string; first_name: string; last_name: string; role: string; password?: string;
}

function UserFormModal({
  user, open, onClose, onSaved,
}: {
  user: User | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const isNew = !user;
  const [form, setForm] = useState<UserFormData>({ email: "", first_name: "", last_name: "", role: "writer", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
    } else {
      setForm({ email: "", first_name: "", last_name: "", role: "writer", password: "" });
    }
    setErrors({});
  }, [user, open]);

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.includes("@")) e.email = "Email invalide.";
    if (form.first_name.trim().length < 2) e.first_name = "Prénom trop court.";
    if (form.last_name.trim().length < 2) e.last_name = "Nom trop court.";
    if (isNew && (!form.password || form.password.length < 8)) e.password = "Mot de passe requis (min. 8 car.).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {
        email: form.email, first_name: form.first_name,
        last_name: form.last_name, role: form.role,
      };
      if (isNew && form.password) body.password = form.password;
      if (isNew) await api.post("/admin/users/", body);
      else await api.patch(`/admin/users/${user!.id}/`, body);
      onSaved(); onClose();
    } catch (err: any) {
      const mapped: Record<string, string> = {};
      Object.entries(err.response?.data ?? {}).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : String(v);
      });
      setErrors(mapped);
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">
            {isNew ? "Créer un utilisateur" : `Modifier — ${user?.full_name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-gray-400 uppercase">Prénom *</Label>
              <Input className="text-sm h-10 rounded-xl bg-gray-50 border-gray-100" value={form.first_name}
                onChange={e => setField("first_name", e.target.value)} />
              {errors.first_name && <p className="text-[11px] text-red-500">{errors.first_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-gray-400 uppercase">Nom *</Label>
              <Input className="text-sm h-10 rounded-xl bg-gray-50 border-gray-100" value={form.last_name}
                onChange={e => setField("last_name", e.target.value)} />
              {errors.last_name && <p className="text-[11px] text-red-500">{errors.last_name}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-400 uppercase">Email *</Label>
            <Input className="text-sm h-10 rounded-xl bg-gray-50 border-gray-100" type="email" value={form.email}
              onChange={e => setField("email", e.target.value)} />
            {errors.email && <p className="text-[11px] text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-400 uppercase">Rôle</Label>
            <Select value={form.role} onValueChange={v => setField("role", v)}>
              <SelectTrigger className="h-10 text-sm rounded-xl bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="writer">Écrivain</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isNew && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-gray-400 uppercase">Mot de passe *</Label>
              <Input className="text-sm h-10 rounded-xl bg-gray-50 border-gray-100" type="password" value={form.password ?? ""}
                onChange={e => setField("password", e.target.value)} />
              {errors.password && <p className="text-[11px] text-red-500">{errors.password}</p>}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="text-xs rounded-xl" onClick={onClose}>Annuler</Button>
          <Button size="sm" className="text-xs bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-xl shadow-lg"
            onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : isNew ? "Créer" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionLoading, setAction] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (search) p.set("search", search);
    try {
      const { data } = await api.get<PaginatedUsers>(`/admin/users/?${p}`);
      setUsers(data.results ?? []);
      setCount(data.count ?? 0);
    } catch { setUsers([]); setCount(0); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search]);

  async function handleAction(userId: string, action: string) {
    setAction(userId + action);
    try { await api.post(`/admin/users/${userId}/${action}/`, {}); fetchUsers(); }
    catch (err: any) { alert(err.response?.data?.detail || "Erreur"); }
    finally { setAction(null); }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setAction(deleteUser.id + "delete");
    try { await api.delete(`/admin/users/${deleteUser.id}/`); setDeleteUser(null); fetchUsers(); }
    catch { alert("Erreur lors de la suppression"); }
    finally { setAction(null); }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-[#1c1c2e] tracking-tight">Utilisateurs</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">{count} comptes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={fetchUsers} disabled={loading}>
            {loading ? <Icons.Loader /> : <Icons.Refresh />}
          </Button>
          <Button size="sm" className="h-9 text-xs bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white gap-2 rounded-xl font-semibold shadow-lg shadow-[#1c1c2e]/10"
            onClick={() => { setEditUser(null); setShowForm(true); }}>
            <Icons.Plus /> Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-xs">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></span>
        <Input placeholder="Rechercher…" className="pl-10 h-10 text-sm rounded-2xl bg-gray-50 border-gray-100"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] text-gray-400 uppercase tracking-wider border-b">
              <th className="text-left px-4 py-3 font-bold">Utilisateur</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-bold">Rôle</th>
              <th className="text-left px-4 py-3 font-bold">Statut</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Inscrit le</th>
              <th className="text-right px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td colSpan={6} className="px-4 py-3.5">
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-2/3" />
                </td>
              </tr>
            )) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-gray-400">Aucun utilisateur trouvé</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                      user.role === "admin" ? "bg-[#c9a84c]/20 text-[#c9a84c]" : "bg-gray-100 text-gray-500"
                    }`}>
                      {getInitials(user.full_name)}
                    </div>
                    <span className="font-semibold text-[#1c1c2e] truncate max-w-[130px]">{user.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    user.role === "admin"
                      ? "bg-[#c9a84c]/10 text-[#b8973d] border-[#c9a84c]/30"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}>
                    {user.role === "admin" ? "Admin" : "Écrivain"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    user.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}>
                    {user.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                  {new Date(user.date_joined).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => { setEditUser(user); setShowForm(true); }}>
                      <Icons.Pencil />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl" disabled={!!actionLoading}>
                          <Icons.MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs w-44 rounded-2xl p-1">
                        {user.is_active ? (
                          <DropdownMenuItem className="text-xs gap-2 text-red-600 rounded-xl py-2"
                            onClick={() => handleAction(user.id, "deactivate")}>
                            <Icons.UserX /> Désactiver
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-xs gap-2 text-emerald-600 rounded-xl py-2"
                            onClick={() => handleAction(user.id, "activate")}>
                            <Icons.UserCheck /> Activer
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.role === "writer" ? (
                          <DropdownMenuItem className="text-xs gap-2 rounded-xl py-2"
                            onClick={() => handleAction(user.id, "promote")}>
                            <Icons.Shield /> Promouvoir admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-xs gap-2 rounded-xl py-2"
                            onClick={() => handleAction(user.id, "demote")}>
                            <Icons.PenLine /> Rétrograder écrivain
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs gap-2 text-red-600 rounded-xl py-2"
                          onClick={() => setDeleteUser(user)}>
                          <Icons.Trash /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page === 1}
              onClick={() => setPage(p => p - 1)}><Icons.ChevronLeft /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}><Icons.ChevronRight /></Button>
          </div>
        </div>
      )}

      <UserFormModal user={editUser} open={showForm} onClose={() => { setShowForm(false); setEditUser(null); }} onSaved={fetchUsers} />

      <Dialog open={!!deleteUser} onOpenChange={o => !o && setDeleteUser(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-sm font-bold">Supprimer l'utilisateur ?</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 py-2">
            Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            Le compte de <span className="font-semibold text-[#1c1c2e]">{deleteUser?.full_name}</span> sera supprimé.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => setDeleteUser(null)}>Annuler</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl"
              onClick={handleDelete} disabled={!!actionLoading}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}