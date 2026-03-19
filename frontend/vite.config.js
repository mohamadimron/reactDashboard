import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // biar bisa diakses network
    allowedHosts: [
                  'test2.tuman.web.id',
                  'apitest2.tuman.web.id'
    ]
  },   
})
