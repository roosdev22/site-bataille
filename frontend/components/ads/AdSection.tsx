"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Ad {
  id: string;
  title: string;
  image: string;
  destination_url: string;
  alt_text: string;
  format: string;
}

interface AdWithMetadata extends Ad {
  advertiser_name?: string;
  target_category?: string;
}

export type AdFormat =
  | "banner_top"
  | "banner_bottom"
  | "sidebar"
  | "in_content"
  | "sticky_footer";

interface AdSectionProps {
  format: AdFormat;
  category?: string;
}

// ─────────────────────────────────────────────
// Hook interne — fetch + tracking
// ─────────────────────────────────────────────

function useAd(format: AdFormat, category: string) {
  const [ad, setAd] = useState<AdWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const tracked = useRef(false);

  useEffect(() => {
    tracked.current = false;
    setAd(null);
    setLoading(true);

    fetch(`${API}/ads/slot/?slot=${format}&category=${category}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const results = Array.isArray(data) ? data : (data.results ?? []);
        setAd(results[0] ?? null);
      })
      .catch(() => setAd(null))
      .finally(() => setLoading(false));
  }, [format, category]);

  // Impression tracking
  useEffect(() => {
    if (!ad || tracked.current) return;
    tracked.current = true;
    fetch(`${API}/ads/${ad.id}/impression/`, { method: "POST" }).catch(() => {});
  }, [ad]);

  // Click tracking + redirect
  const handleClick = useCallback(() => {
    if (!ad) return;
    fetch(`${API}/ads/${ad.id}/click/`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        window.open(data.url ?? ad.destination_url, "_blank", "noopener,noreferrer");
      })
      .catch(() => {
        window.open(ad.destination_url, "_blank", "noopener,noreferrer");
      });
  }, [ad]);

  return { ad, loading, handleClick };
}

// ─────────────────────────────────────────────
// Design tokens (aligné avec le design system)
// ─────────────────────────────────────────────

const COLORS = {
  dark: "#1c1c2e",
  text: "#2d2d3d",
  textSecondary: "#666666",
  textLight: "#999999",
  border: "#e5e5e5",
  borderLight: "#f0f0f0",
  bgLight: "#fafafa",
};

const SPACING = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

// ─────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────

function Skeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: "linear-gradient(90deg, #f0f0f0 0%, #e5e5e5 50%, #f0f0f0 100%)",
        backgroundSize: "200% 100%",
        animation: "adSkeleton 2s infinite",
        borderRadius: 8,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Composant carte pub — Design élégant
// ─────────────────────────────────────────────

interface AdCardProps {
  ad: AdWithMetadata;
  onClick: () => void;
  compact?: boolean;
}

function AdCard({ ad, onClick, compact = false }: AdCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.12)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.08)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Image */}
      <button
        onClick={onClick}
        style={{
          width: "100%",
          border: "none",
          padding: 0,
          background: "none",
          cursor: "pointer",
          display: "block",
          position: "relative",
          overflow: "hidden",
          aspectRatio: compact ? "16 / 9" : "4 / 3",
        }}
        aria-label={ad.alt_text || ad.title}
      >
        <img
          src={ad.image}
          alt={ad.alt_text || ad.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLImageElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLImageElement).style.transform = "scale(1)";
          }}
        />

        {/* Badge Sponsorisé */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(28, 28, 46, 0.8)",
            backdropFilter: "blur(8px)",
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: 1,
            padding: "4px 8px",
            borderRadius: 4,
            textTransform: "uppercase",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          Sponsorisé
        </div>
      </button>

      {/* Contenu */}
      <div style={{ padding: SPACING.md }}>
        {/* Titre */}
        <h4
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "14px",
            fontWeight: 600,
            color: COLORS.dark,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {ad.title}
        </h4>

        {/* Annonceur + Catégorie */}
        {(ad.advertiser_name || ad.target_category) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            {ad.advertiser_name && (
              <span
                style={{
                  fontSize: "11px",
                  color: COLORS.textLight,
                  fontWeight: 500,
                }}
              >
                {ad.advertiser_name}
              </span>
            )}
            {ad.advertiser_name && ad.target_category && (
              <span style={{ color: COLORS.borderLight }}>•</span>
            )}
            {ad.target_category && ad.target_category !== "all" && (
              <span
                style={{
                  fontSize: "10px",
                  background: COLORS.bgLight,
                  color: COLORS.textSecondary,
                  padding: "2px 6px",
                  borderRadius: 3,
                  textTransform: "capitalize",
                }}
              >
                {ad.target_category}
              </span>
            )}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={onClick}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: COLORS.dark,
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "#2d2d3d";
            (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.target as HTMLButtonElement).style.boxShadow =
              "0 4px 12px rgba(28, 28, 46, 0.25)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = COLORS.dark;
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            (e.target as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          Découvrir →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant principal — AdSection
// ─────────────────────────────────────────────

export default function AdSection({ format, category = "all" }: AdSectionProps) {
  const { ad, loading, handleClick } = useAd(format, category);

  // ── sticky_footer — Barre fixe en bas ──
  if (format === "sticky_footer") {
    if (!ad && !loading) return null;
    return (
      <>
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: `${SPACING.sm} ${SPACING.md}`,
            background: "linear-gradient(to top, rgba(255,255,255,0.98) 70%, transparent)",
            backdropFilter: "blur(8px)",
            borderTop: `1px solid ${COLORS.borderLight}`,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            {loading ? (
              <Skeleton height={70} />
            ) : ad ? (
              <AdCard ad={ad} onClick={handleClick} compact />
            ) : null}
          </div>
        </div>
        <div style={{ height: 100 }} />
        <style>{`@keyframes adSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </>
    );
  }

  // ── sidebar — Sticky sur le côté ──
  if (format === "sidebar") {
    if (!ad && !loading) return null;
    return (
     <>
  <div style={{ position: "sticky", top: 60 }}>
    {loading ? (
      <Skeleton height={180} /> 
    ) : ad ? (
      <AdCard ad={ad} onClick={handleClick} compact /> 
    ) : null}
  </div>
  <style>{`@keyframes adSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
</>
    );
  }

  // ── in_content — Intégrée dans l'article ──
  if (format === "in_content") {
    if (!ad && !loading) return null;
    return (
      <>
        <div
          style={{
            margin: `${SPACING.xl} 0`,
            padding: `${SPACING.lg} 0`,
            borderTop: `1px solid ${COLORS.borderLight}`,
            borderBottom: `1px solid ${COLORS.borderLight}`,
          }}
        >
          {loading ? (
            <Skeleton height={200} />
          ) : ad ? (
            <div>
              <p
                style={{
                  margin: `0 0 ${SPACING.md} 0`,
                  fontSize: "11px",
                  color: COLORS.textLight,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Contenu sponsorisé
              </p>
              <AdCard ad={ad} onClick={handleClick} compact />
            </div>
          ) : null}
        </div>
        <style>{`@keyframes adSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </>
    );
  }

  // ── banner_top / banner_bottom — Section pleine largeur ──
  if (!ad && !loading) return null;

  return (
    <>
      <section
        style={{
          maxWidth: 500,
          margin: "0 auto 48px",
          padding: `10 ${SPACING.lg}`,
          marginTop: "3rem",
        }}
      >
        {loading ? (
          <Skeleton height={180} />
        ) : ad ? (
          <AdCard ad={ad} onClick={handleClick} compact />
        ) : null}
      </section>
      <style>{`@keyframes adSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </>
  );
}