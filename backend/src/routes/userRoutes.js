const express = require('express');
const router = express.Router();
const { supabaseService: supabase } = require('../config/supabase');
const { calculateTargets } = require('../services/somatotypeService');
const { generateMonthlyReport } = require('../services/pdfService');
const { authMiddleware } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Profile setup - calculate targets based on body type, weight, height, age, gender
router.post('/setup-profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { body_type, weight_kg, height_cm, age, gender } = req.body;

    if (!body_type || !weight_kg) {
      return res.status(400).json({
        success: false,
        error: 'body_type and weight_kg are required',
      });
    }

    // Height, age, gender optional but needed for better calculation
    const targets = calculateTargets(body_type, weight_kg, height_cm, age, gender);

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        body_type,
        weight_kg,
        height_cm,
        age,
        gender,
        ...targets,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if user profile is complete
router.get('/user', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get avatar current status
router.get('/avatar', async (req, res) => {
  try {
    const userId = req.user.id;

    let { data: avatar, error } = await supabase
      .from('avatar_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If avatar row doesn't exist, create default
    if (error && error.code === 'PGRST116') {
      const { data: newAvatar, error: createError } = await supabase
        .from('avatar_stats')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createError) throw createError;
      avatar = newAvatar;
    } else if (error) {
      throw error;
    }

    res.json({ success: true, avatar });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/monthly-report', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (userError) throw userError;

    // Get all meals for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startOfMonth.toISOString())
      .order('logged_at', { ascending: true });
    if (mealsError) throw mealsError;

    // Get avatar stats
    const { data: avatar } = await supabase
      .from('avatar_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Generate PDF and stream directly in response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=nutrisnap-report.pdf');

    const doc = generateMonthlyReport(user, meals, avatar);
    doc.pipe(res);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
