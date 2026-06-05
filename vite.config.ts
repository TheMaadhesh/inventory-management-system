import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
    }),
    tailwindcss(),
  ],
  server: {
    port: 5073,
    host: true,
  },
})
