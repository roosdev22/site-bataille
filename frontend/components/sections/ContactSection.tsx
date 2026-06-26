// components/sections/ContactSection.tsx
"use client";

import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { supabase } from '@/lib/supabase';
import { EMAILJS_CONFIG } from '@/lib/emailjs';
import Container from "@/components/ui/Container";
import { SITE_CONFIG } from "@/utils/constants";

// Icônes SVG
const Icons = {
  Success: () => <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Error: () => <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  Spinner: () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
  Mail: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  MapPin: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Quote: () => <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#c9a84c]/40" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>,
  ArrowRight: () => <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  MessageCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
};

export default function ContactSection() {
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    const formData = new FormData(form.current!);
    const contactData = {
      name: formData.get('from_name') as string,
      email: formData.get('reply_to') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      source: 'email',
    };

    try {
      // 1. Sauvegarder dans Supabase
      const { error: dbError } = await supabase.from('contacts').insert([contactData]);
      if (dbError) throw dbError;

      // 2. Envoyer email via EmailJS
      await emailjs.sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        form.current!,
        EMAILJS_CONFIG.publicKey
      );

      setStatus('success');
      form.current?.reset();
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error('Erreur:', error);
      setStatus('error');
      setErrorMessage("Erreur lors de l'envoi. Veuillez réessayer.");
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 md:py-28 lg:py-32 bg-white">
      <Container>
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 px-2">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full 
            bg-[#c9a84c]/10 text-[#c9a84c] text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase mb-4 sm:mb-6">
            <Icons.Send />
            Contact
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1c1c2e] tracking-[-0.5px] sm:tracking-[-1px] mb-3 sm:mb-4">
            Échangeons <span className="text-[#c9a84c]">ensemble</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-lg mx-auto px-4">
            Une question, une collaboration, ou simplement pour dire bonjour ?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-12 max-w-6xl mx-auto">
          
          {/* Formulaire */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-lg sm:shadow-xl shadow-gray-100/50">
              
              {status === 'success' ? (
                <div className="text-center py-10 sm:py-16">
                  <Icons.Success />
                  <h3 className="text-lg sm:text-xl font-bold text-[#1c1c2e] mb-2">Message envoyé !</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Nous vous répondrons dans les 48 heures.</p>
                  <button onClick={() => setStatus('idle')} className="bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-xl px-5 sm:px-6 py-2.5 text-sm font-semibold transition-colors">
                    Nouveau message
                  </button>
                </div>
              ) : status === 'error' ? (
                <div className="text-center py-10 sm:py-16">
                  <Icons.Error />
                  <h3 className="text-lg sm:text-xl font-bold text-[#1c1c2e] mb-2">Échec d'envoi</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">{errorMessage || "Veuillez réessayer."}</p>
                  <button onClick={() => setStatus('idle')} className="bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-xl px-5 sm:px-6 py-2.5 text-sm font-semibold transition-colors">
                    Réessayer
                  </button>
                </div>
              ) : (
                <form ref={form} onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Nom complet *</label>
                      <input type="text" name="from_name" placeholder="Jean Dupont" required
                        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl text-sm
                          outline-none focus:border-[#c9a84c]/40 focus:bg-white focus:ring-4 focus:ring-[#c9a84c]/5 transition-all duration-300 placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Email *</label>
                      <input type="email" name="reply_to" placeholder="jean@exemple.com" required
                        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl text-sm
                          outline-none focus:border-[#c9a84c]/40 focus:bg-white focus:ring-4 focus:ring-[#c9a84c]/5 transition-all duration-300 placeholder:text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Sujet *</label>
                    <input type="text" name="subject" placeholder="De quoi s'agit-il ?" required
                      className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl text-sm
                        outline-none focus:border-[#c9a84c]/40 focus:bg-white focus:ring-4 focus:ring-[#c9a84c]/5 transition-all duration-300 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Message *</label>
                    <textarea name="message" rows={5} placeholder="Votre message..." required
                      className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl text-sm
                        outline-none resize-none focus:border-[#c9a84c]/40 focus:bg-white focus:ring-4 focus:ring-[#c9a84c]/5 transition-all duration-300 placeholder:text-gray-400" />
                  </div>
                  
                  <button type="submit" disabled={status === 'sending'}
                    className="group relative w-full flex items-center justify-center gap-2 sm:gap-3 
                      bg-gradient-to-r from-[#1c1c2e] to-[#2a2a3e] hover:from-[#2a2a3e] hover:to-[#3a3a5e]
                      text-white font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl text-sm sm:text-[15px] 
                      transition-all duration-500 ease-out disabled:opacity-50 disabled:cursor-not-allowed
                      shadow-xl sm:shadow-2xl shadow-[#1c1c2e]/20 hover:shadow-[#1c1c2e]/30
                      hover:scale-[1.01] sm:hover:scale-[1.02] active:scale-[0.98] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/0 via-[#c9a84c]/10 to-[#c9a84c]/0 
                      translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    {status === 'sending' ? (
                      <><Icons.Spinner /><span className="relative text-xs sm:text-sm">Envoi en cours...</span></>
                    ) : (
                      <>
                        <span className="relative flex items-center gap-2">
                          <Icons.Send />
                          <span>Envoyer le message</span>
                        </span>
                        <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                          <Icons.ArrowRight />
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Infos */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6 md:space-y-8 order-1 lg:order-2">
            <div className="bg-gradient-to-br from-[#1c1c2e] to-[#2a2a3e] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 text-white shadow-lg sm:shadow-xl shadow-[#1c1c2e]/10">
              <h3 className="text-xs sm:text-sm font-bold text-[#c9a84c] mb-4 sm:mb-6 tracking-wider uppercase">Coordonnées</h3>
              <div className="space-y-4 sm:space-y-6">
                <a href={`mailto:${SITE_CONFIG.email}`} className="flex items-center gap-3 sm:gap-4 text-white/70 hover:text-[#c9a84c] transition-colors group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center
                    group-hover:bg-[#c9a84c]/10 group-hover:border-[#c9a84c]/30 transition-all duration-300 shrink-0">
                    <Icons.Mail />
                  </div>
                  <span className="text-xs sm:text-sm font-medium break-all">{SITE_CONFIG.email}</span>
                </a>
                <div className="flex items-center gap-3 sm:gap-4 text-white/70">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icons.MapPin />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{SITE_CONFIG.location}</span>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-[#c9a84c]/5 to-[#c9a84c]/10 border border-[#c9a84c]/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8">
              <Icons.Quote />
              <p className="text-sm sm:text-[15px] text-[#1c1c2e] font-medium leading-relaxed mt-3 sm:mt-4">
                "Toujours disponible pour échanger sur vos projets."
              </p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-3">— L'équipe Site Bataille</p>
              <div className="mt-5 pt-5 border-t border-[#c9a84c]/10">
                <p className="text-xs text-gray-500 mb-3">Ou directement</p>
                <a href="https://wa.me/+17862345678" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#25D366] hover:text-[#1ebe5d] font-semibold text-sm transition-colors">
                  <Icons.MessageCircle /> Par WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}