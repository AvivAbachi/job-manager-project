import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'http://localhost:3000'

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
    ],
    server: {
      proxy: { '/api/auth': { target }, '/job': { target } },
    },
    preview: {
      proxy: { '/api/auth': { target }, '/job': { target } },
    },
  }
})

export default config
