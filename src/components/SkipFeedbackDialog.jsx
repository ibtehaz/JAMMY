import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalBackdrop from './ui/ModalBackdrop';

export default function SkipFeedbackDialog({ isOpen, onClose, onSubmit }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setCustomReason('');
    }
  }, [isOpen]);

  const reasons = [
    "Too energetic / Too slow",
    "Wrong mood or context",
    "Don't like this artist",
    "Just browsing",
    "Other"
  ];

  const handleSubmit = () => {
    if (selectedReason === "Other" && customReason.trim()) {
      onSubmit(customReason.trim());
      setSelectedReason(null);
      setCustomReason('');
    } else if (selectedReason && selectedReason !== "Other") {
      onSubmit(selectedReason);
      setSelectedReason(null);
    } else {
      onClose();
    }
  };

  const canSubmit = selectedReason && (selectedReason !== "Other" || customReason.trim());

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop onClick={onClose} zIndex={50} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
                
                {/* Custom text input for "Other" */}
                <AnimatePresence>
                  {selectedReason === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Tell us more about why you skipped..."
                        className="w-full mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                        rows={3}
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white/5 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
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
