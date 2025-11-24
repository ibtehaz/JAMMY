import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import NowPlaying from '../components/NowPlaying';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PlaylistView() {
  const { id } = useParams();
  const { playlists, playPlaylist, isLoadingPreviews } = useRecommendationEngine();
  
  // Auto-play playlist on mount - MUST be before any conditional returns
  useEffect(() => {
    if (id) {
      playPlaylist(id);
    }
  }, [id]); // Remove playPlaylist from deps to prevent infinite loop
  
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
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{playlist.title}</h1>
        <p className="text-gray-400">{playlist.description}</p>
        <p className="text-sm text-gray-500 mt-2">
          {playlist.tracks.length} tracks • {Math.round(playlist.confidence * 100)}% confident match
        </p>
      </div>

      <NowPlaying />
    </div>
  );
}
