const express = require('express');
const multer = require('multer');
const router = express.Router();
const { analyzeMealPhoto } = require('../services/visionService');
const supabase = require('../config/supabase');
const { updateAvatarAfterMeal } = require('../services/avatarService');

// Multer setup - photo ko 'uploads' folder mein temporarily save karega
const upload = multer({ dest: 'uploads/' });

router.post('/log-meal', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Photo nahi mili request mein' });
    }

    const { user_id, meal_type } = req.body;

    if (!user_id || !meal_type) {
      return res.status(400).json({ success: false, error: 'user_id aur meal_type zaroori hai' });
    }

    // Gemini se nutrition analysis karwao
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const nutritionData = await analyzeMealPhoto(filePath, mimeType);

    // Meal ko database mein save karo
    const { data: mealData, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id,
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

    // Individual items ko meal_items table mein save karo
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

    if (itemsError) throw itemsError;

    // Temp photo file delete kar do (ab zaroorat nahi)
    // Temp photo file delete kar do (ab zaroorat nahi)
    const fs = require('fs');
    fs.unlinkSync(filePath);

    // Avatar stats update karo protein intake ke hisaab se
    const avatarStats = await updateAvatarAfterMeal(user_id);

    res.json({ success: true, meal: mealData, items: nutritionData.items, avatar: avatarStats });
  } catch (error) {
    console.error('Meal logging error:', error);
    res.status(500).json({ success: false, error: error.message });
  }

  
});

// Aaj ke saare meals ka total nikalne ke liye
router.get('/today-summary/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Aaj ki date range nikalo (midnight se ab tak)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: meals, error } = await supabase
      .from('meals')
      .select('total_calories, total_protein, total_carbs, total_fats')
      .eq('user_id', user_id)
      .gte('logged_at', startOfDay.toISOString());

    if (error) throw error;

    // User ka target bhi nikalo
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('daily_protein_target, daily_calorie_target, daily_carbs_target, daily_fats_target')
      .eq('id', user_id)
      .single();

    if (userError) throw userError;

    // Saare meals ka sum karo
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + Number(meal.total_calories),
        protein: acc.protein + Number(meal.total_protein),
        carbs: acc.carbs + Number(meal.total_carbs),
        fats: acc.fats + Number(meal.total_fats),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Default targets agar user ne set nahi kiye (baad mein Somatotype engine se aayenge)
    const proteinTarget = user.daily_protein_target || 100;
    const carbsTarget = user.daily_carbs_target || 250;
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

module.exports = router;