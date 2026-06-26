// app/admin/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import {
  Loader2, BarChart3, Sparkles, Clock, ArrowRight,
  Camera, Eye, Image, Calendar
} from "lucide-react";
import Link from "next/link";
import { TrafficChart } from "@/components/admin/charts";
import { useAdminStats } from "@/hooks/useAdminStats";

// Icônes SVG pour les cartes
const Icons = {
  FileText: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Users: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  MessageSquare: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Phone: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  TrendingUp: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

export default function AdminOverview() {
  const { stats, loading } = useAdminStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center animate-pulse">
          <Loader2 className="animate-spin text-[#c9a84c]" size={28} />
        </div>
        <p className="text-sm text-gray-400">Chargement des statistiques...</p>
      </div>
    );
  }

  const posts = stats?.counts?.posts ?? 0;
  const users = stats?.counts?.users ?? 0;
  const comments = stats?.counts?.comments ?? 0;
  const contacts = stats?.counts?.contacts ?? 0;
  const pending = stats?.counts?.pending_posts ?? 0;
  
  // ═══════════════════════════════════════════
  // STATS REPORTAGES (NOUVEAU)
  // ═══════════════════════════════════════════
  const reportages = stats?.counts?.reportages ?? 0;
  const reportageViews = stats?.counts?.reportage_views ?? 0;
  const galleryImages = stats?.counts?.gallery_images ?? 0;
  const publishedReportages = stats?.counts?.published_reportages ?? 0;

  const statCards = [
    { 
      icon: <Icons.FileText />, label: "Articles", value: posts, sub: `${pending} en attente`,
      color: "from-emerald-400 to-teal-500", iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
      href: "/admin/posts"
    },
    // ═══════ CARTE REPORTAGES (NOUVEAU) ═══════
    { 
      icon: <Camera size={22} />, label: "Reportages", value: reportages, sub: `${publishedReportages} publiés`,
      color: "from-rose-400 to-pink-500", iconBg: "bg-rose-100", iconColor: "text-rose-600",
      href: "/admin/reportages"
    },
    // ═══════ CARTE VUES REPORTAGES (NOUVEAU) ═══════
    { 
      icon: <Eye size={22} />, label: "Vues reportages", value: reportageViews, sub: "Total des vues",
      color: "from-cyan-400 to-blue-500", iconBg: "bg-cyan-100", iconColor: "text-cyan-600",
      href: "/admin/reportages"
    },
    // ═══════ CARTE IMAGES GALERIE (NOUVEAU) ═══════
    { 
      icon: <Image size={22} />, label: "Images galerie", value: galleryImages, sub: "Dans les reportages",
      color: "from-fuchsia-400 to-purple-500", iconBg: "bg-fuchsia-100", iconColor: "text-fuchsia-600",
      href: "/admin/reportages"
    },
    { 
      icon: <Icons.Users />, label: "Utilisateurs", value: users, sub: "Total inscrits",
      color: "from-blue-400 to-indigo-500", iconBg: "bg-blue-100", iconColor: "text-blue-600",
      href: "/admin/users"
    },
    { 
      icon: <Icons.MessageSquare />, label: "Commentaires", value: comments, sub: "Tous les articles",
      color: "from-violet-400 to-purple-500", iconBg: "bg-violet-100", iconColor: "text-violet-600",
      href: "/admin/comments"
    },
    { 
      icon: <Icons.Phone />, label: "Contacts reçus", value: contacts, sub: "Formulaire site",
      color: "from-amber-400 to-orange-500", iconBg: "bg-amber-100", iconColor: "text-amber-600",
      href: "/admin/contacts"
    },
  ];

  return (
    <div className="space-y-6 p-1">

      {/* ═══════════════════════════════════════════
           BANNIÈRE (MISE À JOUR AVEC REPORTAGES)
           ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0a0a16] via-[#13132b] to-[#0f1a2e] p-6 md:p-8 text-white">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#c9a84c]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-white/60 font-medium">Système actif</span>
            </div>
            
            <h1 className="text-[1.5rem] md:text-[1.75rem] font-extrabold tracking-tight leading-tight">
              Bonjour — tout est <span className="text-[#c9a84c]">sous contrôle</span> 👋
            </h1>
            
            {/* ═══════ STATS DANS LA BANNIÈRE (AVEC REPORTAGES) ═══════ */}
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-white/50">
              <span className="flex items-center gap-2">
                <Clock size={13} className="text-amber-400" />
                <span className="text-white font-semibold">{pending}</span> articles en attente
              </span>
              <span className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-2">
                <Camera size={13} className="text-rose-400" />
                <span className="text-white font-semibold">{reportages}</span> reportages
              </span>
              <span className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-2">
                <Eye size={13} className="text-cyan-400" />
                <span className="text-white font-semibold">{reportageViews}</span> vues
              </span>
            </div>
            
            {/* ═══════ BOUTONS (AVEC REPORTAGES) ═══════ */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/admin/posts">
                <Button className="bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e] font-bold text-[13px] h-10 px-5 rounded-xl shadow-lg shadow-[#c9a84c]/20 active:scale-95 transition-all">
                  <Icons.FileText />
                  <span className="ml-2">Gérer les articles</span>
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
              {/* ═══════ BOUTON REPORTAGES (NOUVEAU) ═══════ */}
              <Link href="/admin/reportages">
                <Button variant="outline" className="border-white/15 text-white hover:bg-white/5 font-medium text-[13px] h-10 px-5 rounded-xl active:scale-95 transition-all">
                  <Camera size={14} />
                  <span className="ml-2">Voir les reportages</span>
                </Button>
              </Link>
            </div>
          </div>
          
          {/* ═══════ ICÔNES DÉCORATIVES (AVEC CAMÉRA) ═══════ */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Camera size={24} className="text-rose-400" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
              <Sparkles size={24} className="text-[#c9a84c]" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
           CARTES STATS (AVEC REPORTAGES)
           ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link key={i} href={card.href}>
            <div className={`group relative bg-white border border-gray-100 rounded-[1.25rem] p-5 
              hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} 
                scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-600">
                  <Icons.TrendingUp />
                  +12%
                </div>
              </div>
              <p className="text-[1.75rem] font-extrabold text-gray-900 tracking-tight">{card.value}</p>
              <p className="text-[13px] font-semibold text-gray-700">{card.label}</p>
              <p className="text-[11px] text-gray-400">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
           SECTION REPORTAGES (NOUVEAU)
           ═══════════════════════════════════════════ */}
      {reportages > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-gray-100 shadow-none rounded-[1.25rem] overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Camera size={15} className="text-rose-600" />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-bold text-gray-900">Reportages récents</CardTitle>
                  <p className="text-[11px] text-gray-400">Derniers reportages publiés</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/reportages" className="block p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Gérer tous les reportages</span>
                    </div>
                    <ArrowRight size={14} className="text-gray-400" />
                  </div>
                </Link>
                <div className="flex items-center justify-between text-sm text-gray-500 px-3">
                  <span>{publishedReportages} publiés sur {reportages} total</span>
                  <span>{galleryImages} images</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-none rounded-[1.25rem] overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Eye size={15} className="text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-bold text-gray-900">Statistiques vues</CardTitle>
                  <p className="text-[11px] text-gray-400">Performances des reportages</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-gray-600">Vues totales</span>
                  <span className="text-lg font-bold text-gray-900">{reportageViews}</span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-gray-600">Moyenne par reportage</span>
                  <span className="text-lg font-bold text-gray-900">
                    {reportages > 0 ? Math.round(reportageViews / reportages) : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* GRAPHIQUE */}
      <Card className="border-gray-100 shadow-none rounded-[1.25rem] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <BarChart3 size={15} className="text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-[15px] font-bold text-gray-900">Trafic du site</CardTitle>
              <p className="text-[11px] text-gray-400">30 derniers jours</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <TrafficChart />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}