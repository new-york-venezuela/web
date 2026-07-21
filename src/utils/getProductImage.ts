import type { ImageMetadata } from 'astro';

// Vite glob import for all product images
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/productos/*.png',
  { eager: true }
);

export function getProductImage(slug: string): ImageMetadata | null {
  const imagePath = `/src/assets/productos/${slug}.png`;
  const image = images[imagePath];
  return image?.default || null;
}
