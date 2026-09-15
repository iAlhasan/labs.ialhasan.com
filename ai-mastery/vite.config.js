import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// The build output lands in Hugo's `static/` folder, so `hugo` copies it
// verbatim to `public/ai-mastery/` and Netlify serves it at /ai-mastery/
// without any change to the existing build command.
export default defineConfig({
  base: '/ai-mastery/',
  plugins: [tailwindcss()],
  build: {
    outDir: '../static/ai-mastery',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
