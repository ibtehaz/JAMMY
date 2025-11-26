const ITUNES_API_BASE = 'https://itunes.apple.com/search';
const CACHE_KEY = 'musicRecc_enrichedTracks';
const CACHE_VERSION = 'v3';

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
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl100?.replace('100x100', '600x600') || track.artworkUrl100,
        artworkUrl100: track.artworkUrl100,
        releaseDate: track.releaseDate,
        trackViewUrl: track.trackViewUrl,
        collectionName: track.collectionName,
        primaryGenreName: track.primaryGenreName
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

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

function getCachedTracks() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { version, data, timestamp } = JSON.parse(cached);
    
    const maxAge = 24 * 60 * 60 * 1000;
    if (version !== CACHE_VERSION || Date.now() - timestamp > maxAge) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (e) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedTracks(tracks) {
  try {
    const cacheData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data: tracks
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    // Cache write failed, continue without caching
  }
}

async function fetchInBatches(tracks, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(track => enrichTrackWithPreview(track))
    );
    results.push(...batchResults);
  }
  
  return results;
}

export async function enrichTracksWithPreviews(tracks) {
  const cached = getCachedTracks();
  if (cached && cached.length === tracks.length) {
    return cached;
  }
  
  const enrichedTracks = await fetchInBatches(tracks, 5);
  setCachedTracks(enrichedTracks);
  
  return enrichedTracks;
}

