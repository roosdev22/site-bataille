// components/sections/NewsletterSection.tsx
"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const Icons = {
  Trending: () => <svg className="w-5 sm:w-6 h-5 sm:h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Eye: () => <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Mail: () => <svg className="w-10 sm:w-12 h-10 sm:h-12 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Check: () => <svg className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M20 6 9 17l-5-5"/></svg>,
  ChevronRight: () => <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6"/></svg>,
};

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const trending = [
    { rank: 1, title: "Les nouvelles avancées en cardiologie", category: "Médical", views: "12.5k" },
    { rank: 2, title: "Guide complet pour voyager en Asie", category: "Voyage", views: "8.2k" },
    { rank: 3, title: "La télémédecine en 2024", category: "Médical", views: "6.8k" },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-[#fafaf8] to-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-16">
          
          {/* ── Trending ── */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-8">
              <Icons.Trending />
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1c1c2e] tracking-tight">Tendances</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Les articles les plus lus cette semaine</p>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {trending.map((item) => (
                <div
                  key={item.rank}
                  className="group flex items-center gap-3 sm:gap-5 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-gray-100
                    hover:border-[#c9a84c]/20 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5
                    transition-all duration-300 cursor-pointer"
                >
                  <span className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight shrink-0 w-8 sm:w-10 md:w-12 text-center
                    ${item.rank === 1 ? "text-[#c9a84c]" : item.rank === 2 ? "text-[#1c1c2e]/60" : "text-gray-300"}`}>
                    {String(item.rank).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#1c1c2e] group-hover:text-[#c9a84c] transition-colors text-sm sm:text-base truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-gray-400">
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 font-medium text-[10px] sm:text-xs">{item.category}</span>
                      <span className="flex items-center gap-1">
                        <Icons.Eye /> {item.views} vues
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Icons.ChevronRight />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Newsletter ── */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 bg-gradient-to-br from-[#1c1c2e] to-[#2a2a3e] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white
              shadow-xl sm:shadow-2xl shadow-[#1c1c2e]/20">
              <Icons.Mail />
              <h3 className="text-xl sm:text-2xl font-extrabold mt-4 sm:mt-6 mb-1 sm:mb-2">Newsletter</h3>
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                Recevez les meilleurs articles santé & voyage directement dans votre boîte mail.
              </p>
              
              {sent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center">
                  <div className="flex justify-center"><Icons.Check /></div>
                  <p className="text-emerald-400 font-semibold mt-2 text-sm sm:text-base">Inscrit avec succès !</p>
                  <p className="text-white/40 text-[11px] sm:text-xs mt-1">Vérifiez votre boîte mail.</p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-sm text-white
                      placeholder:text-white/30 outline-none focus:border-[#c9a84c]/40 focus:ring-4 focus:ring-[#c9a84c]/5
                      transition-all duration-300"
                  />
                  <Button
                    onClick={() => email && setSent(true)}
                    variant="secondary"
                    className="w-full bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e] font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-sm
                      shadow-lg shadow-[#c9a84c]/20 transition-all duration-300"
                  >
                    S'abonner →
                  </Button>
                  <p className="text-white/20 text-[10px] sm:text-[11px] text-center">Pas de spam. Désabonnement en 1 clic.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}