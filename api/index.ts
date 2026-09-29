import app from '../server/index';

/**
 * Vercel Serverless Function entrypoint for Baliraja API.
 * Delegates all /api/* requests directly to Express router.
 */
export default app;
