import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Pause } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';

function MiniPlayer() {
  const navigate = useNavigate();
  const { playlists, currentPlaylistId, likedTrackIds, isPlaying, togglePlayPause, currentTrack } = useRecommendationEngine();

  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);

  // Don't render if no track is playing
  if (!currentPlaylistId || !currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const artworkUrl = currentTrack.artworkUrl100 || currentTrack.artworkUrl;

  const handleClick = () => {
    navigate(`/playlist/${currentPlaylistId}`);
  };

  // Portal to phone-screen so it stays fixed at bottom
  const phoneScreen = typeof document !== 'undefined' ? document.getElementById('phone-screen') : null;

  const miniPlayerContent = (
    <AnimatePresence>
      <motion.div
        key="mini-player"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        onClick={handleClick}
        className="absolute bottom-[44px] left-3 right-3 z-30 cursor-pointer"
      >
        <div 
          className="bg-[#1a1a1f]/95 rounded-2xl p-2.5 flex items-center gap-3 border border-white/10 shadow-2xl"
          style={{ 
            backdropFilter: "blur(24px)", 
            WebkitBackdropFilter: "blur(24px)",
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)"
          }}
        >
          {/* Album Art */}
          <motion.div 
            layoutId="album-art"
            className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gray-800 shadow-lg"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            {artworkUrl ? (
              <img 
                src={artworkUrl} 
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                <span className="text-lg opacity-40">🎵</span>
              </div>
            )}
          </motion.div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-[13px] text-white truncate">
                {currentTrack.title}
              </p>
              {isLiked && (
                <Heart className="w-3 h-3 text-green-400 fill-green-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              {currentTrack.artist} • {currentPlaylist?.title}
            </p>
          </div>

          {/* Play/Pause Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-black fill-current" />
            ) : (
              <Play className="w-4 h-4 text-black fill-current ml-0.5" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  // Use portal to render at phone-screen level (above scroll container)
  if (phoneScreen) {
    return createPortal(miniPlayerContent, phoneScreen);
  }

  return miniPlayerContent;
}

export default memo(MiniPlayer);
