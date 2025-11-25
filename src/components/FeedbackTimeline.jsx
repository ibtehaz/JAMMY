import { Undo2, Music, Heart, SkipForward, Sliders, Activity, X } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackTimeline({ isOpen, onClose }) {
  const { feedbackTimeline, undoFeedbackEvent } = useRecommendationEngine();

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-green-400" />;
      case 'dislike': return <div className="rotate-180"><Heart className="w-4 h-4 text-red-400" /></div>;
      case 'skip': return <SkipForward className="w-4 h-4 text-gray-400" />;
      case 'tuning_change': return <Sliders className="w-4 h-4 text-white/60" />;
      case 'activity_change': return <Activity className="w-4 h-4 text-blue-400" />;
      default: return <Music className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTitle = (event) => {
    switch (event.type) {
      case 'like': return 'Liked a song';
      case 'dislike': return 'Disliked a song';
      case 'skip': return 'Skipped a song';
      case 'tuning_change': return 'Adjusted Tuning';
      case 'activity_change': return 'Changed Context';
      default: return 'Interaction';
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return 'Yesterday';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[70] pointer-events-auto"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 glass rounded-t-3xl z-[71] overflow-hidden pointer-events-auto"
          >
            {/* Drag handle */}
            <div className="pt-3 pb-2">
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-semibold text-white">History</h3>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {feedbackTimeline.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No interactions yet.</p>
                  <p className="text-xs mt-1">Like, skip, or tune to see history.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {feedbackTimeline.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="p-2 bg-white/5 rounded-lg shrink-0">
                        {getIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{getTitle(event)}</p>
                        <p className="text-xs text-gray-500">{formatTime(event.timestamp)}</p>
                      </div>
                      <button 
                        onClick={() => undoFeedbackEvent(event.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                      >
                        <Undo2 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
