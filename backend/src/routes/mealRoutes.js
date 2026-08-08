const express = require('express');
const multer = require('multer');
const fs = require('fs');
const router = express.Router();
const { analyzeMealPhoto } = require('../services/visionService');
const { supabaseAuth: supabase } = require('../config/supabase');
const { updateAvatarAfterMeal } = require('../services/avatarService');
const { scanIngredientLabel } = require('../services/sugarScannerService');
const { authMiddleware } = require('../middleware/auth');

// Multer setup - photo temporarily saved to 'uploads' folder
const upload = multer({ dest: 'uploads/' });

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/log-meal', upload.single('photo'), async (req, res) => {
  let mealId = null;
  let filePath = null;
  const userId = req.user.id; // Verified user_id from JWT

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Photo not found in request' });
    }

    const { meal_type } = req.body;

    if (!meal_type) {
      return res.status(400).json({ success: false, error: 'meal_type is required' });
    }

    // Validate meal_type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal_type)) {
      return res.status(400).json({ success: false, error: 'Invalid meal_type' });
    }

    // Get nutrition analysis from Gemini
    filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const nutritionData = await analyzeMealPhoto(filePath, mimeType);

    // Save meal to database
    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        meal_type,
        log_method: 'photo',
        total_calories: nutritionData.total_calories,
        total_protein: nutritionData.total_protein,
        total_carbs: nutritionData.total_carbs,
        total_fats: nutritionData.total_fats,
      })
      .select()
      .single();

    if (mealError) throw mealError;

    mealId = mealData.id;

    // Save individual items to meal_items table
    const itemsToInsert = nutritionData.items.map((item) => ({
      meal_id: mealData.id,
      item_name: item.name,
      quantity: item.quantity,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
      confidence_level: item.confidence_level,
    }));

    const { error: itemsError } = await supabase.from('meal_items').insert(itemsToInsert);

    if (itemsError) {
      // Rollback: delete the meal if items insert fails
      await supabase.from('meals').delete().eq('id', mealId);
      throw itemsError;
    }

    // Delete temp photo file (no longer needed)
    fs.unlinkSync(filePath);
    filePath = null;

    // Update avatar stats based on protein intake
    const avatarStats = await updateAvatarAfterMeal(userId);

    res.json({ success: true, meal: mealData, items: nutritionData.items, avatar: avatarStats });
  } catch (error) {
    console.error('Meal logging error:', error);
    // Cleanup temp file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ success: false, error: error.message });
  }
  
});

// Get today's meal totals
router.get('/today-summary', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get today's date range (midnight to now)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: meals, error } = await supabase
      .from('meals')
      .select('total_calories, total_protein, total_carbs, total_fats')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay.toISOString());

    if (error) throw error;

    // Get user's targets
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('daily_protein_target, daily_calorie_target, daily_carbs_target, daily_fats_target')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Sum all meals
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + Number(meal.total_calories),
        protein: acc.protein + Number(meal.total_protein),
        carbs: acc.carbs + Number(meal.total_carbs),
        fats: acc.fats + Number(meal.total_fats),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Default targets if user hasn't set them (will come from Somatotype engine later)
    const proteinTarget = user.daily_protein_target || 100;
    const carbsTarget = user.daily_calorie_target || 250;
    const fatsTarget = user.daily_fats_target || 65;

    res.json({
      success: true,
      totals,
      percentages: {
        protein: Math.round((totals.protein / proteinTarget) * 100),
        carbs: Math.round((totals.carbs / carbsTarget) * 100),
        fats: Math.round((totals.fats / fatsTarget) * 100),
      },
    });
  } catch (error) {
    console.error('Today summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scan-label', upload.single('photo'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Photo not found in request' });
    }

    filePath = req.file.path;
    const mimeType = req.file.mimetype;

    const result = await scanIngredientLabel(filePath, mimeType);

    fs.unlinkSync(filePath);
    filePath = null;

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Label scan error:', error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Meal history endpoint - get all user meals
router.get('/meal-history', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: meals, error } = await supabase
      .from('meals')
      .select('*, meal_items(*)')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ success: true, meals });
  } catch (error) {
    console.error('Meal history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
