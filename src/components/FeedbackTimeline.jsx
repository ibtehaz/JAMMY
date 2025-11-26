import { Undo2, Music, Heart, SkipForward, Sliders, Activity, Clock, ThumbsDown, ThumbsUp, MessageSquare, Settings, Smile } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import { motion } from 'framer-motion';
import DrawerContainer from './ui/DrawerContainer';

export default function FeedbackTimeline({ isOpen, onClose }) {
  const { feedbackTimeline, undoFeedbackEvent } = useRecommendationEngine();

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-green-400 fill-green-400" />;
      case 'unlike': return <Heart className="w-4 h-4 text-gray-400" />;
      case 'dislike': return <ThumbsDown className="w-4 h-4 text-red-400 fill-red-400" />;
      case 'undislike': return <ThumbsUp className="w-4 h-4 text-gray-400" />;
      case 'skip': return <SkipForward className="w-4 h-4 text-gray-400" />;
      case 'skip_feedback': return <MessageSquare className="w-4 h-4 text-orange-400" />;
      case 'tuning_change': return <Sliders className="w-4 h-4 text-purple-400" />;
      case 'setting_change': return <Settings className="w-4 h-4 text-cyan-400" />;
      case 'activity_change': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'mood_change': return <Smile className="w-4 h-4 text-pink-400" />;
      default: return <Music className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTitle = (event) => {
    // For track-related events, show the track title if available
    const trackName = event.trackTitle ? `"${event.trackTitle}"` : 'a song';
    
    switch (event.type) {
      case 'like': return `Liked ${trackName}`;
      case 'unlike': return `Unliked ${trackName}`;
      case 'dislike': return `Disliked ${trackName}`;
      case 'undislike': return `Restored ${trackName}`;
      case 'skip': return 'Skipped a song';
      case 'skip_feedback': return 'Provided skip feedback';
      case 'tuning_change': return 'Adjusted Tuning';
      case 'setting_change': return 'Changed Setting';
      case 'activity_change': return 'Changed Activity';
      case 'mood_change': return 'Changed Mood';
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
    <DrawerContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Feedback Timeline"
      titleIcon={<Clock className="w-[18px] h-[18px] text-gray-400" />}
      subtitle={`${feedbackTimeline.length} events`}
    >
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
              className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors duration-150"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="font-medium text-[14px] text-white leading-snug line-clamp-2">{getTitle(event)}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{event.impact || formatTime(event.timestamp)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {event.restoreState && (
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => undoFeedbackEvent(event.id)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    title="Undo this action"
                  >
                    <Undo2 className="w-4 h-4 text-gray-400" />
                  </motion.button>
                )}
                <span className="text-[10px] text-gray-600 w-12 text-right">{formatTime(event.timestamp)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </DrawerContainer>
  );
}
