import { motion } from 'framer-motion';

/**
 * Reusable modal backdrop with blur effect
 */
export default function ModalBackdrop({ onClick, zIndex = 50 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={onClick}
      className={`absolute inset-0 bg-black/70 z-[${zIndex}] will-change-opacity`}
      style={{ 
        backdropFilter: "blur(8px)", 
        WebkitBackdropFilter: "blur(8px)",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        zIndex
      }}
      data-modal-backdrop="true"
    />
  );
}
