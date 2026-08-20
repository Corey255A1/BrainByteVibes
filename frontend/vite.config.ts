import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BrainByte — Micro-Learning in Every Swipe',
        short_name: 'BrainByte',
        description: 'Bite-sized AI micro-learning articles and interactive mini-games to replace phone scrolling',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
});
