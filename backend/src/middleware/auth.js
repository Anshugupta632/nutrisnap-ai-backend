const { supabaseAuth } = require('../config/supabase');

/**
 * Verifies Supabase JWT and extracts authenticated user_id
 * Expects Bearer token in Authorization header
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization token missing. Please login and try again.' 
      });
    }

    const token = authHeader.split(' ')[1];

    if (!supabaseAuth) {
      console.error('supabaseAuth client not configured - SUPABASE_ANON_KEY missing');
      return res.status(500).json({ 
        success: false, 
        error: 'Auth service unavailable' 
      });
    }

    // Verify user with Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification failed:', error?.message);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token. Please login again.' 
      });
    }

    // Attach verified user_id to request
    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
}

/**
 * Optional auth - if token exists, verify it; otherwise allow anonymous
 * (For future use)
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || !supabaseAuth) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (!error && user) {
      req.user = { id: user.id, email: user.email };
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = { authMiddleware, optionalAuthMiddleware };