import { useState, useRef, useEffect, memo } from 'react';
// Note: useRef and useEffect are used by SwipeableAlbumArt and QueueDrawer
import { createPortal } from 'react-dom';
import { Play, Pause, Heart, ThumbsDown, SkipForward, ListMusic, Info, X } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { toast } from 'sonner';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const SwipeableAlbumArt = memo(function SwipeableAlbumArt({ track, onSwipeLeft, onSwipeRight }) {
  const x = useMotionValue(0);
  const containerRef = useRef(null);
  
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);
  
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  
  const greenGlow = useTransform(x, [0, 150], [0, 0.6]);
  const redGlow = useTransform(x, [-150, 0], [0.6, 0]);

  const handleDragEnd = (_, info) => {
    const threshold = 100;
    const velocity = 500;
    
    if (info.offset.x > threshold || info.velocity.x > velocity) {
      animate(x, 250, { 
        type: 'spring', 
        stiffness: 600, 
        damping: 35,
        onComplete: () => {
          onSwipeRight?.();
          x.set(0);
        }
      });
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      animate(x, -250, { 
        type: 'spring', 
        stiffness: 600, 
        damping: 35,
        onComplete: () => {
          onSwipeLeft?.();
          x.set(0);
        }
      });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 700, damping: 40 });
    }
  };

  useEffect(() => {
    x.set(0);
  }, [track?.id, x]);

  return (
    <div ref={containerRef} className="relative w-full max-w-[240px] mb-5">
      <motion.div 
        className="absolute inset-0 rounded-2xl bg-green-500/80 blur-3xl scale-90"
        style={{ opacity: greenGlow }}
      />
      <motion.div 
        className="absolute inset-0 rounded-2xl bg-red-500/80 blur-3xl scale-90"
        style={{ opacity: redGlow }}
      />
      
      <motion.div
        style={{ x, rotate, scale }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        className="relative aspect-square w-full cursor-grab active:cursor-grabbing"
      >
        <motion.div 
          layoutId="album-art"
          className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        >
          {track?.artworkUrl ? (
            <img 
              src={track.artworkUrl} 
              alt={`${track.title} album art`}
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl opacity-30">🎵</span>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          style={{ opacity: likeOpacity }}
          className="absolute top-4 right-4 px-4 py-2 bg-green-500 rounded-xl border-3 border-green-300 shadow-lg transform rotate-12"
        >
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Heart className="w-5 h-5 fill-current" />
            <span>LIKE</span>
          </div>
        </motion.div>
        
        <motion.div 
          style={{ opacity: nopeOpacity }}
          className="absolute top-4 left-4 px-4 py-2 bg-red-500 rounded-xl border-3 border-red-300 shadow-lg transform -rotate-12"
        >
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ThumbsDown className="w-5 h-5" />
            <span>NOPE</span>
          </div>
        </motion.div>
      </motion.div>
      
      <p className="text-center text-[10px] text-gray-500 mt-3">
        ← Swipe to react →
      </p>
    </div>
  );
});

const ReasoningPill = memo(function ReasoningPill({ confidence, onClick }) {
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
});

function QueueDrawer({ isOpen, onClose, playlist, currentIndex, onPlayTrack, likedTrackIds, dislikedTrackIds }) {
  const allTracks = playlist?.tracks || [];
  const upcomingTracks = allTracks
    .map((t, i) => ({ ...t, originalIndex: i }))
    .slice(currentIndex + 1, currentIndex + 6);

  const phoneScreen = typeof document !== 'undefined' ? document.getElementById('phone-screen') : null;

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 z-[100]"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            data-modal-backdrop="true"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 28, 
              stiffness: 280,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className="absolute inset-x-0 bottom-0 z-[101] rounded-t-3xl overflow-hidden"
            style={{ maxHeight: '75%' }}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#1a1a1f] via-[#141418] to-[#0a0a0c] border-t border-white/[0.08]"
              style={{ 
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
              }}
            />
            
            <div className="relative flex flex-col h-full">
              <div className="pt-3 pb-3 cursor-grab active:cursor-grabbing">
                <div className="w-9 h-[5px] bg-white/30 rounded-full mx-auto" />
              </div>
              
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="text-[15px] font-semibold text-white flex items-center gap-2.5">
                  <ListMusic className="w-[18px] h-[18px] text-gray-400" />
                  Up Next
                </h3>
                <span className="text-xs text-gray-500 font-medium">{upcomingTracks.length} tracks</span>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide px-3">
                <div className="space-y-0.5">
                  {upcomingTracks.length > 0 ? (
                    upcomingTracks.map((track, i) => (
                      <motion.button 
                        key={track.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        onClick={() => {
                          if (typeof onPlayTrack === 'function') {
                            onPlayTrack(track.originalIndex);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.08] w-full text-left transition-colors duration-150"
                      >
                        <span className="text-gray-500 w-5 text-center text-sm font-medium tabular-nums">{i + 1}</span>
                        <div className="w-11 h-11 rounded-xl bg-gray-800/80 overflow-hidden shrink-0 shadow-md">
                          {track.artworkUrl100 ? (
                            <img src={track.artworkUrl100} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                              <span className="text-lg opacity-30">🎵</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium truncate text-[14px] text-white leading-tight">{track.title}</p>
                            {likedTrackIds?.has(track.id) && (
                              <Heart className="w-3 h-3 text-green-400 fill-green-400 shrink-0" />
                            )}
                            {dislikedTrackIds?.has(track.id) && (
                              <ThumbsDown className="w-3 h-3 text-red-400 fill-red-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[12px] text-gray-500 truncate mt-0.5">{track.artist}</p>
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          track.confidence >= 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {Math.round(track.confidence * 100)}%
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500 text-sm">End of playlist</p>
                    </div>
                  )}
                </div>
                
                <div className="h-8" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (phoneScreen) {
    return createPortal(drawerContent, phoneScreen);
  }
  return drawerContent;
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 z-40"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            data-modal-backdrop="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 z-50"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            data-modal-backdrop="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
  const { 
    playlists, 
    currentPlaylistId, 
    currentTrackIndex, 
    likeSong, 
    unlikeSong, 
    dislikeSong, 
    undislikeSong, 
    skipSong, 
    playTrackAtIndex, 
    likedTrackIds, 
    dislikedTrackIds,
    // Audio from context
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    seekTo,
    currentTrack
  } = useRecommendationEngine();
  
  const [showReasoning, setShowReasoning] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);

  if (!currentTrack) return null;

  const isLiked = likedTrackIds.has(currentTrack.id);
  const isDisliked = dislikedTrackIds.has(currentTrack.id);

  const handleLike = () => {
    if (isLiked) {
      // Toggle off - unlike
      unlikeSong(currentTrack.id);
      toast("Removed from likes", {
        description: "We've updated your preferences",
        icon: <Heart className="w-5 h-5 text-gray-400" />,
        duration: 2000
      });
    } else {
      // Show context modal for new like
      setShowContextModal(true);
    }
  };

  const handleContextSubmit = (context) => {
    likeSong(currentTrack.id, context);
    toast.success("Added to your likes", {
      description: context ? `We'll play more music for "${context}"` : "We'll play more music like this",
      duration: 2000
    });
    setShowContextModal(false);
  };

  const handleSkip = () => {
    skipSong(currentTrack.id);
    toast.dismiss(); // Clear previous toasts for rapid skipping
    toast("Skipped", {
      description: "We'll play different songs",
      icon: <SkipForward className="w-5 h-5 text-gray-400" />,
      duration: 1500
    });
  };

  const handleDislike = () => {
    if (isDisliked) {
      // Toggle off - undislike (no skip)
      undislikeSong(currentTrack.id);
      toast("Removed dislike", {
        description: "This song can appear again",
        icon: <ThumbsDown className="w-5 h-5 text-gray-400" />,
        duration: 2000
      });
    } else {
      // New dislike - skip to next
      dislikeSong(currentTrack.id);
      toast("Disliked", {
        description: "We'll show fewer songs like this",
        icon: <ThumbsDown className="w-5 h-5 text-red-400" />,
        duration: 2000
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className="relative flex flex-col items-center"
    >
      {/* Album Art with Swipe Gestures */}
      <SwipeableAlbumArt 
        track={currentTrack}
        onSwipeRight={handleLike}
        onSwipeLeft={handleDislike}
      />

      {/* Track Info */}
      <div className="text-center mb-3 w-full px-2">
        <motion.h2 
          key={currentTrack.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xl font-bold text-white truncate"
        >
          {currentTrack.title}
        </motion.h2>
        <motion.p 
          key={currentTrack.artist}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, delay: 0.05 }}
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
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none"
            style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
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
          className={`p-3 transition-colors ${
            dislikedTrackIds.has(currentTrack.id) 
              ? 'text-red-500' 
              : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <ThumbsDown className={`w-5 h-5 ${dislikedTrackIds.has(currentTrack.id) ? 'fill-current' : ''}`} />
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
          className={`p-3 bg-white text-black rounded-full shadow-lg ${!currentTrack.previewUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleSkip}
          className="p-3 text-gray-400 hover:text-white transition-colors"
        >
          <SkipForward className="w-6 h-6" />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={handleLike}
          className={`p-3 transition-colors ${
            likedTrackIds.has(currentTrack.id) 
              ? 'text-green-400' 
              : 'text-gray-400 hover:text-green-400'
          }`}
        >
          <Heart className={`w-5 h-5 ${likedTrackIds.has(currentTrack.id) ? 'fill-current' : ''}`} />
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
        likedTrackIds={likedTrackIds}
        dislikedTrackIds={dislikedTrackIds}
      />
    </motion.div>
  );
}
