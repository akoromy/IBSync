import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { aiMiddleware } from './server/aiHandler.js'

// Mounts the AI proxy (/api/ai) on the dev and preview servers so the key
// stays server-side. Put AI_API_KEY etc. in a .env file (see .env.example).
function aiProxy(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['AI_API_KEY', 'HUNYUAN_API_KEY', 'AI_BASE_URL', 'AI_MODEL']) if (env[k]) process.env[k] = env[k]
  return {
    name: 'ibsync-ai-proxy',
    configureServer(server) { server.middlewares.use(aiMiddleware()) },
    configurePreviewServer(server) { server.middlewares.use(aiMiddleware()) },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), aiProxy(mode)],
  server: { host: true, port: 5173 },
}))
