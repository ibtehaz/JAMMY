import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, X, ThumbsDown, Info, ChevronUp, ListMusic } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function ReasoningPill({ confidence, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 transition-colors"
    >
      <div className={`w-2 h-2 rounded-full ${confidence >= 0.7 ? 'bg-green-400' : confidence >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'}`} />
      <span className="text-xs font-semibold text-white">{Math.round(confidence * 100)}% Match</span>
      <Info className="w-3.5 h-3.5 text-gray-500" />
    </motion.button>
  );
}

function QueueDrawer({ isOpen, onClose, playlist, currentIndex, onPlayTrack }) {
  // Get upcoming tracks with original indices
  const allTracks = playlist?.tracks || [];
  const upcomingTracks = allTracks
    .map((t, i) => ({ ...t, originalIndex: i }))
    .slice(currentIndex + 1, currentIndex + 6);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 rounded-3xl"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 glass rounded-t-3xl z-30 overflow-hidden"
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2">
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-gray-400" />
                Up Next
              </h3>
              <span className="text-[10px] text-gray-500">{upcomingTracks.length} tracks</span>
            </div>
            
            {/* Track list */}
            <div className="px-4 pb-6 space-y-1 max-h-[50vh] overflow-y-auto scrollbar-hide">
              {upcomingTracks.length > 0 ? (
                upcomingTracks.map((track, i) => (
                  <button 
                    key={track.id} 
                    onClick={() => {
                      if (typeof onPlayTrack === 'function') {
                        onPlayTrack(track.originalIndex);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 w-full text-left transition-colors group"
                  >
                    <span className="text-gray-600 w-5 text-center text-xs font-medium">{i + 1}</span>
                    <div className="w-11 h-11 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                      {track.artworkUrl100 ? (
                        <img src={track.artworkUrl100} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg opacity-30">🎵</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm text-white">{track.title}</p>
                      <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      track.confidence >= 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {Math.round(track.confidence * 100)}%
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">End of playlist</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ReasoningPanel({ track, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
          >
            <div className="glass rounded-2xl p-5 w-full shadow-2xl pointer-events-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Why This Song?</h3>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </motion.button>
              </div>
              
              <div className="mb-4">
                <p className="font-semibold text-sm">{track.title}</p>
                <p className="text-xs text-gray-400">{track.artist}</p>
              </div>

              <div className="space-y-2">
                {track.reasoning && track.reasoning.length > 0 ? (
                  track.reasoning.map((reason, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-gray-300 text-sm leading-relaxed">{reason}</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No specific reasoning available</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ContextModal({ isOpen, onClose, onSubmit }) {
  const [selectedContext, setSelectedContext] = useState(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center z-[51] pointer-events-none p-4"
          >
            <div className="glass rounded-2xl p-5 w-full shadow-2xl pointer-events-auto">
              <h3 className="text-lg font-bold mb-1">Why do you like this?</h3>
              <p className="text-xs text-gray-400 mb-4">Help us recommend better music.</p>

              <div className="space-y-2 mb-4">
                {["Great for workouts", "Good focus music", "Chill/relaxing vibes", "Just love this song"].map((ctx, i) => (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={ctx}
                    onClick={() => setSelectedContext(ctx)}
                    className={`w-full text-left p-3 rounded-xl transition-all text-sm font-medium border ${
                      selectedContext === ctx
                        ? 'bg-white border-transparent text-black'
                        : 'bg-white/5 border-white/5 text-gray-300'
                    }`}
                  >
                    {ctx}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-gray-400 rounded-xl text-sm font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    onSubmit(selectedContext);
                    setSelectedContext(null);
                  }}
                  disabled={!selectedContext}
                  className="flex-1 py-2.5 bg-white text-black disabled:opacity-50 rounded-xl text-sm font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function NowPlaying() {
  const { playlists, currentPlaylistId, currentTrackIndex, likeSong, dislikeSong, skipSong, playPreviousSong, playTrackAtIndex } = useRecommendationEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
  const currentTrack = currentPlaylist?.tracks[currentTrackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) return;

    // Set new track
    audio.src = currentTrack.previewUrl;
    audio.load();
    
    // Auto-play on track change
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(true);
    }
    
    setCurrentTime(0);
    setDuration(0);

    // Event handlers
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next track (without logging as skip)
      const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
      if (currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1) {
        playTrackAtIndex(currentTrackIndex + 1);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack?.id, currentPlaylistId, currentTrackIndex, playlists, playTrackAtIndex]);

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current || !currentTrack?.previewUrl) {
      toast.error("No preview available for this track");
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Playback error:", error);
      toast.error("Failed to play audio");
    }
  };

  if (!currentTrack) return null;

  const handleLike = () => {
    setShowContextModal(true);
  };

  const handleContextSubmit = (context) => {
    likeSong(currentTrack.id, context);
    toast.success("Added to your likes", {
      description: context ? `We'll play more music for "${context}"` : "We'll play more music like this"
    });
    setShowContextModal(false);
  };

  const handleSkip = () => {
    skipSong(currentTrack.id);
    toast("Skipped", {
      description: "We'll play different songs",
      icon: <SkipForward className="w-5 h-5 text-gray-400" />,
    });
  };

  const handleDislike = () => {
    dislikeSong(currentTrack.id);
    toast("Disliked", {
      description: "We'll show fewer songs like this",
      icon: <ThumbsDown className="w-5 h-5 text-red-400" />
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center"
    >
      {/* Album Art */}
      <motion.div 
        className="w-full aspect-square max-w-[240px] bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-2xl shadow-2xl mb-5 relative overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {currentTrack.artworkUrl && (
          <img 
            src={currentTrack.artworkUrl} 
            alt={`${currentTrack.title} album art`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Fallback - only visible if no artwork */}
        {!currentTrack.artworkUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl opacity-30">🎵</div>
          </div>
        )}
      </motion.div>

      {/* Track Info */}
      <div className="text-center mb-3 w-full px-2">
        <motion.h2 
          key={currentTrack.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-white truncate"
        >
          {currentTrack.title}
        </motion.h2>
        <motion.p 
          key={currentTrack.artist}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-400 truncate"
        >
          {currentTrack.artist} • {currentTrack.album}
        </motion.p>
        {!currentTrack.previewUrl && (
          <p className="text-xs text-yellow-500 mt-1">Preview not available</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-3 px-2">
        <div className="relative h-1 bg-white/10 rounded-full">
          <div 
            className="absolute top-0 left-0 h-full bg-white rounded-full pointer-events-none"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              setCurrentTime(newTime);
              if (audioRef.current) {
                audioRef.current.currentTime = newTime;
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{duration ? formatTime(duration) : "0:30"}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-5 mb-3 w-full">
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={handleDislike}
          className="p-3 text-gray-400 hover:text-red-500 transition-colors"
        >
          <ThumbsDown className="w-5 h-5" />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={playPreviousSong}
          className="p-3 text-gray-400 hover:text-white transition-colors"
        >
          <SkipBack className="w-7 h-7" />
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (!currentTrack.previewUrl) {
              toast.error("No preview available for this track");
              return;
            }
            togglePlayPause();
          }}
          className={`p-4 bg-white text-black rounded-full shadow-lg ${!currentTrack.previewUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleSkip}
          className="p-3 text-gray-400 hover:text-white transition-colors"
        >
          <SkipForward className="w-7 h-7" />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={handleLike}
          className="p-3 text-gray-400 hover:text-green-400 transition-colors"
        >
          <Heart className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <ReasoningPill 
          confidence={currentTrack.confidence}
          onClick={() => setShowReasoning(true)}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsQueueOpen(true)}
          className="bg-white/5 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-xs text-gray-300"
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>Queue</span>
        </motion.button>
      </div>

      {/* Modals */}
      <ReasoningPanel 
        track={currentTrack}
        isOpen={showReasoning}
        onClose={() => setShowReasoning(false)}
      />
      
      <ContextModal
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        onSubmit={handleContextSubmit}
      />

      <QueueDrawer 
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        playlist={currentPlaylist}
        currentIndex={currentTrackIndex}
        onPlayTrack={playTrackAtIndex}
      />

      {/* Hidden Audio Element */}
      <audio ref={audioRef} />
    </motion.div>
  );
}
