export function readingTime(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    medical: "#2563eb",
    travel: "#059669",
    technology: "#7c3aed",
    education: "#d97706",
    lifestyle: "#db2777",
    science: "#0891b2",
    legal: "#ea580c",
    finance: "#0d9488",
  };
  return colors[category] || "#1a1a2e";
}