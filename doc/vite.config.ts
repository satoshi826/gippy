import {defineConfig} from 'vite'
import {visualizer} from 'rollup-plugin-visualizer'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base   : process.env.GITHUB_ACTIONS ? '/glaku/' : '/',
  plugins: [
    react(),
    visualizer()
  ],
  worker: {
    format: 'es'
  }
})
