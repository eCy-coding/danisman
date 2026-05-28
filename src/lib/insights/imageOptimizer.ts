const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '').trim();
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export interface CloudinaryOpts {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'scale' | 'fit' | 'thumb';
  dpr?: number;
}

function buildTransform(opts: CloudinaryOpts): string {
  const parts: string[] = [];
  if (opts.crop) parts.push(`c_${opts.crop}`);
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  if (opts.quality !== undefined) parts.push(`q_${opts.quality}`);
  if (opts.format !== undefined) parts.push(`f_${opts.format}`);
  if (opts.dpr !== undefined) parts.push(`dpr_${opts.dpr}`);
  return parts.join(',');
}

export function buildCloudinaryUrl(publicId: string, opts: CloudinaryOpts = {}): string {
  const defaults: CloudinaryOpts = { quality: 'auto', format: 'auto' };
  const merged = { ...defaults, ...opts };
  const transform = buildTransform(merged);
  return transform ? `${BASE_URL}/${transform}/${publicId}` : `${BASE_URL}/${publicId}`;
}

export function buildSrcSet(publicId: string, widths: number[]): string {
  if (widths.length === 0) return '';
  return widths
    .map(
      (w) =>
        `${buildCloudinaryUrl(publicId, { width: w, quality: 'auto', format: 'auto', crop: 'scale' })} ${w}w`,
    )
    .join(', ');
}

export const ARTICLE_COVER_WIDTHS = [400, 800, 1200, 1600];
export const THUMBNAIL_WIDTHS = [200, 400, 800];

export function buildArticleCoverSrcSet(publicId: string): string {
  return buildSrcSet(publicId, ARTICLE_COVER_WIDTHS);
}
