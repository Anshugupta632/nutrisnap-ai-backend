// Macro ratio based on body type (percentage of total calories)
const MACRO_RATIOS = {
  ectomorph: { carbs: 0.50, protein: 0.25, fats: 0.25 },
  mesomorph: { carbs: 0.40, protein: 0.30, fats: 0.30 },
  endomorph: { carbs: 0.30, protein: 0.35, fats: 0.35 },
};

// Calories per gram of macros (fixed nutrition science values)
const CALORIES_PER_GRAM = { carbs: 4, protein: 4, fats: 9 };

// Activity multipliers (Harris-Benedict standard)
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week (default)
  active: 1.725,       // Hard exercise 6-7 days/week
  very_active: 1.9,    // Very hard exercise, physical job
};

/**
 * Calculates BMR using Mifflin-St Jeor formula
 * Men: BMR = 10*weight(kg) + 6.25*height(cm) - 5*age + 5
 * Women: BMR = 10*weight(kg) + 6.25*height(cm) - 5*age - 161
 */
function calculateBMR(weightKg, heightCm, age, gender) {
  // Default values if height/age/gender not provided
  const h = heightCm || 170;      // Default 170cm
  const a = age || 25;            // Default 25 years
  const g = (gender || 'male').toLowerCase();

  let bmr;
  if (g === 'female' || g === 'woman') {
    bmr = 10 * weightKg + 6.25 * h - 5 * a - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * h - 5 * a + 5;
  }

  return Math.max(bmr, 1000); // Minimum BMR safety floor
}

/**
 * Calculates daily macro targets based on body type, weight, height, age, gender
 * @param {string} bodyType - 'ectomorph' | 'mesomorph' | 'endomorph'
 * @param {number} weightKg - Weight in kg
 * @param {number} [heightCm] - Height in cm (optional)
 * @param {number} [age] - Age in years (optional)
 * @param {string} [gender] - 'male' | 'female' (optional)
 * @returns {Object} Daily calorie and macro targets
 */
function calculateTargets(bodyType, weightKg, heightCm, age, gender) {
  // Get BMR from Mifflin-St Jeor
  const bmr = calculateBMR(weightKg, heightCm, age, gender);

  // Apply activity multiplier (moderate default)
  const activityMultiplier = ACTIVITY_MULTIPLIERS.moderate;
  const tdee = bmr * activityMultiplier;

  // Get macro ratio based on body type
  const ratio = MACRO_RATIOS[bodyType] || MACRO_RATIOS.mesomorph;

  // Calorie distribution
  const proteinCalories = tdee * ratio.protein;
  const carbsCalories = tdee * ratio.carbs;
  const fatsCalories = tdee * ratio.fats;

  return {
    daily_calorie_target: Math.round(tdee),
    daily_protein_target: Math.round(proteinCalories / CALORIES_PER_GRAM.protein),
    daily_carbs_target: Math.round(carbsCalories / CALORIES_PER_GRAM.carbs),
    daily_fats_target: Math.round(fatsCalories / CALORIES_PER_GRAM.fats),
  };
}

module.exports = { calculateTargets, calculateBMR };