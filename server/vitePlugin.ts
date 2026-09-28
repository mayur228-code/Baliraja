import type { Plugin } from 'vite';
import app from './index.ts';

export function authApiPlugin(): Plugin {
  return {
    name: 'baliraja-auth-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(app);
    }
  };
}
