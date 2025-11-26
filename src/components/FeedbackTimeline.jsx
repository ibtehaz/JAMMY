import { Undo2, Music, Heart, SkipForward, Sliders, Activity, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackTimeline({ isOpen, onClose }) {
  const { feedbackTimeline, undoFeedbackEvent } = useRecommendationEngine();

  const phoneScreen = typeof document !== 'undefined' ? document.getElementById('phone-screen') : null;

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-green-400 fill-green-400" />;
      case 'dislike': return <Heart className="w-4 h-4 text-red-400 rotate-180" />;
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
              className="absolute inset-0 bg-gradient-to-b from-[#1a1a1f] via-[#141418] to-[#0a0a0c] border-t border-white/[0.08] rounded-t-3xl"
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
                  <Clock className="w-[18px] h-[18px] text-gray-400" />
                  Feedback Timeline
                </h3>
                <span className="text-xs text-gray-500 font-medium">{feedbackTimeline.length} events</span>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide px-3">
                <div className="space-y-0.5">
                  {feedbackTimeline.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500 text-sm">No interactions yet</p>
                      <p className="text-gray-600 text-xs mt-1">Like, skip, or tune to see history</p>
                    </div>
                  ) : (
                    feedbackTimeline.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors duration-150"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                          {getIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-[14px] text-white leading-tight">{getTitle(event)}</p>
                          <p className="text-[12px] text-gray-500 truncate mt-0.5">{event.impact || formatTime(event.timestamp)}</p>
                        </div>
                        {event.restoreState && (
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => undoFeedbackEvent(event.id)}
                            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors shrink-0"
                          >
                            <Undo2 className="w-4 h-4 text-gray-400" />
                          </motion.button>
                        )}
                        <span className="text-[10px] text-gray-600 shrink-0">{formatTime(event.timestamp)}</span>
                      </motion.div>
                    ))
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
