// Body type ke hisaab se macro ratio (percentage of total calories)
const MACRO_RATIOS = {
  ectomorph: { carbs: 0.50, protein: 0.25, fats: 0.25 },
  mesomorph: { carbs: 0.40, protein: 0.30, fats: 0.30 },
  endomorph: { carbs: 0.30, protein: 0.35, fats: 0.35 },
};

// 1 gram macros ki calories (fixed nutrition science values)
const CALORIES_PER_GRAM = { carbs: 4, protein: 4, fats: 9 };

function calculateTargets(bodyType, weightKg) {
  // Simple activity-adjusted calorie estimate: weight ke hisaab se base calories
  // (Yeh ek simplified heuristic hai, exact BMR formula nahi)
  const baseCalories = weightKg * 30; // moderate activity assumption

  const ratio = MACRO_RATIOS[bodyType] || MACRO_RATIOS.mesomorph; // fallback safety

  const proteinCalories = baseCalories * ratio.protein;
  const carbsCalories = baseCalories * ratio.carbs;
  const fatsCalories = baseCalories * ratio.fats;

  return {
    daily_calorie_target: Math.round(baseCalories),
    daily_protein_target: Math.round(proteinCalories / CALORIES_PER_GRAM.protein),
    daily_carbs_target: Math.round(carbsCalories / CALORIES_PER_GRAM.carbs),
    daily_fats_target: Math.round(fatsCalories / CALORIES_PER_GRAM.fats),
  };
}

module.exports = { calculateTargets };