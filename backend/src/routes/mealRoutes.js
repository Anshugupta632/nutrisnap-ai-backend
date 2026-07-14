const express = require('express');
const multer = require('multer');
const router = express.Router();
const { analyzeMealPhoto } = require('../services/visionService');
const supabase = require('../config/supabase');

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
    const fs = require('fs');
    fs.unlinkSync(filePath);

    res.json({ success: true, meal: mealData, items: nutritionData.items });
  } catch (error) {
    console.error('Meal logging error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;