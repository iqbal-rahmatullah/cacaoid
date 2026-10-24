import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Ports 5173/8000 belong to the old cacaoid-app; this monorepo runs web on 5174 and api on 8001.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true, proxy: { '/api': 'http://localhost:8001' } },
})
