const crypto = require('crypto');

function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const expected = process.env.DISCOBARD_API_KEY;
  if (!expected) {
    console.error('DISCOBARD_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const apiKeyBuffer = Buffer.from(apiKey);
  const expectedBuffer = Buffer.from(expected);

  if (
    apiKeyBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(apiKeyBuffer, expectedBuffer)
  ) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = apiKeyAuth;
