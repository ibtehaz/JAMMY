/**
 * Music API utility for fetching real track data from iTunes Search API
 * Provides 30-second audio previews and high-res album artwork
 */

const ITUNES_API_BASE = 'https://itunes.apple.com/search';

/**
 * Search iTunes for a track and return preview data
 * @param {string} trackName - The track title
 * @param {string} artistName - The artist name
 * @returns {Promise<Object|null>} Track data with previewUrl and artworkUrl, or null if not found
 */
export async function fetchTrackPreview(trackName, artistName) {
  try {
    const query = encodeURIComponent(`${trackName} ${artistName}`);
    const url = `${ITUNES_API_BASE}?term=${query}&media=music&entity=song&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const track = data.results[0];
      return {
        previewUrl: track.previewUrl, // 30-second preview
        artworkUrl: track.artworkUrl100?.replace('100x100', '600x600') || track.artworkUrl100, // High-res artwork
        artworkUrl100: track.artworkUrl100, // Thumbnail
        releaseDate: track.releaseDate,
        trackViewUrl: track.trackViewUrl, // Link to iTunes
        collectionName: track.collectionName,
        primaryGenreName: track.primaryGenreName
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch preview for "${trackName}" by ${artistName}:`, error);
    return null;
  }
}

/**
 * Enrich a track object with real preview data
 * @param {Object} track - The track object from tracks.json
 * @returns {Promise<Object>} Track with additional preview data
 */
export async function enrichTrackWithPreview(track) {
  const previewData = await fetchTrackPreview(track.title, track.artist);
  
  return {
    ...track,
    previewUrl: previewData?.previewUrl || null,
    artworkUrl: previewData?.artworkUrl || null,
    artworkUrl100: previewData?.artworkUrl100 || null,
    trackViewUrl: previewData?.trackViewUrl || null,
    hasRealPreview: !!previewData?.previewUrl
  };
}

/**
 * Batch enrich multiple tracks with preview data
 * @param {Array<Object>} tracks - Array of track objects
 * @param {number} delayMs - Delay between requests to avoid rate limiting (default 100ms)
 * @returns {Promise<Array<Object>>} Enriched tracks
 */
export async function enrichTracksWithPreviews(tracks, delayMs = 100) {
  const enrichedTracks = [];
  
  for (const track of tracks) {
    const enriched = await enrichTrackWithPreview(track);
    enrichedTracks.push(enriched);
    
    // Small delay to avoid rate limiting
    if (delayMs > 0 && enrichedTracks.length < tracks.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return enrichedTracks;
}

/**
 * Check if a preview URL is still valid
 * @param {string} previewUrl - The preview URL to check
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
export async function isPreviewValid(previewUrl) {
  if (!previewUrl) return false;
  
  try {
    const response = await fetch(previewUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
