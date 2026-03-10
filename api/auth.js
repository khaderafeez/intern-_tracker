const { connectToDatabase } = require('./_db');
const { 
  setSecurityHeaders, 
  checkRateLimit, 
  sanitizeInput, 
  verifyPassword, 
  hashPassword,
  validateEmail,
  validatePIN,
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
    checkRateLimit(clientIP, 5, 300); // 5 attempts per 5 minutes
  } catch (error) {
    res.setHeader('Retry-After', error.retryAfter || 300);
    return res.status(429).json({ error: error.message });
  }

  const { password, type, email, pin } = sanitizeInput(req.body);

  if (!password) {
    return res.status(400).json({ success: false, error: 'Password required' });
  }

  try {
    const { db } = await connectToDatabase();

    if (type === 'admin') {
      // Admin authentication
      let config = await db.collection('config').findOne({ type: 'admin' });
      
      if (!config) {
        // First time setup - use default password
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'K8@dS5Lp';
        
        if (password === defaultPassword) {
          const hashedPassword = await hashPassword(password);
          await db.collection('config').insertOne({
            type: 'admin',
            password: hashedPassword,
            createdAt: new Date()
          });
          
          await logSecurityEvent(db, 'admin_login_success', {
            ip: clientIP,
            first_time: true
          });
          
          return res.status(200).json({
            success: true,
            role: 'admin',
            first_time: true
          });
        } else {
          await logSecurityEvent(db, 'admin_login_failed', {
            ip: clientIP,
            reason: 'wrong_password'
          });
          return res.status(401).json({ success: false, error: 'Incorrect password' });
        }
      }

      // Verify password
      const isValid = await verifyPassword(password, config.password);
      
      if (isValid) {
        await logSecurityEvent(db, 'admin_login_success', { ip: clientIP });
        return res.status(200).json({ success: true, role: 'admin' });
      } else {
        await logSecurityEvent(db, 'admin_login_failed', {
          ip: clientIP,
          reason: 'wrong_password'
        });
        return res.status(401).json({ success: false, error: 'Incorrect password' });
      }
    } else if (type === 'intern') {
      // Intern authentication
      if (!email || !pin) {
        return res.status(400).json({
          success: false,
          error: 'Email and PIN required'
        });
      }

      if (!validateEmail(email) || !validatePIN(pin)) {
        await logSecurityEvent(db, 'intern_login_failed', {
          ip: clientIP,
          reason: 'invalid_format'
        });
        return res.status(400).json({
          success: false,
          error: 'Invalid email or PIN format'
        });
      }

      // Find user by email and PIN
      const user = await db.collection('users').findOne({
        email: email.toLowerCase(),
        pin: pin
      });

      if (user) {
        await logSecurityEvent(db, 'intern_login_success', {
          ip: clientIP,
          userId: user.id
        });
        return res.status(200).json({
          success: true,
          role: 'intern',
          userId: user.id,
          name: user.name,
          department: user.department
        });
      } else {
        await logSecurityEvent(db, 'intern_login_failed', {
          ip: clientIP,
          reason: 'invalid_credentials'
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid email or PIN'
        });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Invalid type' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
