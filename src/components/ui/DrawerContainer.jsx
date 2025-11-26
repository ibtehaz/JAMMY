import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import ModalBackdrop from './ModalBackdrop';

/**
 * Reusable bottom drawer with drag-to-dismiss
 */
export default function DrawerContainer({ 
  isOpen, 
  onClose, 
  children,
  title,
  titleIcon,
  subtitle,
  maxHeight = '75%'
}) {
  const phoneScreen = typeof document !== 'undefined' 
    ? document.getElementById('phone-screen') 
    : null;

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop onClick={onClose} zIndex={100} />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 28, 
              stiffness: 280,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className="absolute inset-x-0 bottom-0 z-[101] rounded-t-3xl overflow-hidden"
            style={{ height: maxHeight, maxHeight }}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#1a1a1f] via-[#141418] to-[#0a0a0c] border-t border-white/[0.08] rounded-t-3xl"
              style={{ 
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
              }}
            />
            
            <div className="relative flex flex-col h-full min-h-0">
              {/* Drag handle */}
              <div className="pt-3 pb-3 cursor-grab active:cursor-grabbing shrink-0">
                <div className="w-9 h-[5px] bg-white/30 rounded-full mx-auto" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 shrink-0">
                <h3 className="text-[15px] font-semibold text-white flex items-center gap-2.5">
                  {titleIcon}
                  {title}
                </h3>
                {subtitle && (
                  <span className="text-xs text-gray-500 font-medium">{subtitle}</span>
                )}
              </div>
              
              {/* Content - scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3">
                {children}
                <div className="h-8" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (phoneScreen) {
    return createPortal(drawerContent, phoneScreen);
  }
  return drawerContent;
}
