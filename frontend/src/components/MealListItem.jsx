function MealListItem({ mealType, time, calories, itemNames }) {
  return (
    <div className="flex items-center justify-between bg-dabba rounded-xl px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-cream font-body font-medium capitalize">{mealType}</span>
        <span className="text-cream/50 text-xs font-body">{itemNames}</span>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-haldi font-semibold">{calories} kcal</span>
        <span className="text-cream/40 text-xs font-mono">{time}</span>
      </div>
    </div>
  );
}

export default MealListItem;