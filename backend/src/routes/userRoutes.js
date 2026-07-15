const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { calculateTargets } = require('../services/somatotypeService');

// Profile setup - body type aur weight ke hisaab se targets calculate + save karo
router.post('/setup-profile', async (req, res) => {
  try {
    const { user_id, body_type, weight_kg } = req.body;

    if (!user_id || !body_type || !weight_kg) {
      return res.status(400).json({
        success: false,
        error: 'user_id, body_type aur weight_kg zaroori hai',
      });
    }

    const targets = calculateTargets(body_type, weight_kg);

    const { data, error } = await supabase
      .from('users')
      .update({
        body_type,
        weight_kg,
        ...targets,
      })
      .eq('id', user_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }

  // User ka profile complete hai ya nahi check karo
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
});

module.exports = router;