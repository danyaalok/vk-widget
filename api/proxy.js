const https = require('https');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = req.query.token || (req.body && req.body.token);
  if (!token) {
    res.status(400).json({ error: 'No token' });
    return;
  }

  const path = req.query.path || 'user/oauth';

  try {
    const data = await daRequest(path, token, req.method, req.body);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

function daRequest(path, token, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'www.donationalerts.com',
      path: `/api/v1/${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = https.request(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + data.slice(0, 100))); }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}
