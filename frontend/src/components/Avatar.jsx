function getAvatarState(stamina) {
  if (stamina >= 75) return { emoji: '💪', label: 'Strong', color: 'var(--color-curry)' };
  if (stamina >= 40) return { emoji: '🙂', label: 'Okay', color: 'var(--color-haldi)' };
  return { emoji: '😮‍💨', label: 'Weak', color: 'var(--color-masala)' };
}

function Avatar({ stamina = 100, strengthPoints = 0, deficitDays = 0 }) {
  const state = getAvatarState(stamina);

  return (
    <div className="bg-dabba rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
          style={{ borderColor: state.color }}
        >
          {state.emoji}
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-cream">{state.label}</p>
          <p className="text-cream/50 text-xs font-body">{strengthPoints} strength points</p>
        </div>
      </div>

      {/* Stamina bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs font-body text-cream/60">
          <span>Stamina</span>
          <span className="font-mono">{stamina}%</span>
        </div>
        <div className="w-full h-2.5 bg-steel rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${stamina}%`, backgroundColor: state.color }}
          />
        </div>
      </div>

      {deficitDays > 0 && (
        <p className="text-masala text-xs font-body bg-masala/10 rounded-lg px-3 py-2">
          ⚠️ {deficitDays} day{deficitDays > 1 ? 's' : ''} short on protein — stamina dropping!
        </p>
      )}
    </div>
  );
}

export default Avatar;