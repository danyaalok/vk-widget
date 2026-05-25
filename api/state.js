// API endpoint to get/set current playing state via Upstash Redis

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCommand(...args) {
  const res = await fetch(`${REDIS_URL}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });
  return res.json();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // GET — return current state
  if (req.method === 'GET') {
    try {
      const result = await redisCommand('GET', 'vk_player_state');
      const state = result.result ? JSON.parse(result.result) : { current: null, queue: [] };
      res.status(200).json(state);
    } catch(e) {
      res.status(200).json({ current: null, queue: [] });
    }
    return;
  }

  // POST — update state
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await redisCommand('SET', 'vk_player_state', JSON.stringify(body), 'EX', '86400');
      res.status(200).json({ ok: true });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).end();
};
