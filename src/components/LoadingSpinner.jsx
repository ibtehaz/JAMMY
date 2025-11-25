import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

export default function LoadingSpinner({ message = "Jammin'..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-white/20 absolute inset-0 blur-xl" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center">
          <Music className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <motion.h2
        animate={{ 
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-white"
      >
        {message}
      </motion.h2>

      <motion.div 
        className="flex gap-2 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
            className="w-1.5 h-1.5 rounded-full bg-white/60"
          />
        ))}
      </motion.div>
    </div>
  );
}
