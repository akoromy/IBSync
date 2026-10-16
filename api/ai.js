// Vercel / serverless entry for the AI proxy (optional deployment target).
// Routes: POST /api/ai  and  GET /api/ai?health=1  (rewritten from /api/ai/health)
import { complete, health, allow } from '../server/aiHandler.js'

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json(health())
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (!allow(ip)) return res.status(429).json({ error: 'Too many AI requests, try again later' })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    res.status(200).json(await complete(body || {}))
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message })
  }
}
