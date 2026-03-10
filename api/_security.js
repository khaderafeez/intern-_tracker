const bcrypt = require('bcryptjs');

// Rate limiting cache (in-memory for serverless)
const rateLimitCache = new Map();

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitCache.entries()) {
    if (now - data.lastClean > 300000) { // 5 minutes
      rateLimitCache.delete(key);
    }
  }
}, 300000);

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

function checkRateLimit(identifier, maxRequests = 20, timeWindowSeconds = 60) {
  const key = identifier;
  const now = Date.now();
  const timeWindow = timeWindowSeconds * 1000;

  if (!rateLimitCache.has(key)) {
    rateLimitCache.set(key, { attempts: [], lastClean: now });
  }

  const data = rateLimitCache.get(key);
  
  // Filter attempts within time window
  data.attempts = data.attempts.filter(timestamp => (now - timestamp) < timeWindow);

  if (data.attempts.length >= maxRequests) {
    const error = new Error('Too many requests. Please try again later.');
    error.statusCode = 429;
    error.retryAfter = timeWindowSeconds;
    throw error;
  }

  data.attempts.push(now);
  rateLimitCache.set(key, data);
}

function sanitizeInput(data) {
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  if (typeof data === 'string') {
    return data.trim().replace(/<[^>]*>/g, '');
  }
  return data;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePIN(pin) {
  return /^[0-9]{4}$/.test(pin);
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         'unknown';
}

async function logSecurityEvent(db, event, details = {}) {
  try {
    await db.collection('security_logs').insertOne({
      event,
      details,
      timestamp: new Date(),
      ip: details.ip || 'unknown'
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

module.exports = {
  setSecurityHeaders,
  checkRateLimit,
  sanitizeInput,
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePIN,
  getClientIP,
  logSecurityEvent
};
