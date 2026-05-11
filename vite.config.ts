import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Zizhi - AI Book Insights',
            short_name: 'Zizhi',
            description: 'AI-powered book insights and summaries',
            theme_color: '#fdf6e3',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true
          }
        }),
        {
          name: 'no-cache-plugin',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              res.setHeader('Surrogate-Control', 'no-store');
              next();
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        dedupe: ['react', 'react-dom', '@mantine/core', '@mantine/hooks'],
        alias: {
          '@': path.resolve(__dirname, '.'),
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        }
      }
    };
});
