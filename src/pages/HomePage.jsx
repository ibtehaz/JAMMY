import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sliders, Music, PlayCircle, Sparkles, Sun, Moon, Dumbbell, Heart, Briefcase, BookOpen, PartyPopper, Coffee, Brain } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import ActivitySelectorModal from '../components/ActivitySelectorModal';
import { motion } from 'framer-motion';

function PlaylistCard({ playlist, index }) {
  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - playlist.generatedAt) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Unique gradients and icons based on playlist ID
  const config = {
    morning: { 
      gradient: "from-orange-500 to-rose-500",
      icon: Sun
    },
    favorites: { 
      gradient: "from-violet-500 to-purple-500",
      icon: Heart 
    },
    workout: { 
      gradient: "from-emerald-500 to-teal-500",
      icon: Dumbbell
    },
    chill: { 
      gradient: "from-blue-500 to-cyan-500",
      icon: Moon
    }
  };

  const { gradient, icon: Icon } = config[playlist.id] || { 
    gradient: "from-gray-700 to-gray-900", 
    icon: Music 
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link 
        to={`/playlist/${playlist.id}`}
        className="group relative block overflow-hidden rounded-2xl bg-gray-900/40 border border-white/5 hover:bg-gray-800/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-sm"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/80">
              {Math.round(playlist.confidence * 100)}% Match
            </div>
          </div>

          <h3 className="text-xl font-bold mb-1 group-hover:text-purple-300 transition-colors">{playlist.title}</h3>
          <p className="text-sm text-gray-400 mb-4 line-clamp-1">{playlist.description}</p>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{playlist.tracks.length} tracks</span>
              <span>•</span>
              <span>Updated {timeAgo()}</span>
            </div>
            <PlayCircle className="w-8 h-8 text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ActivityChip({ activity, moods, onClick }) {
  const hasContext = activity || (moods && moods.length > 0);

  const getActivityIcon = (act) => {
    switch(act) {
      case 'Workout': return <Dumbbell className="w-4 h-4" />;
      case 'Study': return <BookOpen className="w-4 h-4" />;
      case 'Commute': return <Briefcase className="w-4 h-4" />;
      case 'Party': return <PartyPopper className="w-4 h-4" />;
      case 'Chill': return <Coffee className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative px-5 py-2.5 rounded-full transition-all duration-300 text-sm font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md ${
        hasContext 
          ? 'bg-white text-black hover:bg-gray-100' 
          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
      }`}
    >
      {hasContext && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
      )}
      
      {activity ? (
        <>
          {getActivityIcon(activity)}
          <span>{activity}</span>
          {moods?.length > 0 && <span className="opacity-60 text-xs border-l border-black/20 pl-2 ml-1">+ {moods.length}</span>}
        </>
      ) : moods?.length > 0 ? (
        <span>{moods[0]} {moods.length > 1 ? `+ ${moods.length - 1}` : ''}</span>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>Set Vibe</span>
        </>
      )}
    </motion.button>
  );
}

export default function HomePage() {
  const { playlists, userProfile, setActivity, setMoods, isLoadingPreviews } = useRecommendationEngine();
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const handleApplyContext = (activity, moods) => {
    setActivity(activity);
    setMoods(moods);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto p-6 pb-24"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 pb-1 pr-1"
          >
            Good Evening
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            Your daily mixes are ready.
          </motion.p>
        </div>
        
        <div className="flex items-center gap-3">
          <ActivityChip 
            activity={userProfile.currentActivity} 
            moods={userProfile.currentMoods}
            onClick={() => setIsActivityModalOpen(true)} 
          />
          <Link to="/tuning">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors font-semibold flex items-center gap-2 backdrop-blur-md shadow-lg"
            >
              <Sliders className="w-4 h-4" />
              <span>Tune Deck</span>
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playlists.map((playlist, idx) => (
          <PlaylistCard key={playlist.id} playlist={playlist} index={idx} />
        ))}
      </div>

      <ActivitySelectorModal 
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        currentActivity={userProfile.currentActivity}
        currentMoods={userProfile.currentMoods}
        onApply={handleApplyContext}
      />
    </motion.div>
  );
}
