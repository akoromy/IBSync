// Minimal production server: serves the built app + the AI proxy.
// Deploy on Tencent Cloud Lighthouse / CVM / CloudBase Run:
//   npm run build && AI_API_KEY=xxx PORT=8080 node server/index.js
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { aiMiddleware } from './aiHandler.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' }
const ai = aiMiddleware()

http.createServer((req, res) => {
  ai(req, res, async () => {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
    let file = join(root, path)
    try {
      if (!file.startsWith(root) || !extname(file)) file = join(root, 'index.html')
      const body = await readFile(file)
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
      res.end(body)
    } catch {
      res.setHeader('Content-Type', 'text/html')
      res.end(await readFile(join(root, 'index.html')))
    }
  })
}).listen(process.env.PORT || 8080, () => console.log(`IBSync on :${process.env.PORT || 8080}`))
