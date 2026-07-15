function LogMealButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 rounded-2xl bg-masala hover:bg-masala/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-masala/20"
    >
      <span className="text-xl">📸</span>
      <span className="font-display font-semibold text-cream text-lg">Log Meal</span>
    </button>
  );
}

export default LogMealButton;