const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
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
