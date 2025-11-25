import { AlertCircle } from 'lucide-react';
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center z-[51] p-4 pointer-events-none"
          >
            <div className="glass rounded-2xl w-full shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Skipping a lot?</h3>
                  <p className="text-xs text-gray-500">Let us improve your mix</p>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 space-y-2">
                {reasons.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left p-3 rounded-xl transition-all text-sm font-medium border ${
                      selectedReason === reason
                        ? 'bg-white border-transparent text-black'
                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-gray-500 hover:text-white text-sm font-medium rounded-xl hover:bg-white/5 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason}
                  className="flex-1 py-2.5 bg-white text-black rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  Fix My Mix
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
