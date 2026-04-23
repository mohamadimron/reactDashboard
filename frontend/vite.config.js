import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || '').split(',');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // biar bisa diakses network
      allowedHosts: allowedHosts.length > 0 && allowedHosts[0] !== '' ? allowedHosts : []
    },   
  }
})
