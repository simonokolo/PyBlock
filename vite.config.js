import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        workspace: resolve(__dirname, 'pages/workspace.html'),
        'account-settings': resolve(__dirname, 'pages/account-settings.html')
      }
    }
  }
})
