const { connectToDatabase } = require('./_db');
const { setSecurityHeaders, checkRateLimit, getClientIP } = require('./_security');

module.exports = async (req, res) => {
  setSecurityHeaders(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);

  try {
    checkRateLimit(clientIP, 100, 60); // 100 requests per minute
  } catch (error) {
    res.setHeader('Retry-After', error.retryAfter || 60);
    return res.status(429).json({ error: error.message });
  }

  try {
    const { db } = await connectToDatabase();
    const users = await db.collection('users').find({}).toArray();

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      pin: user.pin,
      created: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString()
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Load users error:', error);
    return res.status(500).json({ error: 'Failed to load users' });
  }
};
