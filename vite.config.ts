/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'

export default defineConfig({
  plugins: [
    svgr({ include: '**/*.svg?react', svgrOptions: { icon: true, svgo: true } }),
    react(),
    tailwindcss(),
  ],
  // Bind to the port the launcher assigns via the PORT env var (autoPort),
  // falling back to 5200 for a plain `npm run dev`. `strictPort` fails fast
  // rather than silently rolling to a higher port (which made the Claude
  // Preview tool hit the wrong app's URL).
  //
  // One port per dashboard, and they must all differ:
  //   5180  Common LMS   (jill-dashboard-ux-designs)
  //   5190  PartnerHub   (partnerhub-ux-dashboard)
  //   5200  XCEL         (this repo)
  //
  // Do not "align" them. Every one of these repos sets strictPort, so two sharing
  // a port means whichever starts second dies with EADDRINUSE while the browser
  // keeps serving the first. Because all three dashboards look alike, that reads
  // as "the new dashboard is showing the old project's rows" rather than as a
  // port error — and the error is above the prompt where it is easy to miss.
  // This exact confusion cost real time on the PartnerHub port. Running two or
  // three side by side is the normal case when porting a change between them.
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5200,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Never pick up test files inside git worktrees / deps. Leftover
    // `.claude/worktrees/*` copies (from isolated agent runs) carry stale,
    // provider-less test files that fail on their own and pollute runs.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
})
