import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'cosmic-chat-data');

// Custom plugin to handle API requests
function storageApiPlugin() {
  return {
    name: 'storage-api',
    configResolved() {
      // Ensure data directory exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Created data directory:', DATA_DIR);
      }
    },
    configureServer(server: any) {
      return () => {
        server.middlewares.use('/api/storage/', (req: any, res: any, next: any) => {
          const urlPath = req.url.split('?')[0].replace(/^\/api\/storage\//, '');
          const filePath = path.join(DATA_DIR, urlPath);

          if (req.method === 'GET') {
            console.log('📖 Reading:', filePath);
            try {
              if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, data: content }));
                console.log('✅ Read success:', filePath);
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, data: null }));
                console.log('ℹ️  File not found:', filePath);
              }
            } catch (e: any) {
              console.error('❌ Read error:', e.message);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              console.log('💾 Writing:', filePath);
              try {
                const { content } = JSON.parse(body);
                
                // Ensure directory exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(filePath, content, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
                console.log('✅ Write success:', filePath);
              } catch (e: any) {
                console.error('❌ Write error:', e.message);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
          } else {
            next();
          }
        });
      };
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        storageApiPlugin(),
        react()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
