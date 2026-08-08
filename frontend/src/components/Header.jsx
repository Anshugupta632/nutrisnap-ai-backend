import { motion } from 'framer-motion';

function Header({ userName = 'User', onLogout }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="flex items-center justify-between w-full py-2 px-1"
    >
      <div>
        <p className="text-cream/60 text-xs font-body font-medium tracking-wide uppercase">
          {greeting},
        </p>
        <h1 className="text-2xl font-display font-bold text-cream tracking-tight flex items-center gap-1.5 mt-0.5">
          <span>{userName}</span>
          <motion.span
            animate={{ rotate: [0, 14, -8, 14, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 1.2 }}
            className="inline-block origin-bottom-right"
          >
            👋
          </motion.span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Glowing 3D Avatar Ring */}
        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-2xl bg-dabba/80 backdrop-blur-xl border-2 border-haldi/80 flex items-center justify-center shadow-[0_0_15px_rgba(232,163,61,0.25)] transition-all cursor-pointer"
        >
          <span className="text-xl">💪</span>
        </motion.div>

        {onLogout && (
          <motion.button
            whileHover={{ scale: 1.05, translateY: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="text-cream/70 hover:text-cream text-xs font-body font-medium px-3.5 py-2 rounded-xl bg-dabba/60 backdrop-blur-md border border-white/10 hover:border-masala/40 hover:bg-masala/10 shadow-md transition-all cursor-pointer"
          >
            Logout
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default Header;