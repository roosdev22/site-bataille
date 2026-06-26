// components/admin/admin-header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Sparkles, UserCircle2, ChevronDown, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";

const pageTitles: Record<string, { title: string; breadcrumb: string }> = {
  "/admin":          { title: "Vue d'ensemble", breadcrumb: "Admin / Dashboard"      },
  "/admin/users":    { title: "Utilisateurs",   breadcrumb: "Admin / Utilisateurs"   },
  "/admin/posts":    { title: "Articles",        breadcrumb: "Admin / Articles"       },
  "/admin/comments": { title: "Commentaires",    breadcrumb: "Admin / Commentaires"   },
  "/admin/ads":      { title: "Publicités",      breadcrumb: "Admin / Publicités"     },
  "/admin/contacts": { title: "Contacts",        breadcrumb: "Admin / Messages reçus" },
  "/admin/settings": { title: "Paramètres",      breadcrumb: "Admin / Paramètres"     },
};

export function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const page = pageTitles[pathname] || { title: "Admin", breadcrumb: "Admin" };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-gray-900">{page.title}</h1>
        <p className="text-[11px] text-gray-400">{page.breadcrumb}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Rechercher…" className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 rounded-xl" />
        </div>

        <button className="w-9 h-9 rounded-xl border bg-white flex items-center justify-center text-gray-400 hover:text-gray-600">
          <Bell size={16} />
        </button>

        <button className="w-9 h-9 rounded-xl border bg-white flex items-center justify-center text-gray-400 hover:text-gray-600">
          <Sparkles size={16} />
        </button>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-xl p-1 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#c9a84c] text-[11px] text-[#1c1c2e] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-10 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-3 bg-[#1c1c2e]">
                <p className="text-sm font-bold text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-[#c9a84c]">{user?.role === "admin" ? "Super Admin" : "Écrivain"}</p>
              </div>
              <div className="p-2 space-y-1">
                <a href="/admin/settings" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-gray-50">
                  <Settings size={14} /> Paramètres
                </a>
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50">
                  <LogOut size={14} /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;