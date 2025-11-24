import { X, Check, Book, Dumbbell, Car, PartyPopper, Coffee, Brain } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActivitySelectorModal({ 
  isOpen, 
  onClose, 
  currentActivity, 
  currentMoods, 
  onApply 
}) {
  const [selectedActivity, setSelectedActivity] = useState(currentActivity);
  const [selectedMoods, setSelectedMoods] = useState(currentMoods || []);

  const activities = [
    { id: "Study", icon: Book, color: "text-blue-400" },
    { id: "Workout", icon: Dumbbell, color: "text-emerald-400" },
    { id: "Commute", icon: Car, color: "text-orange-400" },
    { id: "Party", icon: PartyPopper, color: "text-pink-400" },
    { id: "Chill", icon: Coffee, color: "text-amber-400" },
    { id: "Focus", icon: Brain, color: "text-violet-400" }
  ];

  const moods = [
    "Energetic", "Calm", "Happy", "Melancholy", "Groovy", "Romantic", "Motivational", "Epic"
  ];

  const toggleMood = (mood) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(prev => prev.filter(m => m !== mood));
    } else {
      if (selectedMoods.length >= 3) return; // Max 3 moods
      setSelectedMoods(prev => [...prev, mood]);
    }
  };

  const handleApply = () => {
    onApply(selectedActivity, selectedMoods);
    onClose();
  };

  const handleClear = () => {
    setSelectedActivity(null);
    setSelectedMoods([]);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[51] pointer-events-none p-4"
          >
            <div className="bg-black/80 border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-bold text-white">Set Context</h2>
                  <p className="text-sm text-gray-400">Tune your recommendations</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Activity Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Activity</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {activities.map(activity => {
                      const Icon = activity.icon;
                      const isSelected = selectedActivity === activity.id;
                      
                      return (
                        <motion.button
                          key={activity.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedActivity(isSelected ? null : activity.id)}
                          className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 relative group ${
                            isSelected
                              ? 'bg-white text-black border-transparent shadow-lg shadow-white/10'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-black/10 rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                          <Icon className={`w-8 h-8 ${isSelected ? 'text-black' : activity.color} transition-colors`} />
                          <span className="text-sm font-semibold">{activity.id}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Mood Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mood</h3>
                    <span className="text-xs text-gray-500">{selectedMoods.length}/3</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {moods.map(mood => {
                      const isSelected = selectedMoods.includes(mood);
                      return (
                        <motion.button
                          key={mood}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleMood(mood)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-white/10 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                          }`}
                        >
                          {mood}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 flex items-center justify-between gap-4 bg-black/40 backdrop-blur-md">
                <button 
                  onClick={handleClear}
                  className="text-gray-500 hover:text-white text-sm font-medium px-2 transition-colors"
                >
                  Reset
                </button>
                <div className="flex gap-3 flex-1 justify-end">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl hover:bg-white/5 text-gray-300 font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApply}
                    className="px-8 py-3 rounded-xl bg-white text-black font-bold shadow-lg hover:bg-gray-100 transition-all text-sm"
                  >
                    Apply
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
