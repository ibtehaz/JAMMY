import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import NowPlaying from '../components/NowPlaying';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PlaylistView() {
  const { id } = useParams();
  const { playlists, playPlaylist, isLoadingPreviews } = useRecommendationEngine();
  
  // Start playlist when page loads
  useEffect(() => {
    if (id) {
      playPlaylist(id);
    }
  }, [id, playPlaylist]);
  
  const playlist = playlists.find(p => p.id === id);

  // Show loading spinner while data is being fetched
  if (isLoadingPreviews || playlists.length === 0) {
    return <LoadingSpinner message="Loading your playlist..." />;
  }

  if (!playlist) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <p className="text-gray-400">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full p-4 pb-4 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{playlist.title}</p>
          <p className="text-[10px] text-gray-500">{playlist.tracks.length} tracks</p>
        </div>
      </div>

      <NowPlaying />
    </div>
  );
}
