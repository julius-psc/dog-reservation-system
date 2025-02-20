import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Derive __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: path.resolve(__dirname, '../server/dist'), // Output to server/dist
    emptyOutDir: true // Clear the directory before building
  }
});