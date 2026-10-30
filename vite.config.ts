import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Keep the libraries' licence notices in the built scripts, as their licences ask.
  build: { rolldownOptions: { output: { comments: { legal: true } } } },
})
