// Previews are embedded in tracks.json (fetched at build time)

export async function enrichTracksWithPreviews(tracks) {
  return tracks.map(track => ({
    ...track,
    hasRealPreview: !!track.previewUrl
  }));
}

