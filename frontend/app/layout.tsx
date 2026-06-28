// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import SocialFloatingButtons from "@/components/SocialFloatingButtons";

export const metadata: Metadata = {
  title: "Site Bataille",
  description: "Votre blog",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" richColors />
        <SocialFloatingButtons />
      </body>
    </html>
  );
}// cache fix
