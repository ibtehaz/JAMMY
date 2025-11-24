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
      case 'tuning_change': return <Sliders className="w-4 h-4 text-purple-400" />;
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Feedback Timeline</h2>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {feedbackTimeline.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  <p>No interactions yet.</p>
                  <p className="text-sm mt-2">Like, skip, or tune your mix to see history here.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {feedbackTimeline.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative pl-6 pb-6 border-l border-white/10 last:border-0 last:pb-0"
                    >
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-800 border border-gray-600 shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                      
                      <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-2xl p-4 border border-white/5 shadow-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-black/30 rounded-lg">
                              {getIcon(event.type)}
                            </div>
                            <span className="font-medium text-sm text-gray-200">{getTitle(event)}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
                        </div>

                        {event.details && (
                          <div className="text-sm text-gray-400 mb-3 pl-9">
                            {event.type === 'tuning_change' && event.details.genre && (
                              <span>{event.details.genre}: {Math.round(event.details.from * 100)}% → {Math.round(event.details.to * 100)}%</span>
                            )}
                            {event.type === 'tuning_change' && event.details.setting === 'exploration' && (
                              <span>Exploration: {Math.round(event.details.from * 100)}% → {Math.round(event.details.to * 100)}%</span>
                            )}
                            {event.type === 'activity_change' && (
                              <span>Switched to {event.details.activity}</span>
                            )}
                            {event.type === 'like' && event.details.context && (
                              <span>Context: "{event.details.context}"</span>
                            )}
                            {event.type === 'skip' && event.details.reason && (
                              <span>Reason: "{event.details.reason}"</span>
                            )}
                          </div>
                        )}

                        {event.impact && (
                          <div className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg mb-3 ml-9">
                            {event.impact}
                          </div>
                        )}

                        <div className="pl-9">
                          <button 
                            onClick={() => undoFeedbackEvent(event.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-white transition-colors"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Undo</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
