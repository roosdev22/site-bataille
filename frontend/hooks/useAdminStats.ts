"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface AdminStats {
  counts: {
    users: number | null;
    posts: number;
    comments: number;
    contacts: number;
    pending_posts: number;
    reportages: number;
    reportage_views: number;
    gallery_images: number;
    published_reportages: number;
  };
  recent: {
    users: number | null;
    posts: number;
  };
  updated_at: string;
}

interface UseAdminStatsReturn {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Cache global
let cachedStats: AdminStats | null = null;
let lastFetchTime = 0;
const CACHE_MS = 30000; // 30 secondes

// Valeurs par défaut si Django est indisponible
const DEFAULT_DJANGO_DATA = {
  counts: {
    users: null,
    posts: 0,
    comments: 0,
    pending_posts: 0,
    reportages: 0,
    reportage_views: 0,
    gallery_images: 0,
    published_reportages: 0,
  },
  recent: {
    users: null,
    posts: 0,
  },
};

export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminStats | null>(cachedStats);
  const [loading, setLoading] = useState(!cachedStats);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchStats = useCallback(async (force = false) => {
    // Retourne le cache si valide
    if (!force && cachedStats && Date.now() - lastFetchTime < CACHE_MS) {
      setStats(cachedStats);
      setLoading(false);
      return;
    }

    if (mounted.current) setLoading(true);
    setError(null);

    try {
      // Appels parallèles Django + Supabase
      const [djangoRes, supabaseRes] = await Promise.allSettled([
        api.get("/admin/stats/"),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
      ]);

      // FIX: fallback sur DEFAULT_DJANGO_DATA au lieu de throw
      const djangoData = djangoRes.status === 'fulfilled'
        ? (djangoRes.value?.data ?? DEFAULT_DJANGO_DATA)
        : DEFAULT_DJANGO_DATA;

      const contactsCount = supabaseRes.status === 'fulfilled'
        ? (supabaseRes.value.count || 0)
        : 0;

      // FIX: signaler l'indisponibilité Django sans bloquer l'affichage
      if (djangoRes.status === 'rejected') {
        console.warn("Django indisponible, affichage des stats partielles.");
        if (mounted.current) setError("Stats Django temporairement indisponibles");
      }

      const newStats: AdminStats = {
        counts: {
          users:                djangoData.counts?.users                ?? null,
          posts:                djangoData.counts?.posts                ?? 0,
          comments:             djangoData.counts?.comments             ?? 0,
          contacts:             contactsCount,
          pending_posts:        djangoData.counts?.pending_posts        ?? 0,
          reportages:           djangoData.counts?.reportages           ?? 0,
          reportage_views:      djangoData.counts?.reportage_views      ?? 0,
          gallery_images:       djangoData.counts?.gallery_images       ?? 0,
          published_reportages: djangoData.counts?.published_reportages ?? 0,
        },
        recent: {
          users: djangoData.recent?.users ?? null,
          posts: djangoData.recent?.posts ?? 0,
        },
        updated_at: new Date().toISOString(),
      };

      // Mise en cache uniquement si Django a répondu
      if (djangoRes.status === 'fulfilled') {
        cachedStats = newStats;
        lastFetchTime = Date.now();
      }

      if (mounted.current) setStats(newStats);
    } catch (err: any) {
      if (mounted.current) {
        console.error("Erreur chargement stats:", err);
        setError("Impossible de charger les statistiques");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchStats();

    // Rafraîchir toutes les 30 secondes SEULEMENT si la page est visible
    const interval = setInterval(() => fetchStats(), CACHE_MS);

    // Rafraîchir quand l'onglet redevient visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchStats]);

  return { stats, loading, error, refresh: () => fetchStats(true) };
}