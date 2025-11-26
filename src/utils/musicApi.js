const ITUNES_API_BASE = 'https://itunes.apple.com/search';
const CACHE_KEY = 'musicRecc_enrichedTracks';
const CACHE_VERSION = 'v5';

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

async function fetchSequentially(tracks) {
  const results = [];
  
  for (const track of tracks) {
    const enriched = await enrichTrackWithPreview(track);
    results.push(enriched);
    
    // Small delay between each request to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Retry any tracks that failed to get previews
  for (let i = 0; i < results.length; i++) {
    if (!results[i].previewUrl) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const retried = await enrichTrackWithPreview(tracks[i]);
      if (retried.previewUrl) {
        results[i] = retried;
      }
    }
  }
  
  return results;
}

export async function enrichTracksWithPreviews(tracks) {
  const cached = getCachedTracks();
  
  // Only use cache if ALL tracks have previews
  if (cached && cached.length === tracks.length) {
    const allHavePreviews = cached.every(t => t.previewUrl);
    if (allHavePreviews) {
      return cached;
    }
  }
  
  const enrichedTracks = await fetchSequentially(tracks);
  
  // Only cache if most tracks have previews (allow some failures)
  const previewCount = enrichedTracks.filter(t => t.previewUrl).length;
  if (previewCount >= tracks.length * 0.9) {
    setCachedTracks(enrichedTracks);
  }
  
  return enrichedTracks;
}

