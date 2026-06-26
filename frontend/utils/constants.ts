import { Category } from "@/types";

export const CATEGORIES: Category[] = [
  { value: "all", label: "All", icon: "◆", color: "#1a1a2e" },
  { value: "medical", label: "Medical", icon: "🏥", color: "#2563eb" },
  { value: "travel", label: "Travel", icon: "✈️", color: "#059669" },
  { value: "technology", label: "Technology", icon: "💻", color: "#7c3aed" },
  { value: "education", label: "Education", icon: "📚", color: "#d97706" },
  { value: "lifestyle", label: "Lifestyle", icon: "✨", color: "#db2777" },
  { value: "science", label: "Science", icon: "🔬", color: "#0891b2" },
  { value: "legal", label: "Legal", icon: "⚖️", color: "#ea580c" },
  { value: "finance", label: "Finance", icon: "💰", color: "#0d9488" },
];

export const SITE_CONFIG = {
  name: "Bataille Blog",
  tagline: "Medical & Travel Insights",
  email: "contact@batailleblog.com",
  location: "Paris, France",
  socials: [
    { name: "Instagram", icon: "📷", url: "#", color: "#e4405f" },
    { name: "Twitter", icon: "𝕏", url: "#", color: "#000" },
    { name: "LinkedIn", icon: "in", url: "#", color: "#0077b5" },
    { name: "Facebook", icon: "f", url: "#", color: "#1877f2" },
  ],
};

export const API = process.env.NEXT_PUBLIC_API_URL;
export const PAGE_SIZE = 9;