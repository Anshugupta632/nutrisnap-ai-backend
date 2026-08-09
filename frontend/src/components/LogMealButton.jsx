import { motion } from 'framer-motion';

function LogMealButton({ onClick }) {
  return (
    <div className="relative w-full group">
      {/* Background Soft Glow Aura */}
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-masala via-haldi to-masala blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-300"
      />

      {/* Main Glassmorphic CTA Button */}
      <motion.button
        onClick={onClick}
        whileHover={{
          scale: 1.02,
          y: -2,
        }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-masala to-masala/90 border border-white/20 backdrop-blur-xl flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(193,80,46,0.35)] hover:shadow-[0_15px_35px_rgba(193,80,46,0.5)] transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Shimmer Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <motion.span
          whileHover={{ rotate: [-10, 10, -10, 0], scale: 1.2 }}
          transition={{ duration: 0.4 }}
          className="text-2xl filter drop-shadow"
        >
          📸
        </motion.span>
        
        <span className="font-display font-bold text-cream text-lg tracking-wide drop-shadow-sm">
          Log Meal
        </span>
      </motion.button>
    </div>
  );
}

export default LogMealButton;


