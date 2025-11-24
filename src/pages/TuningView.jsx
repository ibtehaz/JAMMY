import { Link, useNavigate } from 'react-router-dom';
import { X, History, Sparkles, RotateCcw } from 'lucide-react';
import { useRecommendationEngine } from '../context/RecommendationEngineContext';
import { useState } from 'react';
import FeedbackTimeline from '../components/FeedbackTimeline';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TuningView() {
  const navigate = useNavigate();
  const { userProfile, updateGenreWeights, setExplorationLevel, resetAlgorithm } = useRecommendationEngine();
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  
  // Initialize with current context values
  // Note: If userProfile changes in background, this won't auto-update unless we add useEffect
  const [tempGenreWeights, setTempGenreWeights] = useState(userProfile.genreWeights);
  const [tempExplorationLevel, setTempExplorationLevel] = useState(userProfile.explorationLevel);
  
  const genres = Object.keys(tempGenreWeights);

  const handleApply = async () => {
    setIsApplying(true);
    
    // Simulate AI processing delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    // Batch update genre weights to ensure atomic update
    const changedWeights = {};
    let hasChanges = false;
    
    Object.entries(tempGenreWeights).forEach(([genre, weight]) => {
      if (weight !== userProfile.genreWeights[genre]) {
        changedWeights[genre] = weight;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      updateGenreWeights(changedWeights);
    }
    
    // Update exploration level
    if (tempExplorationLevel !== userProfile.explorationLevel) {
      setExplorationLevel(tempExplorationLevel);
    }

    toast.success("Mix Tuned Successfully", {
      description: "Your playlists have been regenerated with new settings.",
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    });

    setIsApplying(false);
    navigate('/');
  };

  // Discrete exploration levels
  const explorationLevels = [
    { value: 0, label: "Home Base", desc: "Familiar favorites only" },
    { value: 0.2, label: "Near Shore", desc: "Mostly familiar, slight variety" },
    { value: 0.4, label: "Scenic Route", desc: "Balanced mix of hits & new" },
    { value: 0.6, label: "New Territory", desc: "Leaning towards discovery" },
    { value: 0.8, label: "Wild Explorer", desc: "Deep cuts and new finds" },
    { value: 1.0, label: "Totally Unknown", desc: "Complete discovery mode" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-2xl mx-auto p-4 relative pb-24"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Tuning Deck</h1>
          <p className="text-gray-400 text-sm mt-0.5">Fine-tune your algorithm</p>
        </div>
        <div className="flex gap-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTimelineOpen(true)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors backdrop-blur-md"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </motion.button>
          <Link to="/">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/10"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {/* Exploration Level */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Exploration Level</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              {Math.round(tempExplorationLevel * 100)}%
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${tempExplorationLevel * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.2"
                value={tempExplorationLevel}
                onChange={(e) => setTempExplorationLevel(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 px-1">
              <span>Familiar</span>
              <span>Adventurous</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center transition-all">
              <h3 className="text-base font-bold text-white mb-0.5">
                {explorationLevels.find(l => Math.abs(l.value - tempExplorationLevel) < 0.1)?.label}
              </h3>
              <p className="text-xs text-gray-400">
                {explorationLevels.find(l => Math.abs(l.value - tempExplorationLevel) < 0.1)?.desc}
              </p>
            </div>
          </div>
          
          <div className="mt-3 p-2.5 bg-black/20 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Queue Updated: Your queue will be reordered based on {Math.round(tempExplorationLevel * 100)}% exploration.</span>
            </div>
          </div>
        </motion.div>

        {/* Genre Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm"
        >
          <h2 className="text-lg font-semibold mb-3">Genre Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {genres.map((genre, idx) => (
              <div key={genre}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium capitalize text-gray-300">{genre}</span>
                  <span className="text-[10px] text-gray-500">
                    {Math.round(tempGenreWeights[genre] * 100)}%
                  </span>
                </div>
                <div className="relative h-1.5 bg-gray-700 rounded-full overflow-hidden group">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-white group-hover:bg-purple-400 transition-colors"
                    style={{ width: `${tempGenreWeights[genre] * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={tempGenreWeights[genre]}
                    onChange={(e) => setTempGenreWeights(prev => ({
                      ...prev,
                      [genre]: parseFloat(e.target.value)
                    }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Apply Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleApply}
          disabled={isApplying}
          className="w-full py-2.5 bg-white text-black hover:bg-gray-200 transition-all rounded-xl font-bold text-sm shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isApplying ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Retuning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Apply Changes</span>
            </>
          )}
        </motion.button>

        {/* Reset Button */}
        <div className="pt-4 flex justify-center">
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to reset the algorithm? This will clear all your preferences and learning history.")) {
                resetAlgorithm();
                navigate('/');
              }
            }}
            className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Algorithm to Default
          </button>
        </div>
      </div>

      <FeedbackTimeline 
        isOpen={isTimelineOpen} 
        onClose={() => setIsTimelineOpen(false)} 
      />
    </motion.div>
  );
}
