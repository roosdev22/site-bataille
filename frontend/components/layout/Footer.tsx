// components/layout/Footer.tsx
import { SITE_CONFIG } from "@/utils/constants";
import Link from "next/link";

const footerLinks = [
  { label: "Accueil", href: "/" },
  { label: "Articles", href: "#articles" },
  { label: "À propos", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const socialLinks = [
  {
    label: "Twitter / X",
    href: "#",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect width="20" height="20" x="2" y="2" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/>
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a16] border-t border-white/5">
      <div className="container mx-auto px-6 py-16">
        
        {/* Grille principale */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          
          {/* Marque */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e0c86e] 
                flex items-center justify-center shadow-lg shadow-[#c9a84c]/20">
                <span className="text-[#1c1c2e] font-extrabold text-lg">B</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">{SITE_CONFIG.name}</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {SITE_CONFIG.tagline || "Des articles de fond sur la médecine, le bien-être et les voyages."}
            </p>
          </div>

          {/* Liens */}
          <div>
            <h4 className="text-white font-bold text-sm mb-5 tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-[#c9a84c] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux */}
          <div>
            <h4 className="text-white font-bold text-sm mb-5 tracking-wider uppercase">Suivez-nous</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center
                    text-white/40 hover:text-[#c9a84c] hover:bg-white/10 hover:border-[#c9a84c]/30
                    transition-all duration-300 hover:scale-110"
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">
            © {currentYear} {SITE_CONFIG.name} — Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/25 hover:text-white/50 text-xs transition-colors">
              Confidentialité
            </a>
            <a href="#" className="text-white/25 hover:text-white/50 text-xs transition-colors">
              Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}