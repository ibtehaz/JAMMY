import { X, History, Sparkles, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import FeedbackTimeline from './FeedbackTimeline';

function Fader({ value, onChange, label, compact = false }) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const trackHeight = compact ? 50 : 70;
  
  const handleInteraction = (clientY) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(trackHeight, relativeY));
    const newValue = 1 - (clampedY / trackHeight);
    onChange(Math.round(newValue * 100) / 100);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleInteraction(e.clientY);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    handleInteraction(e.touches[0].clientY);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      handleInteraction(clientY);
    };
    
    const handleEnd = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const knobY = (1 - value) * trackHeight;

  return (
    <div className={`flex flex-col items-center select-none ${compact ? 'gap-1' : 'gap-2'}`}>
      <div 
        ref={trackRef}
        className={`relative cursor-pointer touch-none ${compact ? 'w-8' : 'w-10'}`}
        style={{ height: trackHeight + 12 }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-1.5 bottom-1.5 w-1 bg-white/[0.08] rounded-full overflow-hidden">
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/40 to-white/20 rounded-full"
            initial={false}
            animate={{ height: `${value * 100}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>
        
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          initial={false}
          animate={{ y: knobY }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          <div 
            className={`
              ${compact ? 'w-6 h-4' : 'w-8 h-5'} rounded-md 
              bg-gradient-to-b from-white to-gray-100
              shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.8)]
              flex items-center justify-center
              ${isDragging ? 'shadow-[0_4px_16px_rgba(255,255,255,0.15)]' : ''}
            `}
          >
            <div className="flex flex-col gap-[1px]">
              <div className={`${compact ? 'w-2' : 'w-3'} h-[1px] bg-black/15 rounded-full`} />
              <div className={`${compact ? 'w-2' : 'w-3'} h-[1px] bg-black/15 rounded-full`} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="text-center">
        <div className={`${compact ? 'text-[7px]' : 'text-[8px]'} font-medium uppercase tracking-wider text-white/40 truncate ${compact ? 'max-w-[52px]' : 'max-w-[60px]'}`}>
          {label}
        </div>
        <motion.div 
          className={`${compact ? 'text-[10px]' : 'text-xs'} font-semibold text-white/90 tabular-nums`}
          key={Math.round(value * 100)}
          initial={{ scale: 1.1, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {Math.round(value * 100)}
        </motion.div>
      </div>
    </div>
  );
}

export default function TuningDeckModal({ 
  isOpen, 
  onClose,
  userProfile,
  updateGenreWeights,
  setExplorationLevel,
  resetAlgorithm
}) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  
  const [tempGenreWeights, setTempGenreWeights] = useState(userProfile.genreWeights);
  const [tempExplorationLevel, setTempExplorationLevel] = useState(userProfile.explorationLevel);
  
  useEffect(() => {
    if (isOpen) {
      setTempGenreWeights(userProfile.genreWeights);
      setTempExplorationLevel(userProfile.explorationLevel);
      setIsTimelineOpen(false);
    }
  }, [isOpen, userProfile.genreWeights, userProfile.explorationLevel]);
  
  const genres = Object.keys(tempGenreWeights).slice(0, 8);

  const handleApply = async () => {
    setIsApplying(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const changedWeights = {};
    let hasChanges = false;
    
    Object.entries(tempGenreWeights).forEach(([genre, weight]) => {
      if (weight !== userProfile.genreWeights[genre]) {
        changedWeights[genre] = weight;
        hasChanges = true;
      }
    });

    if (hasChanges) updateGenreWeights(changedWeights);
    if (tempExplorationLevel !== userProfile.explorationLevel) setExplorationLevel(tempExplorationLevel);

    toast.success("Settings Applied", { description: "Your playlists have been updated." });
    setIsApplying(false);
    onClose();
  };

  const explorationLabel = tempExplorationLevel < 0.33 ? "Familiar" : tempExplorationLevel < 0.66 ? "Balanced" : "Discovery";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center z-[51] pointer-events-none p-4"
          >
            <div 
              className="glass rounded-2xl w-full shadow-2xl pointer-events-auto max-h-[90%] overflow-y-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Tuning Deck</h2>
                  <p className="text-xs text-gray-500">Fine-tune your algorithm</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsTimelineOpen(true)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <History className="w-4 h-4 text-gray-400" />
                  </button>
                  <button 
                    onClick={onClose} 
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-3">
                {/* Discovery Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Discovery Level</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold tabular-nums">{Math.round(tempExplorationLevel * 100)}%</div>
                      <div className="text-[10px] text-gray-500">{explorationLabel}</div>
                    </div>
                  </div>
                  
                  <div className="relative h-8">
                    <div className="absolute top-3 left-0 right-0 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/60 to-white rounded-full"
                        animate={{ width: `${tempExplorationLevel * 100}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempExplorationLevel * 100}
                      onChange={(e) => setTempExplorationLevel(e.target.value / 100)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Familiar</span>
                    <span>Adventurous</span>
                  </div>
                </div>

                {/* Genre Mix Section */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Genre Mix</h3>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between px-2">
                      {genres.slice(0, 4).map((genre) => (
                        <Fader
                          key={genre}
                          value={tempGenreWeights[genre]}
                          onChange={(val) => setTempGenreWeights(prev => ({...prev, [genre]: val}))}
                          label={genre}
                          compact
                        />
                      ))}
                    </div>
                    <div className="flex justify-between px-2">
                      {genres.slice(4, 8).map((genre) => (
                        <Fader
                          key={genre}
                          value={tempGenreWeights[genre]}
                          onChange={(val) => setTempGenreWeights(prev => ({...prev, [genre]: val}))}
                          label={genre}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => {
                    if (window.confirm("Reset all preferences?")) {
                      resetAlgorithm();
                      onClose();
                    }
                  }}
                  className="flex-1 py-2.5 text-gray-500 hover:text-red-400 text-sm font-medium rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 py-2.5 bg-white text-black rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isApplying ? (
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isApplying ? "Applying..." : "Apply"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Feedback Timeline - rendered with higher z-index */}
          {isTimelineOpen && (
            <div className="absolute inset-0 z-[60]">
              <FeedbackTimeline 
                isOpen={isTimelineOpen} 
                onClose={() => setIsTimelineOpen(false)} 
              />
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
