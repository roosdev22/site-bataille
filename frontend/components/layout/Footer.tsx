import Link from "next/link";
import { SITE_CONFIG } from "@/utils/constants";
import aboutData from "@/data/data.json";

const footerLinks = [
  { label: "Accueil", href: "/" },
  { label: "Articles", href: "#articles" },
  { label: "À propos", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const socialIcons = {
  linkedin: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.5 8.5H3V21h3.5V8.5ZM4.75 3A2.05 2.05 0 1 0 4.75 7.1 2.05 2.05 0 0 0 4.75 3ZM21 13.87c0-3.76-2-5.51-4.68-5.51-2.15 0-3.11 1.18-3.65 2.01V8.5H9.17V21h3.5v-6.19c0-1.63.31-3.2 2.32-3.2 1.98 0 2.01 1.86 2.01 3.31V21H21v-7.13Z" />
    </svg>
  ),

  facebook: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  ),

  instagram: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" />
    </svg>
  ),

  arrowUpRight: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  ),
};

type SocialData = {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const { social } = aboutData as typeof aboutData & {
    social?: SocialData;
  };

  const socialLinks = [
    {
      label: "LinkedIn",
      href: social?.linkedin,
      icon: socialIcons.linkedin,
    },
    {
      label: "Facebook",
      href: social?.facebook,
      icon: socialIcons.facebook,
    },
    {
      label: "Instagram",
      href: social?.instagram,
      icon: socialIcons.instagram,
    },
  ].filter(
    (item): item is {
      label: string;
      href: string;
      icon: () => React.JSX.Element;
    } => Boolean(item.href)
  );

  return (
    <footer className="relative overflow-hidden bg-[#20212a] text-white">
      {/* Décorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full border border-[#a68745]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 h-[420px] w-[420px] rounded-full border border-[#a68745]/10"
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Citation */}
        <div className="border-b border-white/10 py-14 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#a68745]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a68745]">
                  Une plume · Une vision
                </span>
              </div>

              <p className="font-display text-2xl font-medium leading-[1.35] text-white/90 sm:text-3xl lg:text-4xl">
                « Rendre la médecine accessible, éclairée par le monde qu&apos;il
                a parcouru. »
              </p>
            </div>

            <div className="hidden lg:block">
              <span className="font-display text-7xl italic text-[#a68745]/20">
                B
              </span>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="grid gap-12 py-14 sm:py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.8fr] lg:gap-20 lg:py-20">
          {/* Identité */}
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-4"
              aria-label="Retour à l'accueil"
            >
              <span className="flex h-11 w-11 items-center justify-center border border-[#a68745]/40 transition-colors duration-300 group-hover:border-[#a68745]">
                <span className="font-display text-xl italic text-[#a68745]">
                  B
                </span>
              </span>

              <span className="font-display text-xl tracking-tight text-white">
                {SITE_CONFIG.name}
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/45">
              {SITE_CONFIG.tagline ||
                "Des articles de fond sur la médecine, le bien-être, les voyages et les grandes expériences humaines."}
            </p>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-px w-8 bg-[#a68745]/60" />

              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                Médecine · Écriture · Monde
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a68745]">
              Navigation
            </h3>

            <nav aria-label="Navigation du pied de page">
              <ul className="space-y-4">
                {footerLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-white/45 transition-colors duration-300 hover:text-white"
                    >
                      <span>{link.label}</span>

                      <span className="-translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        {socialIcons.arrowUpRight()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="mb-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a68745]">
              Réseaux
            </h3>

            {socialLinks.length > 0 ? (
              <div className="space-y-3">
                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visiter ${item.label}`}
                      className="group flex w-fit items-center gap-3 text-sm text-white/45 transition-colors duration-300 hover:text-white"
                    >
                      <span className="flex h-9 w-9 items-center justify-center border border-white/10 transition-all duration-300 group-hover:border-[#a68745]/50 group-hover:text-[#a68745]">
                        <Icon />
                      </span>

                      <span>{item.label}</span>

                      <span className="-translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        {socialIcons.arrowUpRight()}
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="max-w-xs text-sm leading-6 text-white/30">
                Retrouvez prochainement les réseaux professionnels.
              </p>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-5 text-white/25">
              © {currentYear} {SITE_CONFIG.name}. Tous droits réservés.
            </p>

            <div className="flex items-center gap-6">
              <Link
                href="/confidentialite"
                className="text-[11px] text-white/25 transition-colors duration-300 hover:text-white/60"
              >
                Confidentialité
              </Link>

              <Link
                href="/conditions"
                className="text-[11px] text-white/25 transition-colors duration-300 hover:text-white/60"
              >
                Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
