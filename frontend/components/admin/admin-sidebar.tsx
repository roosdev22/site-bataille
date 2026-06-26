// components/admin/admin-sidebar.tsx
'use client';

import Link from "next/link";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare,
  Users, Phone, Settings, ChevronLeft,
  Megaphone, Loader2, LogOut, UserCircle2,
  Camera,  // ← Ajoutez cette icône pour les reportages
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { href: "/admin",          icon: LayoutDashboard, label: "Vue d'ensemble", badgeKey: null },
  { href: "/admin/posts",    icon: FileText,         label: "Articles",       badgeKey: "posts" },
  { href: "/admin/comments", icon: MessageSquare,    label: "Commentaires",   badgeKey: "comments" },
  { href: "/admin/users",    icon: Users,            label: "Utilisateurs",   badgeKey: "users" },
  { href: "/admin/reportages", icon: Camera,         label: "Reportages",     badgeKey: "reportages" },
  { href: "/admin/ads",      icon: Megaphone,        label: "Publicités",     badgeKey: null },
  { href: "/admin/contacts", icon: Phone,            label: "Contacts",       badgeKey: null },
  { href: "/admin/settings", icon: Settings,         label: "Paramètres",     badgeKey: null },
  { href: "/", icon: Home, label: "Accueil", badgeKey: null },
];

export default function AdminSidebar() {
  const pathname  = usePathname();
  const { stats, loading } = useAdminStats();
  const { user, logout }   = useAuth();

  const getBadge = (key: string | null): string | null => {
    if (!key || !stats) return null;
    const value = stats.counts[key as keyof typeof stats.counts];
    if (value === null || value === undefined) return null;
    return value > 99 ? "99+" : String(value);
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <aside
      className="w-64 bg-[#1c1c2e] text-white flex flex-col shrink-0"
      style={{ transition: "width 0.3s ease" }}
    >
      {/* ── Logo ── */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#c9a84c] flex items-center justify-center">
            <span className="text-[#1c1c2e] font-bold text-sm">B</span>
          </div>
          <span className="text-base font-bold tracking-wide text-white">
            Site Bataille
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          const badge = getBadge(item.badgeKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl text-sm
                transition-all duration-200 ease-in-out
                ${isActive
                  ? "bg-[#c9a84c] text-[#1c1c2e] font-semibold shadow-lg shadow-[#c9a84c]/20"
                  : "text-white/60 hover:text-white hover:bg-white/8"
                }
              `}
            >
              <item.icon
                size={18}
                className={`
                  shrink-0 transition-transform duration-200
                  ${isActive ? "scale-110" : "group-hover:scale-105"}
                `}
              />
              <span className="flex-1 truncate">{item.label}</span>

              {item.badgeKey && (
                loading ? (
                  <Loader2 size={13} className="animate-spin text-white/30" />
                ) : badge ? (
                  <span
                    className={`
                      text-[11px] px-2 py-0.5 rounded-full font-semibold
                      min-w-[22px] text-center transition-all duration-300
                      ${isActive
                        ? "bg-[#1c1c2e] text-[#c9a84c]"
                        : "bg-red-500/20 text-red-400"
                      }
                    `}
                  >
                    {badge}
                  </span>
                ) : null
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Retour au site ── */}
      <div className="px-3 pb-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
            text-white/40 hover:text-white/70 hover:bg-white/5
            transition-all duration-200"
        >
          <ChevronLeft size={16} />
          Retour au site
        </Link>
      </div>

      {/* ── Utilisateur connecté ── */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#c9a84c] flex items-center justify-center">
              {initials !== "?" ? (
                <span className="text-[#1c1c2e] font-bold text-sm">{initials}</span>
              ) : (
                <UserCircle2 size={20} className="text-[#1c1c2e]" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1c1c2e]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user ? `${user.first_name} ${user.last_name}` : "Chargement…"}
            </p>
            <p className="text-[11px] text-[#c9a84c] truncate">
              {user?.role === "admin" ? "Super Admin" : "Écrivain"}
            </p>
          </div>

          <button
            onClick={logout}
            title="Se déconnecter"
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-white/30 hover:text-red-400 hover:bg-red-400/10
              transition-all duration-200"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}