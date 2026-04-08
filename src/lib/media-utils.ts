const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

const EXTERNAL_VIDEO_PATTERNS = [
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i,
  /tiktok\.com/i,
  /instagram\.com\/(?:reel|p)\//i,
  /vimeo\.com\/\d+/i,
];

export function isExternalVideoUrl(url: string): boolean {
  if (!url) return false;
  return EXTERNAL_VIDEO_PATTERNS.some((pattern) => pattern.test(url));
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (isExternalVideoUrl(url)) return true;
  const ext = url.split('.').pop()?.toLowerCase()?.split('?')[0] || '';
  return VIDEO_EXTENSIONS.includes(ext);
}

export function getMediaType(url: string): 'image' | 'video' {
  return isVideoUrl(url) ? 'video' : 'image';
}

export function resolveMediaUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  if (filename.startsWith('/')) return filename;
  return `/uploads/${filename}`;
}

/**
 * Converts a platform video URL to an embeddable URL.
 * Returns null if the URL cannot be converted.
 */
export function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
  const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?.*v=)([\w-]+)/i);
  if (ytWatchMatch) return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;

  const ytShortMatch = url.match(/youtu\.be\/([\w-]+)/i);
  if (ytShortMatch) return `https://www.youtube.com/embed/${ytShortMatch[1]}`;

  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/i);
  if (ytShortsMatch) return `https://www.youtube.com/embed/${ytShortsMatch[1]}`;

  const ytEmbedMatch = url.match(/youtube\.com\/embed\/([\w-]+)/i);
  if (ytEmbedMatch) return `https://www.youtube.com/embed/${ytEmbedMatch[1]}`;

  // Vimeo: vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // TikTok: keep original URL (embedding is unreliable)
  if (/tiktok\.com/i.test(url)) return url;

  // Instagram: keep original URL (embedding is unreliable)
  if (/instagram\.com/i.test(url)) return url;

  return null;
}

/**
 * Returns a human-readable platform name for an external video URL.
 */
export function getVideoPlatformName(url: string): string | null {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/i.test(url)) return 'YouTube Video';
  if (/tiktok\.com/i.test(url)) return 'TikTok Video';
  if (/instagram\.com/i.test(url)) return 'Instagram Video';
  if (/vimeo\.com/i.test(url)) return 'Vimeo Video';
  return null;
}

/**
 * Returns true if the URL is from YouTube or Vimeo (platforms that support reliable iframe embedding).
 */
export function isEmbeddableVideo(url: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(url);
}

/**
 * Validates that a URL is from a supported video platform.
 */
export function isSupportedVideoUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
  } catch {
    return false;
  }
  return EXTERNAL_VIDEO_PATTERNS.some((pattern) => pattern.test(url));
}
