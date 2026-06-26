/**
 * lib/image-utils.ts
 * Centralise la logique de gestion des URLs d'images
 */

/**
 * Normalise une URL d'image en ajoutant le domaine API si nécessaire
 * @param src - URL ou chemin relatif
 * @param fallback - Image de secours (défaut: /placeholder.jpg)
 * @returns URL complète de l'image
 */
export function getImageUrl(
  src: string | null | undefined,
  fallback: string = '/placeholder.jpg'
): string {
  if (!src) return fallback;

  // Si c'est déjà une URL complète (http/https)
  if (src.startsWith('http')) {
    return src;
  }

  // Si c'est un chemin relatif, ajoute le domaine API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const path = src.startsWith('/') ? src : '/' + src;
  return `${apiUrl}${path}`;
}

/**
 * Prépare les props pour un composant Image de Next.js
 */
export interface ImageProps {
  src?: string | null;
  alt: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  objectPosition?: string;
}

export function prepareImageProps(props: ImageProps) {
  return {
    ...props,
    src: getImageUrl(props.src),
  };
}