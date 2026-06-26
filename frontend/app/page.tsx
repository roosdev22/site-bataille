import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import AdSection from "@/components/ads/AdSection";
import ReportageSection from "@/components/sections/ReportageSection";
import BlogSection from "@/components/sections/BlogSection";
import GallerySection from "@/components/sections/GallerySection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      
      {/* Bannière haute - format banner_top */}
      <AdSection format="banner_top" category="all" />
      
      <BlogSection />
      <ReportageSection/>
      <GallerySection />
      
      {/* Bannière basse - format banner_bottom */}
      <AdSection format="banner_bottom" category="all" />
      
      <NewsletterSection />
      <AboutSection />
      <ContactSection />
      <Footer />
      
      {/* Footer collant - format sticky_footer */}
      <AdSection format="sticky_footer" category="all" />
    </main>
  );
}