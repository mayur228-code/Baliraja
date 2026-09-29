import type { Plugin } from 'vite';

export function authApiPlugin(): Plugin {
  return {
    name: 'baliraja-auth-api',
    apply: 'serve',
    async configureServer(server) {
      const { default: app } = await import('./index');
      server.middlewares.use(app);
    }
  };
}
