import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to handle Netlify requirements without needing physical files in source
const netlifyConfig = () => {
  return {
    name: 'netlify-config',
    closeBundle: async () => {
      const distDir = path.resolve('dist')
      
      if (!fs.existsSync(distDir)) return;

      // 1. Generate _redirects for SPA routing
      console.log('Generating _redirects file...');
      fs.writeFileSync(
        path.join(distDir, '_redirects'),
        '/* /index.html 200'
      );

      // 2. Copy root assets (manifest & SW) to dist
      // We look for them in the ROOT directory
      const filesToCopy = ['manifest.json', 'service-worker.js'];
      filesToCopy.forEach(file => {
        const src = path.resolve(file);
        const dest = path.join(distDir, file);
        if (fs.existsSync(src)) {
          console.log(`Copying ${file} to dist...`);
          fs.copyFileSync(src, dest);
        } else {
          console.warn(`Warning: Could not find ${file} in root to copy.`);
        }
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), netlifyConfig()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})