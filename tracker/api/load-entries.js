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
    const entries = await db.collection('entries').find({}).toArray();

    // Format entries for frontend
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      userId: entry.userId,
      name: entry.name,
      department: entry.department,
      date: entry.date,
      project: entry.project || '',
      hoursWorked: entry.hoursWorked || '',
      tasksCompleted: entry.tasksCompleted || '',
      challenges: entry.challenges || '',
      planForTomorrow: entry.planForTomorrow || '',
      timestamp: entry.timestamp ? entry.timestamp.toISOString() : new Date().toISOString()
    }));

    return res.status(200).json(formattedEntries);
  } catch (error) {
    console.error('Load entries error:', error);
    return res.status(500).json({ error: 'Failed to load entries' });
  }
};
