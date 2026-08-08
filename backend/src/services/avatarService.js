const { supabaseService: supabase } = require('../config/supabase');

async function updateAvatarAfterMeal(userId) {
  // Get user target and today's total
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('daily_protein_target')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select('total_protein')
    .eq('user_id', userId)
    .gte('logged_at', startOfDay.toISOString());

  if (mealsError) throw mealsError;

  const todayProtein = meals.reduce((sum, m) => sum + Number(m.total_protein), 0);
  const proteinTarget = user.daily_protein_target || 100;
  const hitTarget = todayProtein >= proteinTarget;

  // Get current avatar stats
  let { data: avatar, error: avatarError } = await supabase
    .from('avatar_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If avatar row doesn't exist, create one
  if (avatarError && avatarError.code === 'PGRST116') {
    const { data: newAvatar, error: createError } = await supabase
      .from('avatar_stats')
      .insert({ user_id: userId })
      .select()
      .single();
    if (createError) throw createError;
    avatar = newAvatar;
  } else if (avatarError) {
    throw avatarError;
  }

  let newStamina = avatar.stamina;
  let newStrength = avatar.strength_points;
  let deficitDays = avatar.protein_deficit_days;

  if (hitTarget) {
    // Target hit - stamina recovers, strength increases, deficit resets
    newStamina = Math.min(100, avatar.stamina + 10);
    newStrength = avatar.strength_points + 15;
    deficitDays = 0;
  } else {
    // Target missed - increase deficit count, decrease stamina
    deficitDays = avatar.protein_deficit_days + 1;
    newStamina = Math.max(0, avatar.stamina - 5);
  }

  const { data: updatedAvatar, error: updateError } = await supabase
    .from('avatar_stats')
    .update({
      stamina: newStamina,
      strength_points: newStrength,
      protein_deficit_days: deficitDays,
      last_updated: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) throw updateError;

  return updatedAvatar;
}

module.exports = { updateAvatarAfterMeal };
