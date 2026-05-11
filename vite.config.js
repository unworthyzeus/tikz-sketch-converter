import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          if (
            id.includes('/src/tikzPaletteItems') ||
            id.includes('/src/tikzLibraryPresets') ||
            id.includes('/src/librarySnippetConfig') ||
            id.includes('/src/libraryObjectProfiles')
          ) {
            return 'tikz-catalog'
          }
          if (id.includes('/src/latexSymbols')) return 'latex-symbols'
        },
      },
    },
  },
})
