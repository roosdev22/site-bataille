// components/sections/GallerySection.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";

const Icons = {
  Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  X: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Camera: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
};

const galleryImages = [
  { id: 1, src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600", title: "Hôpital moderne", category: "Médical" },
  { id: 2, src: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600", title: "Randonnée en montagne", category: "Voyage" },
  { id: 3, src: "https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=600", title: "Recherche médicale", category: "Médical" },
  { id: 4, src: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600", title: "Paradis tropical", category: "Voyage" },
  { id: 5, src: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=600", title: "Bloc opératoire", category: "Médical" },
  { id: 6, src: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600", title: "Safari désert", category: "Voyage" },
  { id: 7, src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600", title: "Laboratoire", category: "Médical" },
  { id: 8, src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600", title: "Évasion tropicale", category: "Voyage" },
];

export default function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);

  return (
    <section id="gallery" className="py-24 md:py-32 bg-gradient-to-b from-white to-[#fafaf8]">
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
            bg-[#c9a84c]/10 text-[#c9a84c] text-[11px] font-bold tracking-[0.15em] uppercase mb-6">
            <Icons.Camera />
            Galerie
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#1c1c2e] tracking-[-1px] mb-4">
            Nos plus <span className="text-[#c9a84c]">belles</span> photos
          </h2>
          <p className="text-gray-500 text-lg max-w-lg mx-auto">
            Un aperçu de nos reportages à travers le monde
          </p>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryImages.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
              viewport={{ once: true }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
              onClick={() => setSelectedImage(img)}
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c2e]/80 via-[#1c1c2e]/20 to-transparent 
                opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 
                  flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform duration-300">
                  <Icons.Eye />
                </div>
              </div>

              {/* Légende */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent
                translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-sm font-bold">{img.title}</p>
                <p className={`text-xs font-medium mt-0.5 ${
                  img.category === "Médical" ? "text-[#c9a84c]" : "text-blue-400"
                }`}>{img.category}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0a0a16]/98 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl"
                />
                
                {/* Infos */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                  <p className="text-white text-lg font-bold">{selectedImage.title}</p>
                  <p className="text-[#c9a84c] text-sm font-medium mt-1">{selectedImage.category}</p>
                </div>

                {/* Bouton fermer */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-14 right-0 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20
                    flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
                >
                  <Icons.X />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
}