import { motion } from 'framer-motion';

function MealListItem({ mealType, time, calories, itemNames, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 30, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="flex items-center justify-between bg-dabba/60 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-colors group cursor-pointer"
      layout
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-cream font-body font-semibold capitalize tracking-wide group-hover:text-haldi transition-colors">
          {mealType}
        </span>
        <span className="text-cream/50 text-xs font-body font-medium truncate max-w-[180px] sm:max-w-[240px]">
          {itemNames}
        </span>
      </div>
      
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-haldi font-bold text-sm drop-shadow-[0_0_8px_rgba(232,163,61,0.25)]">
          {calories} kcal
        </span>
        <span className="text-cream/40 text-[11px] font-mono tracking-tight">
          {time}
        </span>
      </div>
    </motion.div>
  );
}

export default MealListItem;