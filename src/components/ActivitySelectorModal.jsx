import { X, Book, Dumbbell, Car, PartyPopper, Coffee, Moon } from 'lucide-react';
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
    { id: "Sleep", icon: Moon, color: "text-indigo-400" }
  ];

  const moods = [
    "Energetic", "Calm", "Happy", "Melancholy", "Romantic", "Motivational", "Epic", "Nostalgic", "Focus"
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center z-[51] pointer-events-none p-4"
          >
            <div className="glass rounded-2xl w-full shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Set Context</h2>
                  <p className="text-xs text-gray-500">Tune your recommendations</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Activity Section */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Activity</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {activities.map(activity => {
                      const Icon = activity.icon;
                      const isSelected = selectedActivity === activity.id;
                      
                      return (
                        <button
                          key={activity.id}
                          onClick={() => setSelectedActivity(isSelected ? null : activity.id)}
                          className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                            isSelected
                              ? 'bg-white text-black border-transparent'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-black' : activity.color}`} />
                          <span className="text-[10px] font-medium">{activity.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mood Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mood</h3>
                    <span className="text-[10px] text-gray-500">{selectedMoods.length}/3</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {moods.map(mood => {
                      const isSelected = selectedMoods.includes(mood);
                      return (
                        <button
                          key={mood}
                          onClick={() => toggleMood(mood)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-white text-black border-transparent'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {mood}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => { handleClear(); onClose(); }}
                  className="flex-1 py-2.5 text-gray-500 hover:text-white text-sm font-medium rounded-xl hover:bg-white/5 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2.5 bg-white text-black rounded-xl text-sm font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
