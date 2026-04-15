import { getAll, query } from '@/lib/db';

export interface ImageAnalysisDetail {
  detected: boolean;
  confidence: number;
  reason: string;
}

export interface ImageResult {
  url: string;
  passed: boolean;
  issues: string[];
  details: {
    sexual_content: ImageAnalysisDetail;
    non_property: ImageAnalysisDetail;
    watermark: ImageAnalysisDetail;
  };
}

export interface ModerationResult {
  tourId: number;
  status: 'approved' | 'rejected';
  analyzedAt: string;
  results: ImageResult[];
  failedImages: ImageResult[];
}

// Image URL extensions / patterns to identify images vs video/external media
function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // External video platforms
  if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com/i.test(lower)) {
    return false;
  }
  // Video file extensions
  if (/\.(mp4|mov|webm|avi|mkv)(\?.*)?$/.test(lower)) {
    return false;
  }
  return true;
}

/**
 * Fetches the tour's image media URLs, calls the moderation API,
 * then updates the tour's moderation_status and moderation_result in the DB.
 */
export async function moderateTourImages(tourId: number): Promise<ModerationResult> {
  // Fetch all media for this tour
  const media = await getAll(
    'SELECT media_url, media_type FROM tour_media WHERE tour_id = $1 ORDER BY display_order ASC',
    [tourId]
  );

  // Filter to images only (skip videos and external embeds)
  const imageUrls = media
    .filter((m: { media_url: string; media_type: string }) =>
      m.media_type === 'image' || (m.media_type !== 'video' && isImageUrl(m.media_url))
    )
    .map((m: { media_url: string }) => m.media_url);

  // If no images to moderate, auto-approve
  if (imageUrls.length === 0) {
    await query(
      `UPDATE property_tours SET moderation_status = 'approved', moderation_result = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify({ tourId, status: 'approved', analyzedAt: new Date().toISOString(), results: [], failedImages: [], note: 'Nenhuma imagem para moderar' }), tourId]
    );
    return { tourId, status: 'approved', analyzedAt: new Date().toISOString(), results: [], failedImages: [] };
  }

  // Call the moderation API — use internal fetch with absolute URL if available, else relative
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/moderation/analyze`;

  let results: ImageResult[] = [];

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_urls: imageUrls }),
    });

    if (!response.ok) {
      throw new Error(`Moderation API returned ${response.status}`);
    }

    const data = await response.json();
    results = data.results || [];
  } catch (err) {
    console.error('moderateTourImages: error calling moderation API:', err);
    // On API failure, leave status as pending so it can be retried
    throw err;
  }

  const failedImages = results.filter((r) => !r.passed);
  const allPassed = failedImages.length === 0;
  const status: 'approved' | 'rejected' = allPassed ? 'approved' : 'rejected';

  const moderationResult: ModerationResult = {
    tourId,
    status,
    analyzedAt: new Date().toISOString(),
    results,
    failedImages,
  };

  await query(
    `UPDATE property_tours SET moderation_status = $1, moderation_result = $2, updated_at = NOW() WHERE id = $3`,
    [status, JSON.stringify(moderationResult), tourId]
  );

  return moderationResult;
}
