// components/SocialFloatingButtons.tsx
'use client';

import { usePathname } from 'next/navigation';
import { FaFacebookF, FaWhatsapp, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';

const socialButtons = [
  {
    icon: FaFacebookF,
    label: 'Facebook',
    url: 'https://m.me/votrepagefacebook',
    color: 'bg-[#1877F2] hover:bg-[#166FE5]',
  },
  {
    icon: FaWhatsapp,
    label: 'WhatsApp',
    url: 'https://wa.me/17862345678?text=Bonjour%20!',
    color: 'bg-[#25D366] hover:bg-[#1ebe5d]',
  },
  {
    icon: FaLinkedinIn,
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/votreprofil',
    color: 'bg-[#0A66C2] hover:bg-[#0958a8]',
  },
  {
    icon: FaXTwitter,
    label: 'Twitter / X',
    url: 'https://twitter.com/votrecompte',
    color: 'bg-black hover:bg-neutral-800',
  },
];

export default function SocialFloatingButtons() {
  const pathname = usePathname();

  // Ne pas afficher sur l'admin
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-row sm:flex-col gap-2 sm:gap-3">
      {socialButtons.map((btn) => (
        <a
          key={btn.label}
          href={btn.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${btn.color}`}
          aria-label={`Contactez-nous sur ${btn.label}`}
        >
          <btn.icon size={18} className="sm:text-[22px]" />
        </a>
      ))}
    </div>
  );
}