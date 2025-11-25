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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full max-w-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center justify-between group transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${confidence >= 0.7 ? 'bg-green-400' : confidence >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
          Playing because: <span className="font-bold text-white">{Math.round(confidence * 100)}% Match</span>
        </span>
      </div>
      <Info className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
    </motion.button>
  );
}

function QueueDrawer({ isOpen, onClose, playlist, currentIndex, onPlayTrack }) {
  
  // Safely get tracks and map them with their original indices
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
            className="absolute inset-x-0 bottom-0 bg-gray-900 border-t border-white/10 rounded-t-3xl p-6 z-30 max-h-[70%] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-purple-400" />
              Up Next
            </h3>
            
            <div className="space-y-2">
              {upcomingTracks.length > 0 ? (
                upcomingTracks.map((track, i) => (
                  <button 
                    key={track.id} 
                    onClick={() => {
                      if (typeof onPlayTrack === 'function') {
                        onPlayTrack(track.originalIndex);
                        onClose();
                      } else {
                        console.error('onPlayTrack is not a function!', onPlayTrack);
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 w-full text-left hover:bg-white/10 transition-colors"
                  >
                    <span className="text-gray-500 w-4 text-center text-sm">{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                      {track.artworkUrl100 && <img src={track.artworkUrl100} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                      track.confidence >= 0.7 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {Math.round(track.confidence * 100)}%
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">End of playlist</p>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full m-4 shadow-2xl pointer-events-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Why This Song?</h3>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="font-bold text-lg">{track.title}</p>
                <p className="text-gray-400">{track.artist}</p>
              </div>

              <div className="space-y-3">
                {track.reasoning && track.reasoning.length > 0 ? (
                  track.reasoning.map((reason, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
                    >
                      <Info className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                      <span className="text-gray-200 leading-relaxed">{reason}</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-400">No specific reasoning available</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ContextModal({ track, isOpen, onClose, onSubmit }) {
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-0 flex items-center justify-center z-[51] pointer-events-none"
          >
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full m-4 shadow-2xl pointer-events-auto">
              <h3 className="text-2xl font-bold mb-2">Why do you like this?</h3>
              <p className="text-gray-400 mb-6">Help us recommend better music for this vibe.</p>

              <div className="space-y-3 mb-8">
                {["Great for workouts", "Good focus music", "Chill/relaxing vibes", "Just love this song"].map((ctx, i) => (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={ctx}
                    onClick={() => setSelectedContext(ctx)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 font-medium border ${
                      selectedContext === ctx
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20 scale-[1.02]'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {ctx}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-transparent hover:bg-white/5 text-gray-400 rounded-xl transition-colors font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    onSubmit(selectedContext);
                    setSelectedContext(null);
                  }}
                  disabled={!selectedContext}
                  className="flex-1 py-3 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-bold shadow-lg"
                >
                  Save Context
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

  // Audio logic
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
        .catch(() => {
          // Auto-play prevented by browser - this is expected behavior
          // User can manually click play button
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(true);
    }
    
    setCurrentTime(0);
    setDuration(0);

    // Event handlers
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    // Attach event listeners
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack?.id]);

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl bg-gray-900 border border-white/10 shadow-2xl"
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-black opacity-50" />
      
      <div className="relative p-5 md:p-6 flex flex-col items-center">
        
        {/* Album Art */}
        <motion.div 
          className="w-40 h-40 md:w-56 md:h-56 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-2xl mb-4 flex items-center justify-center relative group overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {currentTrack.artworkUrl ? (
            <>
              <img 
                src={currentTrack.artworkUrl} 
                alt={`${currentTrack.title} album art`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="text-8xl opacity-20 animate-pulse">🎵</div>
            </>
          )}
        </motion.div>

        {/* Track Info */}
        <div className="text-center mb-3 space-y-1">
          <motion.h2 
            key={currentTrack.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 truncate max-w-md"
          >
            {currentTrack.title}
          </motion.h2>
          <motion.p 
            key={currentTrack.artist}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-400 font-medium truncate max-w-md"
          >
            {currentTrack.artist} • {currentTrack.album}
          </motion.p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-5 mb-4">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={handleDislike}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={playPreviousSong}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            disabled={!currentTrack.previewUrl}
            className={`p-3 bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg shadow-white/10 ${!currentTrack.previewUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSkip}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={handleLike}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Heart className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Reasoning Pill */}
        <div className="mb-4 w-full flex justify-center">
          <ReasoningPill 
            confidence={currentTrack.confidence}
            onClick={() => setShowReasoning(true)}
          />
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-4">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 px-1">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : currentTrack.previewUrl ? "Loading..." : "No preview"}</span>
          </div>
        </div>

        {/* Queue Toggle */}
        <motion.button
          onClick={() => setIsQueueOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-[10px] font-medium text-gray-300"
        >
          <ListMusic className="w-3 h-3" />
          Up Next
          <ChevronUp className="w-3 h-3 ml-1" />
        </motion.button>

        {/* Modals */}
        <ReasoningPanel 
          track={currentTrack}
          isOpen={showReasoning}
          onClose={() => setShowReasoning(false)}
        />
        
        <ContextModal
          track={currentTrack}
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
      </div>
    </motion.div>
  );
}
