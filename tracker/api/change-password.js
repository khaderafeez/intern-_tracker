const { connectToDatabase } = require('./_db');
const {
  setSecurityHeaders,
  checkRateLimit,
  sanitizeInput,
  verifyPassword,
  hashPassword,
  getClientIP,
  logSecurityEvent
} = require('./_security');

module.exports = async (req, res) => {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);

  try {
    checkRateLimit(clientIP, 3, 600); // 3 attempts per 10 minutes
  } catch (error) {
    res.setHeader('Retry-After', error.retryAfter || 600);
    return res.status(429).json({ error: error.message });
  }

  const { currentPassword, newPassword } = sanitizeInput(req.body);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Both passwords are required'
    });
  }

  // Enforce strong password
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters'
    });
  }

  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain both letters and numbers'
    });
  }

  try {
    const { db } = await connectToDatabase();
    const config = await db.collection('config').findOne({ type: 'admin' });

    if (!config) {
      // No config exists, verify against default
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'K8@dS5Lp';
      if (currentPassword !== defaultPassword) {
        await logSecurityEvent(db, 'password_change_failed', {
          ip: clientIP,
          reason: 'wrong_current_password'
        });
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
    } else {
      // Verify current password
      const isValid = await verifyPassword(currentPassword, config.password);
      if (!isValid) {
        await logSecurityEvent(db, 'password_change_failed', {
          ip: clientIP,
          reason: 'wrong_current_password'
        });
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(newPassword);
    await db.collection('config').updateOne(
      { type: 'admin' },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    await logSecurityEvent(db, 'password_changed_success', { ip: clientIP });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please login again with your new password.'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
