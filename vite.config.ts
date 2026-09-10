import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'build-extension-scripts',
      async closeBundle() {
        // Compile background service worker to dist and root
        await esbuild.build({
          entryPoints: [resolve(__dirname, 'src/background/index.ts')],
          outfile: resolve(__dirname, 'dist/background.js'),
          bundle: true,
          format: 'esm',
          target: 'es2022',
          minify: false,
          sourcemap: false,
        });
        fs.copyFileSync(
          resolve(__dirname, 'dist/background.js'),
          resolve(__dirname, 'background.js')
        );

        // Compile content script as IIFE to dist and root
        await esbuild.build({
          entryPoints: [resolve(__dirname, 'src/content-script/index.ts')],
          outfile: resolve(__dirname, 'dist/content-script.js'),
          bundle: true,
          format: 'iife',
          target: 'es2022',
          minify: false,
          sourcemap: false,
        });
        fs.copyFileSync(
          resolve(__dirname, 'dist/content-script.js'),
          resolve(__dirname, 'content-script.js')
        );

        // Ensure popup.html and options.html exist at top level in dist and root with correct relative paths
        // and strip modulepreload tags which cause Chrome cross-world extension resource mismatch warnings
        const cleanHtml = (raw: string) =>
          raw
            .replaceAll('../../assets/', './assets/')
            .replace(/<link rel="modulepreload"[^>]*>\s*/gi, '');

        const distSrcPopup = resolve(__dirname, 'dist/src/popup/popup.html');
        const distPopup = resolve(__dirname, 'dist/popup.html');
        const rootPopup = resolve(__dirname, 'popup.html');

        if (fs.existsSync(distSrcPopup)) {
          const popupHtml = cleanHtml(fs.readFileSync(distSrcPopup, 'utf8'));
          fs.writeFileSync(distPopup, popupHtml);
          fs.writeFileSync(rootPopup, popupHtml);
        }

        const distSrcOptions = resolve(__dirname, 'dist/src/options/options.html');
        const distOptions = resolve(__dirname, 'dist/options.html');
        const rootOptions = resolve(__dirname, 'options.html');

        if (fs.existsSync(distSrcOptions)) {
          const optionsHtml = cleanHtml(fs.readFileSync(distSrcOptions, 'utf8'));
          fs.writeFileSync(distOptions, optionsHtml);
          fs.writeFileSync(rootOptions, optionsHtml);
        }

        // Copy manifest.json into dist
        fs.copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );

        // Copy icons to dist/icons and root icons
        const iconsDistDir = resolve(__dirname, 'dist/icons');
        const rootIconsDir = resolve(__dirname, 'icons');
        const srcIconsDir = resolve(__dirname, 'public/icons');

        if (!fs.existsSync(iconsDistDir)) fs.mkdirSync(iconsDistDir, { recursive: true });
        if (!fs.existsSync(rootIconsDir)) fs.mkdirSync(rootIconsDir, { recursive: true });

        if (fs.existsSync(srcIconsDir)) {
          const files = fs.readdirSync(srcIconsDir);
          for (const file of files) {
            fs.copyFileSync(resolve(srcIconsDir, file), resolve(iconsDistDir, file));
            fs.copyFileSync(resolve(srcIconsDir, file), resolve(rootIconsDir, file));
          }
        }

        // Copy dist/assets to root assets directory
        const distAssetsDir = resolve(__dirname, 'dist/assets');
        const rootAssetsDir = resolve(__dirname, 'assets');
        if (!fs.existsSync(rootAssetsDir)) fs.mkdirSync(rootAssetsDir, { recursive: true });

        if (fs.existsSync(distAssetsDir)) {
          const assetFiles = fs.readdirSync(distAssetsDir);
          for (const file of assetFiles) {
            fs.copyFileSync(resolve(distAssetsDir, file), resolve(rootAssetsDir, file));
          }
        }

        console.log('✓ Successfully synchronized extension to both root and dist directories.');
      },
    },
  ],
  build: {
    modulePreload: false,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
