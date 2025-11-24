import { X, AlertCircle, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SkipFeedbackDialog({ isOpen, onClose, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState(null);

  const reasons = [
    "Too energetic / Too slow",
    "Wrong mood or context",
    "Don't like this artist",
    "Just browsing"
  ];

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason);
      setSelectedReason(null);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Skipping a lot?
                  </h3>
                  <p className="text-sm text-gray-400">
                    Let us improve your mix
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {reasons.map(reason => (
                  <motion.button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between group border ${
                      selectedReason === reason
                        ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-900/20'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <span className={`font-medium ${selectedReason === reason ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {reason}
                    </span>
                    {selectedReason === reason && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Dismiss
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!selectedReason}
                  className="flex-1 py-3.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/5"
                >
                  Fix My Mix
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
