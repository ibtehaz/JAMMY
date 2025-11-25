import { Link } from 'react-router-dom';
import { Sliders, Music, PlayCircle, Sparkles, Sun, Moon, Dumbbell, Heart, Briefcase, BookOpen, PartyPopper, Coffee } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import LoadingSpinner from '../components/LoadingSpinner';
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
    study: { 
      gradient: "from-indigo-500 to-blue-500",
      icon: BookOpen
    },
    chill: { 
      gradient: "from-blue-500 to-cyan-500",
      icon: Moon
    },
    party: { 
      gradient: "from-pink-500 to-rose-500",
      icon: PartyPopper
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
        className="group relative block overflow-hidden rounded-2xl glass glass-hover transition-all duration-300 hover:scale-[1.02]"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white/80">
              {Math.round(playlist.confidence * 100)}% Match
            </div>
          </div>

          <h3 className="text-lg font-bold mb-0.5 group-hover:text-white transition-colors">{playlist.title}</h3>
          <p className="text-xs text-gray-400 mb-3 line-clamp-1">{playlist.description}</p>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>{playlist.tracks.length} tracks</span>
              <span>•</span>
              <span>Updated {timeAgo()}</span>
            </div>
            <PlayCircle className="w-6 h-6 text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
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
      case 'Workout': return <Dumbbell className="w-3.5 h-3.5" />;
      case 'Study': return <BookOpen className="w-3.5 h-3.5" />;
      case 'Commute': return <Briefcase className="w-3.5 h-3.5" />;
      case 'Party': return <PartyPopper className="w-3.5 h-3.5" />;
      case 'Chill': return <Coffee className="w-3.5 h-3.5" />;
      case 'Sleep': return <Moon className="w-3.5 h-3.5" />;
      default: return <Music className="w-3.5 h-3.5" />;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative px-4 py-2 rounded-full transition-all duration-300 text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md ${
        hasContext 
          ? 'bg-white text-black hover:bg-gray-100' 
          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
      }`}
    >
      {hasContext && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
      )}
      
      {activity ? (
        <>
          {getActivityIcon(activity)}
          <span>{activity}</span>
          {moods?.length > 0 && <span className="opacity-60 text-[10px] border-l border-black/20 pl-2 ml-1">+ {moods.length}</span>}
        </>
      ) : moods?.length > 0 ? (
        <span>{moods[0]} {moods.length > 1 ? `+ ${moods.length - 1}` : ''}</span>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5 text-white/60" />
          <span>Set Vibe</span>
        </>
      )}
    </motion.button>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function HomePage() {
  const { playlists, userProfile, isLoadingPreviews, setIsActivityModalOpen, setIsTuningModalOpen } = useRecommendationEngine();
  const greeting = getGreeting();

  // Show loading spinner while fetching preview data
  if (isLoadingPreviews) {
    return <LoadingSpinner message="Jammin'..." />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-full p-4 pb-4"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="mb-3">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400"
          >
            {greeting}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-xs"
          >
            Your daily mixes are ready.
          </motion.p>
        </div>
        
        {/* Activity + Tuning Deck buttons together */}
        <div className="flex items-center gap-2">
          <ActivityChip 
            activity={userProfile.currentActivity} 
            moods={userProfile.currentMoods}
            onClick={() => setIsActivityModalOpen(true)} 
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTuningModalOpen(true)}
            className="px-3 py-2 rounded-full bg-white/10 border border-white/10 flex items-center gap-1.5 text-xs font-medium hover:bg-white/20 transition-all duration-300"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tune</span>
          </motion.button>
        </div>
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 gap-3">
        {playlists.map((playlist, idx) => (
          <PlaylistCard key={playlist.id} playlist={playlist} index={idx} />
        ))}
      </div>
    </motion.div>
  );
}
