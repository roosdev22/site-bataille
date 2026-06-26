"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function WriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Chargement de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1c1c2e] border-t-transparent" />
      </div>
    );
  }

  // AuthGuard devrait déjà gérer cela,
  // mais on évite tout rendu si l'utilisateur n'existe pas.
  if (!user) {
    return null;
  }

  // Sécurité supplémentaire
  if (user.role !== "writer" && user.role !== "admin") {
    return null;
  }

  const userName =
    user.first_name ||
    user.email ||
    "Utilisateur";

  const menuItems = [
    {
      href: "/writer",
      label: "Mes articles",
      icon: "📝",
    },
    {
      href: "/writer/new",
      label: "Nouvel article",
      icon: "✍️",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-[#1c1c2e] flex flex-col fixed left-0 top-0 h-full">
        <div className="p-5">
          <h2 className="text-[#c9a84c] font-bold text-sm tracking-wide">
            Espace Écrivain
          </h2>

          <p className="text-[11px] text-gray-500 mt-1 truncate">
            {userName}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                  isActive
                    ? "bg-[#c9a84c] text-[#1c1c2e] font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-[11px] text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56 p-6">
        {children}
      </main>
    </div>
  );
}