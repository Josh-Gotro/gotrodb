const crypto = require('crypto');

/**
 * API key middleware, parameterized by env var so different machine clients
 * hold different keys:
 *   apiKeyAuth('DISCOBARD_OAUTH_BRIDGE_API_KEY')  — discobard bridge
 *   apiKeyAuth('SPOTIFY_MCP_API_KEY')             — spotify-mcp token reads
 *
 * Called with no argument it defaults to the discobard key, so existing
 * call sites keep working.
 */
function apiKeyAuth(envVar = 'DISCOBARD_OAUTH_BRIDGE_API_KEY') {
  return function (req, res, next) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const expected = process.env[envVar];
    if (!expected) {
      console.error(`${envVar} is not configured`);
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
  };
}

module.exports = apiKeyAuth;
