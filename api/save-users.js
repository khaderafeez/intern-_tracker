const { connectToDatabase } = require('./_db');
const {
  setSecurityHeaders,
  checkRateLimit,
  sanitizeInput,
  validateEmail,
  validatePIN,
  getClientIP
} = require('./_security');

module.exports = async (req, res) => {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);

  try {
    checkRateLimit(clientIP, 30, 60); // 30 requests per minute
  } catch (error) {
    res.setHeader('Retry-After', error.retryAfter || 60);
    return res.status(429).json({ error: error.message });
  }

  const { users } = sanitizeInput(req.body);

  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Users must be an array' });
  }

  // Validate all users first
  for (const user of users) {
    if (!validateEmail(user.email)) {
      return res.status(400).json({
        error: `Invalid email format: ${user.email}`
      });
    }
    if (!validatePIN(user.pin)) {
      return res.status(400).json({
        error: `Invalid PIN format for ${user.email}. Must be 4 digits.`
      });
    }
  }

  try {
    const { db } = await connectToDatabase();

    // Prepare users for insertion
    const usersToSave = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      department: user.department,
      pin: user.pin,
      createdAt: new Date(user.created || Date.now())
    }));

    // Replace all users (bulk operation)
    await db.collection('users').deleteMany({});
    if (usersToSave.length > 0) {
      await db.collection('users').insertMany(usersToSave);
    }

    return res.status(200).json({
      success: true,
      message: `${usersToSave.length} users saved successfully`
    });
  } catch (error) {
    console.error('Save users error:', error);
    return res.status(500).json({ error: 'Failed to save users' });
  }
};
