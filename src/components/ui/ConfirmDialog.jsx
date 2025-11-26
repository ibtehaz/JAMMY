import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import ModalBackdrop from './ModalBackdrop';

/**
 * Apple-style confirmation dialog that matches the phone frame design
 */
export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    // Close dialog first with animation
    onClose();
    // Wait for exit animation to complete before executing confirm action
    await new Promise(resolve => setTimeout(resolve, 200));
    onConfirm();
    setIsConfirming(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop onClick={onClose} zIndex={200} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center z-[201] pointer-events-none p-6"
          >
            <div className="w-full max-w-[280px] rounded-2xl overflow-hidden pointer-events-auto shadow-2xl">
              {/* Glass background matching app style */}
              <div 
                className="bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10"
                style={{
                  WebkitBackdropFilter: 'blur(40px)',
                  backdropFilter: 'blur(40px)',
                }}
              >
                {/* Content */}
                <div className="px-4 pt-5 pb-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-white mb-1">
                    {title}
                  </h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">
                    {message}
                  </p>
                </div>
                
                {/* Buttons - iOS style stacked */}
                <div className="border-t border-white/10">
                  <motion.button
                    whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className={`w-full py-3.5 text-[17px] font-semibold border-b border-white/10 transition-colors disabled:opacity-50 ${
                      destructive ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    {confirmText}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={onClose}
                    disabled={isConfirming}
                    className="w-full py-3.5 text-[17px] font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {cancelText}
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
