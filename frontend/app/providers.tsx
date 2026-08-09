// app/providers.tsx
"use client"

import { ReactNode, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AuthProvider, useAuth } from "@/hooks/useAuth"

// ============================================
// DÉFINITION DES ROUTES
// ============================================

const PUBLIC_ROUTES = [
  '/',           //  Page d'accueil (publique)
  '/posts',      // Liste des posts (public)
  '/about',      //  À propos (public)
  '/contact',    //  Contact (public)
] as const

const AUTH_ROUTES = [
  '/login',
  '/register',
] as const

const PROTECTED_ROUTES = [
  '/writer',     // ❌ Nécessite login
  '/admin',      // ❌ Nécessite login + admin role
  '/dashboard',  // ❌ Nécessite login
] as const

// ============================================
// HELPER FUNCTIONS
// ============================================

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

// ============================================
// AUTH GUARD
// ============================================

function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isAuthenticated } = useAuth()
  
  // Track redirects pour éviter les boucles
  const redirectedTo = useRef<string | null>(null)

  useEffect(() => {
    // Pendant le chargement, on ne fait rien
    if (loading) {
      console.log("[🔐 AuthGuard] Chargement en cours...")
      return
    }

    console.log("[🔐 AuthGuard]", {
      pathname,
      isAuthenticated,
      userRole: user?.role,
      isPublic: isPublicRoute(pathname),
      isAuth: isAuthRoute(pathname),
      isProtected: isProtectedRoute(pathname),
    })

    // ✅ ROUTES PUBLIQUES : Toujours accessible (login ou pas)
      function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;

  return (
    pathname.startsWith("/posts") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact")
  );
}

    // ✅ ROUTES AUTH (login/register) : Accessible à tous
    if (isAuthRoute(pathname)) {
      // Si connecté, rediriger vers dashboard
         if (isAuthenticated) {
              const target =
               user?.role === "admin"
                ? "/admin"
                : "/writer"
        if (redirectedTo.current !== target) {
          console.log(`[🔐 AuthGuard] 🔄 Connecté sur login, redirection vers ${target}`)
          redirectedTo.current = target
          router.replace(target)
        }
      }
      return
    }

    // ❌ ROUTES PROTÉGÉES : Nécessitent login
    if (isProtectedRoute(pathname)) {
      if (!isAuthenticated) {
        const redirectUrl = `/login?next=${encodeURIComponent(pathname)}`
        if (redirectedTo.current !== redirectUrl) {
          console.log(`[🔐 AuthGuard] 🔄 Non connecté, redirection vers login`)
          redirectedTo.current = redirectUrl
          router.replace(redirectUrl)
        }
        return
      }

      // ❌ ROUTE ADMIN : Vérifier le rôle
      if (isAdminRoute(pathname)) {
        if (user?.role !== 'admin') {
          if (redirectedTo.current !== '/writer') {
            console.log(`[🔐 AuthGuard] 🔄 Non-admin, redirection vers writer`)
            redirectedTo.current = '/writer'
            router.replace('/writer')
          }
          return
        }
      }

      console.log("[🔐 AuthGuard] ✅ Route protégée, accès autorisé")
      redirectedTo.current = null
    }
  }, [loading, pathname, isAuthenticated, user?.role, router])

  // LOADING STATE
 if (loading && isProtectedRoute(pathname)) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
        </div>

        <p className="text-gray-600 font-medium">
          Vérification de votre authentification...
        </p>

        <p className="text-gray-400 text-sm">
          Cela ne prendra que quelques secondes
        </p>
      </div>
    </div>
  )
}

  return <>{children}</>
}

// ============================================
// PROVIDERS
// ============================================

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  )
}