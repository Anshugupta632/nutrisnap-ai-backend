const express = require('express');
const router = express.Router();
const { supabaseAuth, supabaseService } = require('../config/supabase');

/**
 * Helper to validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Email/password signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Input Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Create user with Supabase Auth Admin
    const { data: userData, error: createError } = await supabaseAuth.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    });

    if (createError) {
      if (createError.message.includes('already registered') || createError.status === 422) {
        return res.status(400).json({ success: false, error: 'This email is already registered' });
      }
      throw createError;
    }

    const userId = userData.user.id;

    // Create user profile row
    const { error: profileError } = await supabaseService
      .from('users')
      .upsert(
        {
          id: userId,
          email: trimmedEmail,
          first_name: first_name || null,
          last_name: last_name || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Create avatar stats row
    const { error: avatarError } = await supabaseService
      .from('avatar_stats')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

    if (avatarError) {
      console.error('Avatar stats creation error:', avatarError);
    }

    // Admin createUser does not return an active session token.
    // Authenticate the user immediately to issue access and refresh tokens.
    const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (sessionError) {
      return res.status(201).json({
        success: true,
        user: userData.user,
        session: null,
        message: 'User created successfully. Please log in.',
      });
    }

    return res.status(201).json({
      success: true,
      user: sessionData.user,
      session: sessionData.session,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error during signup' });
  }
});

// Email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const userId = data.user.id;
    const userMeta = data.user.user_metadata || {};

    // Ensure user profile exists
    await supabaseService
      .from('users')
      .upsert(
        {
          id: userId,
          email: trimmedEmail,
          first_name: userMeta.first_name,
          last_name: userMeta.last_name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    // Ensure avatar stats entry exists
    await supabaseService
      .from('avatar_stats')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

    return res.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error during login' });
  }
});

// Token refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ success: false, error: 'Refresh token is required' });
    }

    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({ success: false, error: error.message || 'Invalid or expired refresh token' });
    }

    return res.json({ success: true, session: data.session });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error during refresh' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await supabaseAuth.auth.signOut(token);
    }
  } catch (err) {
    console.warn('Supabase signout warning:', err.message);
  }

  return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
