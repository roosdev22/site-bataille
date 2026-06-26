// components/sections/AboutSection.tsx
"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import aboutData from "@/data/data.json";

const Icons = {
  User: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1c1c2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ArrowDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10l4 4 4-4"/></svg>,
};

export default function AboutSection() {
  const { name, title, experience, experienceSub, bio, stats, timeline, expertise } = aboutData;

  return (
    <section id="about" className="py-16 sm:py-20 md:py-28 lg:py-32 bg-gradient-to-b from-[#fafaf8] to-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12 md:mb-16 px-2"
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full 
            bg-[#c9a84c]/10 text-[#c9a84c] text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase mb-4 sm:mb-6">
            <Icons.ArrowDown />
            À propos de l'auteur
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1c1c2e] tracking-[-0.5px] sm:tracking-[-1px] mb-3 sm:mb-4">
            {name.split(" ")[0]}{" "}<span className="text-[#c9a84c]">{name.split(" ").slice(1).join(" ")}</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-md mx-auto px-4">{title}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-3 space-y-6 sm:space-y-8"
          >
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#c9a84c] to-[#e0c86e] 
                flex items-center justify-center shrink-0 shadow-xl sm:shadow-2xl shadow-[#c9a84c]/20">
                <div className="scale-75 sm:scale-100"><Icons.User /></div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#1c1c2e]">{experience}</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-0.5 sm:mt-1">{experienceSub}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 text-sm sm:text-[15px] text-gray-600 leading-relaxed">
              {bio.map((paragraph, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: paragraph }} />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 
              bg-gradient-to-r from-gray-50 to-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center py-4 sm:py-6 md:py-8 px-4">
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#c9a84c] tracking-tight">{stat.number}</div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500 mt-1 sm:mt-2 font-semibold uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-2 space-y-6 sm:space-y-8"
          >
            <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#1c1c2e] mb-5 sm:mb-6 md:mb-8 flex items-center gap-2">
                <Icons.Clock />Parcours
              </h3>
              <div className="relative">
                <div className="absolute left-[17px] sm:left-[22px] md:left-[27px] top-2 bottom-2 w-px bg-gray-100" />
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {timeline.map((item, i) => (
                    <motion.div key={item.year}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3 sm:gap-4 md:gap-5 relative">
                      <div className={`w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] md:w-[15px] md:h-[15px] rounded-full border-[3px] sm:border-4 shrink-0 mt-0.5 relative z-10
                        ${i === timeline.length - 1 ? "bg-[#c9a84c] border-[#c9a84c]/20" : "bg-white border-gray-200"}`} />
                      <div className="min-w-0">
                        <span className="text-[#c9a84c] font-bold text-[10px] sm:text-[11px] md:text-xs tracking-wider">{item.year}</span>
                        <h4 className="font-semibold text-[#1c1c2e] text-[11px] sm:text-xs md:text-sm mt-0.5 leading-snug">{item.title}</h4>
                        <p className="text-gray-500 text-[10px] sm:text-[11px] md:text-xs mt-0.5 sm:mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1c1c2e] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white">
              <h3 className="text-[11px] sm:text-xs md:text-sm font-bold text-[#c9a84c] mb-3 sm:mb-4 md:mb-5 tracking-wider uppercase">Expertise</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {expertise.map((tag) => (
                  <span key={tag} className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] md:text-xs font-semibold
                    bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300 cursor-default">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}