'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getImageUrl } from '@/lib/image-utils';

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  objectPosition?: string;
  fallback?: string;
  sizes?: string;
  onError?: () => void;
}

/**
 * Composant OptimizedImage
 * Wrapper de Next.js Image avec:
 * - Normalisation des URLs
 * - Gestion d'erreurs
 * - Fallback automatique
 * - Loading states
 */
export function OptimizedImage({
  src,
  alt,
  priority = false,
  fill = false,
  width,
  height,
  className = '',
  objectFit = 'cover',
  objectPosition = 'center',
  fallback = '/placeholder.jpg',
  sizes,
  onError,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  const imageSrc = getImageUrl(src, fallback);

  // État d'erreur: affiche le fallback
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{
          ...(fill ? { position: 'absolute', inset: 0 } : {}),
          ...(width && height && !fill ? { width: `${width}px`, height: `${height}px` } : {}),
        }}
      >
        <span className="text-xs font-medium">Image non disponible</span>
      </div>
    );
  }

  const handleError = () => {
    console.warn(`[OptimizedImage] Erreur: ${imageSrc}`);
    setHasError(true);
    onError?.();
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      priority={priority}
      fill={fill}
      width={width}
      height={height}
      className={className}
      style={
        fill
          ? {
              objectFit: objectFit as any,
              objectPosition: objectPosition as any,
            }
          : undefined
      }
      onError={handleError}
      sizes={sizes}
      unoptimized={process.env.NODE_ENV === 'development'}
    />
  );
}