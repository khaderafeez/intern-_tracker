const { connectToDatabase } = require('./_db');
const {
  setSecurityHeaders,
  checkRateLimit,
  sanitizeInput,
  getClientIP
} = require('./_security');

module.exports = async (req, res) => {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);

  try {
    checkRateLimit(clientIP, 50, 60); // 50 requests per minute
  } catch (error) {
    res.setHeader('Retry-After', error.retryAfter || 60);
    return res.status(429).json({ error: error.message });
  }

  const { entries } = sanitizeInput(req.body);

  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: 'Entries must be an array' });
  }

  try {
    const { db } = await connectToDatabase();

    // Prepare entries for insertion
    const entriesToSave = entries.map(entry => ({
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
      timestamp: new Date(entry.timestamp || Date.now())
    }));

    // Replace all entries (bulk operation)
    await db.collection('entries').deleteMany({});
    if (entriesToSave.length > 0) {
      await db.collection('entries').insertMany(entriesToSave);
    }

    return res.status(200).json({
      success: true,
      message: `${entriesToSave.length} entries saved successfully`
    });
  } catch (error) {
    console.error('Save entries error:', error);
    return res.status(500).json({ error: 'Failed to save entries' });
  }
};
