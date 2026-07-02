// components/layout/Header.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { SITE_CONFIG } from "@/utils/constants"
import LanguageSwitcher from "@/components/sections/LanguageSwitcher";

const publicNavItems = [
  { label: "Accueil", href: "/" },
  { label: "Articles", href: "/#articles" },
  { label: "À propos", href: "/#about" },
  { label: "Reportages", href: "/#reportages" },
  { label: "Contact", href: "/#contact" },
]

const writerNavItems = [
  { label: "Tableau de bord", href: "/writer" },
  { label: "Mes articles", href: "/writer/posts" },
  { label: "Nouvel article", href: "/writer/posts/new" },
]

const adminNavItems = [
  { label: "Admin", href: "/admin" },
  { label: "Utilisateurs", href: "/admin/users" },
  { label: "Articles", href: "/admin/posts" },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isDashboardPage = pathname.startsWith("/writer") || pathname.startsWith("/admin")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Fermer le menu mobile au changement de route
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleNavClick = () => setMobileOpen(false)

  // Navigation contextuelle basée sur le rôle
  const getNavItems = () => {
    if (!isDashboardPage) return publicNavItems
    return isAdmin ? adminNavItems : writerNavItems
  }

  const handleLogout = async () => {
    if (isLoggingOut) return // Évite les doubles clics
    setIsLoggingOut(true)
    handleNavClick()
    await logout()
    // logout fait déjà window.location.href = "/"
  }

  const navItems = getNavItems()

  // Composant réutilisable pour les liens de navigation
  const NavLink = ({ href, label, mobile = false }: { href: string; label: string; mobile?: boolean }) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
    
    return (
      <Link
        href={href}
        onClick={handleNavClick}
        className={`
          ${mobile ? "block px-4 py-3 rounded-2xl" : "px-5 py-2.5 rounded-2xl"}
          text-sm font-medium transition-all duration-200
          ${isActive 
            ? "text-[#1c1c2e] bg-gray-100 font-semibold" 
            : "text-gray-500 hover:text-[#1c1c2e] hover:bg-gray-50"
          }
        `}
      >
        {label}
      </Link>
    )
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm"
          : "bg-white/60 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-[4.5rem]">
          
          {/* Logo */}
          <Link 
            href={isDashboardPage ? (isAdmin ? "/admin" : "/writer") : "/"} 
            className="flex items-center gap-3 group" 
            onClick={handleNavClick}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
              transition-transform duration-300 group-hover:scale-105
              ${isDashboardPage 
                ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20" 
                : "bg-gradient-to-br from-[#c9a84c] to-[#e0c86e] shadow-[#c9a84c]/20"
              }`}
            >
              <span className="text-[#1c1c2e] font-extrabold text-lg">
                {SITE_CONFIG.name?.charAt(0) || "B"}
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-[#1c1c2e] text-lg tracking-tight">
                {SITE_CONFIG.name}
              </span>
              <span className="text-[11px] text-gray-400 block font-medium">
                {isDashboardPage ? "Dashboard" : SITE_CONFIG.tagline || "Santé & Voyages"}
              </span>
            </div>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          {/* CTA Desktop - Version contextuelle optimisée */}
          <div className="hidden md:flex items-center gap-3">  
              <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                {/* Badge utilisateur */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-2xl">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        {user?.first_name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user?.first_name || user?.email?.split("@")[0] || "Utilisateur"}
                  </span>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-[#1c1c2e] text-white px-5 py-2.5 rounded-2xl text-sm font-semibold
                  hover:bg-[#2a2a3e] transition-all duration-300 shadow-lg shadow-[#1c1c2e]/10
                  active:scale-95"
              >
                Se connecter
              </Link>
            )}
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative w-10 h-10 rounded-xl flex items-center justify-center
              text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            <div className="flex flex-col gap-1.5">
              <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                mobileOpen ? "rotate-45 translate-y-[3px] w-5" : ""
              }`} />
              <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`} />
              <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                mobileOpen ? "-rotate-45 -translate-y-[3px] w-5" : ""
              }`} />
            </div>
          </button>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-gray-100"
            >
              <nav className="py-6 space-y-1">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NavLink href={item.href} label={item.label} mobile />
                  </motion.div>
                ))}
                
                {/*  Actions mobiles simples - PARTIE CORRIGÉE */}
                {!isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="pt-6 px-4"
                  >
                    <Link
                      href="/login"
                      onClick={handleNavClick}
                      className="block w-full bg-[#1c1c2e] text-white text-center py-3.5 rounded-2xl
                        text-sm font-semibold hover:bg-[#2a2a3e] transition-all shadow-lg
                        active:scale-95"
                    >
                      Se connecter
                    </Link>
                  </motion.div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}