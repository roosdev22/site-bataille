// components/sections/Hero.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const Icons = {
  Send: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  ArrowRight: () => <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
};

export default function Hero() {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[85vh] md:min-h-[90vh] bg-gradient-to-br from-[#0a0a16] via-[#13132b] to-[#0f1a2e] 
      flex items-center justify-center text-center overflow-hidden px-4">
      
      {/* Effets lumineux animés */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-48 sm:w-56 md:w-72 h-48 sm:h-56 md:h-72 rounded-full bg-[#c9a84c]/15 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 left-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 rounded-full bg-blue-400/10 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 1.3, 1.1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 right-1/3 w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full bg-emerald-400/8 blur-3xl"
      />

      {/* Grille subtile */}
      <div className="absolute inset-0 opacity-[0.02] hidden sm:block"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      
      />

      <div className="relative z-10 max-w-4xl w-full px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-sm border border-white/10 
              px-4 sm:px-5 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-8 md:mb-10"
          >
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-[#c9a84c]" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[#c9a84c] tracking-[0.15em] uppercase">
              Santé & Voyages
            </span>
          </motion.div>

          {/* Titre */}
          <h1 className="text-[1.75rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] font-extrabold text-white 
            leading-[1.08] tracking-[-0.3px] sm:tracking-[-0.5px] mb-4 sm:mb-6 px-2">
            Explorer la{' '}
            <span className="bg-gradient-to-r from-[#c9a84c] via-[#d4b55e] to-[#e0c86e] bg-clip-text text-transparent">
              santé
            </span>
            {' '}et le{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              monde
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-sm sm:text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-6 sm:mb-8 md:mb-10 px-2">
            Des articles de fond sur la médecine, le bien-être et les voyages.
            Rédigés par des professionnels pour les esprits curieux.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link href="#articles" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group w-full sm:w-auto bg-[#c9a84c] text-[#1c1c2e] font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl
                  shadow-xl sm:shadow-2xl shadow-[#c9a84c]/25 hover:shadow-[#c9a84c]/40
                  transition-all duration-300 text-xs sm:text-sm tracking-wide uppercase inline-flex items-center justify-center gap-2"
              >
                <Icons.Send />
                Découvrir les articles
                <Icons.ArrowRight />
              </motion.button>
            </Link>
            <Link href="#about" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto border-2 border-white/15 text-white hover:bg-white/5 hover:border-white/25
                  font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 text-xs sm:text-sm tracking-wide uppercase"
              >
                En savoir plus
              </motion.button>
            </Link>
          </div>

          {/* Indicateur de scroll */}
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-12 sm:mt-16 md:mt-20"
          >
            <div className="w-7 sm:w-8 h-10 sm:h-14 border-2 border-white/15 rounded-full mx-auto relative flex items-start justify-center pt-2.5 sm:pt-3">
              <motion.div 
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-1 sm:w-1.5 h-2.5 sm:h-3 bg-[#c9a84c]/60 rounded-full"
              />
            </div>
            <p className="text-white/20 text-[9px] sm:text-[10px] mt-2 sm:mt-3 font-medium tracking-wider uppercase">
              Défiler
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}