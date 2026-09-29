import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('[BUILD_SERVER] Bundling serverless entrypoint api/index.js from server/index.ts...');

esbuild.buildSync({
  entryPoints: [path.join(rootDir, 'server/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  packages: 'external',
  outfile: path.join(rootDir, 'api/index.js'),
  logLevel: 'info',
});

console.log('[BUILD_SERVER] Successfully built self-contained api/index.js for Vercel Serverless');
