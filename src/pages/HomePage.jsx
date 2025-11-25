import { Link } from 'react-router-dom';
import { Sliders, Music, PlayCircle, Sparkles, Sun, Moon, Dumbbell, Heart, Briefcase, BookOpen, PartyPopper, Coffee, Play, CloudMoon } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

const playlistConfig = {
  morning: { 
    gradient: "from-orange-500 to-rose-500",
    icon: Sun,
    context: "Commute"
  },
  favorites: { 
    gradient: "from-violet-500 to-purple-500",
    icon: Heart,
    context: null
  },
  workout: { 
    gradient: "from-emerald-500 to-teal-500",
    icon: Dumbbell,
    context: "Workout"
  },
  study: { 
    gradient: "from-indigo-500 to-blue-500",
    icon: BookOpen,
    context: "Study"
  },
  chill: { 
    gradient: "from-blue-500 to-cyan-500",
    icon: Moon,
    context: "Chill"
  },
  party: { 
    gradient: "from-pink-500 to-rose-500",
    icon: PartyPopper,
    context: "Party"
  },
  sleep: { 
    gradient: "from-indigo-600 to-purple-900",
    icon: CloudMoon,
    context: "Sleep"
  }
};

function HeroPlaylistCard({ playlist, activity }) {
  const { gradient, icon: Icon } = playlistConfig[playlist.id] || { 
    gradient: "from-gray-700 to-gray-900", 
    icon: Music 
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <Link 
        to={`/playlist/${playlist.id}`}
        className="group relative block overflow-hidden rounded-3xl"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="relative p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Perfect for {activity}
            </div>
            <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-medium text-white">
              {Math.round(playlist.confidence * 100)}% Match
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-xl">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{playlist.title}</h3>
              <p className="text-sm text-white/70">{playlist.description}</p>
              <p className="text-xs text-white/50 mt-2">{playlist.tracks.length} tracks curated for you</p>
            </div>
            
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl">
              <Play className="w-6 h-6 text-black ml-1 fill-current" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PlaylistCard({ playlist, index, isHidden }) {
  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - playlist.generatedAt) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const { gradient, icon: Icon } = playlistConfig[playlist.id] || { 
    gradient: "from-gray-700 to-gray-900", 
    icon: Music 
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isHidden ? 0 : 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link 
        to={`/playlist/${playlist.id}`}
        className="group relative block overflow-hidden rounded-2xl glass glass-hover transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white/80">
              {Math.round(playlist.confidence * 100)}% Match
            </div>
          </div>

          <h3 className="text-lg font-bold mb-0.5 group-hover:text-white transition-colors duration-200">{playlist.title}</h3>
          <p className="text-xs text-gray-400 mb-3 line-clamp-1">{playlist.description}</p>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>{playlist.tracks.length} tracks</span>
              <span>•</span>
              <span>Updated {timeAgo()}</span>
            </div>
            <PlayCircle className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
  const currentActivity = userProfile.currentActivity;

  const { heroPlaylist, otherPlaylists } = useMemo(() => {
    if (!currentActivity || playlists.length === 0) {
      return { heroPlaylist: null, otherPlaylists: playlists };
    }

    const matchingPlaylist = playlists.find(p => {
      const config = playlistConfig[p.id];
      return config?.context === currentActivity;
    });

    if (matchingPlaylist) {
      const others = playlists.filter(p => p.id !== matchingPlaylist.id);
      const favorites = others.find(p => p.id === 'favorites');
      const rest = others.filter(p => p.id !== 'favorites');
      return {
        heroPlaylist: matchingPlaylist,
        otherPlaylists: favorites ? [favorites, ...rest] : rest
      };
    }

    return { heroPlaylist: null, otherPlaylists: playlists };
  }, [currentActivity, playlists]);

  if (isLoadingPreviews) {
    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-200px)]">
        <LoadingSpinner message="Jammin'..." />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-full p-4 pb-4"
    >
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
            {currentActivity 
              ? `Curated for your ${currentActivity.toLowerCase()} session`
              : "Your daily mixes are ready."
            }
          </motion.p>
        </div>
        
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

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {heroPlaylist && (
            <HeroPlaylistCard 
              key={`hero-${heroPlaylist.id}`}
              playlist={heroPlaylist} 
              activity={currentActivity} 
            />
          )}
        </AnimatePresence>

        {heroPlaylist && otherPlaylists.length > 0 && (
          <p className="text-xs text-gray-500 font-medium pt-3 pb-1">More for you</p>
        )}

        <div className="grid grid-cols-1 gap-3">
          {otherPlaylists.map((playlist, idx) => (
            <PlaylistCard key={playlist.id} playlist={playlist} index={idx} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
