import { env } from './env';

/**
 * Returns the absolute URL for a file stored in the backend.
 * If the path is already absolute, it returns it as is.
 */
export function getFileUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Clean path to ensure it doesn't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.uploadsBaseUrl}${cleanPath}`;
}

/**
 * Replaces relative markdown image links with absolute ones for display.
 * Example: ![alt](/uploads/foo.jpg) -> ![alt](http://localhost:3001/uploads/foo.jpg)
 */
export function resolveMarkdownImages(content: string | undefined | null): string {
  if (!content) return '';
  return content.replace(/!\[(.*?)\]\((\/uploads\/.*?)\)/g, (match, alt, path) => {
    return `![${alt}](${getFileUrl(path)})`;
  });
}

export function getNewsExcerpt(content: string | undefined | null, maxLength = 180): string {
  if (!content) return '';

  const cleaned = content
    .replace(/\[\[image\s+[^[\]]+\]\]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).trim()}...`;
}
