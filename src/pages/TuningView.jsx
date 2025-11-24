import { Link, useNavigate } from 'react-router-dom';
import { X, History, Sparkles, Check, RotateCcw } from 'lucide-react';
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-4xl mx-auto p-6 relative pb-24"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Tuning Deck</h1>
          <p className="text-gray-400 mt-1">Fine-tune your algorithm</p>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTimelineOpen(true)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium flex items-center gap-2 transition-colors backdrop-blur-md"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </motion.button>
          <Link to="/">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/10"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Exploration Level */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Exploration Level</h2>
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
              {Math.round(tempExplorationLevel * 100)}%
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${tempExplorationLevel * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={tempExplorationLevel}
                onChange={(e) => setTempExplorationLevel(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-400">
              <span>Familiar</span>
              <span>Adventurous</span>
            </div>
            <p className="text-sm text-gray-500 text-center bg-black/20 py-3 rounded-lg">
              {tempExplorationLevel < 0.5 
                ? "Prioritizing songs you know and love"
                : "Prioritizing new discoveries and deep cuts"}
            </p>
          </div>
        </motion.div>

        {/* Genre Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
        >
          <h2 className="text-xl font-semibold mb-6">Genre Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {genres.map((genre, idx) => (
              <div key={genre}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium capitalize text-gray-300">{genre}</span>
                  <span className="text-xs text-gray-500">
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
          className="w-full py-4 bg-white text-black hover:bg-gray-200 transition-all rounded-2xl font-bold text-lg shadow-xl shadow-white/5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isApplying ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Retuning Algorithm...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Apply Changes</span>
            </>
          )}
        </motion.button>

        {/* Reset Button */}
        <div className="pt-6 flex justify-center">
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to reset the algorithm? This will clear all your preferences and learning history.")) {
                resetAlgorithm();
                navigate('/');
              }
            }}
            className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-500/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
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
