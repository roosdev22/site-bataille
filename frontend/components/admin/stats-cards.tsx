// components/admin/stats-cards.tsx
"use client";

import Link from "next/link";
import { Users, FileText, MessageSquare, TrendingUp } from "lucide-react";

interface StatsProps {
  stats: {
    total_posts: number;
    total_published: number;
    total_drafts: number;
    total_pending: number;
    total_views: number;
    posts_growth: number;
    views_growth: number;
  };
}

export function StatsCards({ stats }: StatsProps) {
  const items = [
    { label: "Articles", value: stats.total_posts, trend: `${stats.posts_growth > 0 ? "+" : ""}${stats.posts_growth}%`, icon: FileText, color: "bg-blue-50 text-blue-600", href: "/admin/posts" },
    { label: "En attente", value: stats.total_pending, trend: "À valider", icon: FileText, color: "bg-amber-50 text-amber-600", href: "/admin/posts" },
    { label: "Publiés", value: stats.total_published, trend: "En ligne", icon: FileText, color: "bg-green-50 text-green-600", href: "/admin/posts" },
    { label: "Vues", value: stats.total_views >= 1000 ? `${(stats.total_views / 1000).toFixed(1)}K` : stats.total_views, trend: `${stats.views_growth}%`, icon: TrendingUp, color: "bg-violet-50 text-violet-600", href: "/admin/reports" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="bg-white border rounded-xl p-3 flex items-center gap-2.5 hover:border-gray-300 transition-all">
          <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center ${item.color}`}>
            <item.icon size={16} />
          </div>
          <div>
            <div className="text-xl font-medium text-gray-900">{item.value}</div>
            <div className="text-[11px] text-gray-500">{item.label}</div>
            <div className="text-[10px] text-green-600">{item.trend}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}