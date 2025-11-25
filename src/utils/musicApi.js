// iTunes Search API for 30-second previews and album artwork

const ITUNES_API_BASE = 'https://itunes.apple.com/search';

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
    console.error(`Failed to fetch preview for "${trackName}" by ${artistName}:`, error);
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

export async function enrichTracksWithPreviews(tracks, delayMs = 100) {
  const enrichedTracks = [];
  
  for (const track of tracks) {
    const enriched = await enrichTrackWithPreview(track);
    enrichedTracks.push(enriched);
    
    if (delayMs > 0 && enrichedTracks.length < tracks.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return enrichedTracks;
}

