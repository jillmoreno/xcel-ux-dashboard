import base from '../vite.config'
import { mergeConfig } from 'vite'
import path from 'node:path'
export default mergeConfig(base, {
  base: './',
  build: { outDir: '/sessions/youthful-kind-maxwell/mnt/outputs/audit-dist', emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, 'index.html') } },
})
