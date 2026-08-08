import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function getAvatarState(stamina) {
  if (stamina >= 75) return { emoji: '💪', label: 'Strong', color: 'var(--color-curry, #6B8E4E)' };
  if (stamina >= 40) return { emoji: '🙂', label: 'Okay', color: 'var(--color-haldi, #E8A33D)' };
  return { emoji: '😮‍💨', label: 'Weak', color: 'var(--color-masala, #C1502E)' };
}

function useCountUp(end, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

function Avatar({ stamina = 100, strengthPoints = 0, deficitDays = 0 }) {
  const state = getAvatarState(stamina);
  const animatedStamina = useCountUp(stamina, 1000);
  const animatedStrength = useCountUp(strengthPoints, 800);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="bg-dabba/60 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col gap-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: [0, -6, 6, -6, 0] }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 bg-black/30 backdrop-blur-md shadow-lg relative"
          style={{
            borderColor: state.color,
            boxShadow: `0 0 15px ${state.color}40`,
          }}
        >
          {state.emoji}
        </motion.div>
        <div className="flex-1">
          <motion.p
            key={state.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
            className="font-display font-bold text-lg text-cream tracking-wide"
          >
            {state.label}
          </motion.p>
          <motion.p
            key={animatedStrength}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-cream/60 text-xs font-body font-medium"
          >
            {animatedStrength} strength points
          </motion.p>
        </div>
      </motion.div>

      {/* Glassmorphic Stamina bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 20 }}
        className="flex flex-col gap-2"
      >
        <div className="flex justify-between text-xs font-body font-semibold text-cream/70">
          <span>Stamina</span>
          <motion.span
            key={animatedStamina}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="font-mono text-cream"
          >
            {animatedStamina}%
          </motion.span>
        </div>
        <div className="w-full h-3 bg-black/40 rounded-full p-0.5 border border-white/5 shadow-inner overflow-hidden">
          <motion.div
            key={stamina}
            initial={{ width: 0 }}
            animate={{ width: `${stamina}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15, duration: 1.2 }}
            className="h-full rounded-full shadow-md"
            style={{
              backgroundColor: state.color,
              boxShadow: `0 0 10px ${state.color}80`,
            }}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {deficitDays > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="text-masala text-xs font-body font-medium bg-masala/15 border border-masala/30 rounded-xl px-3.5 py-2.5 backdrop-blur-md flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>
              {deficitDays} day{deficitDays > 1 ? 's' : ''} short on protein — stamina dropping!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Avatar;