import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  startingBalance: Number(process.env.STARTING_BALANCE ?? 1000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientDir: process.env.CLIENT_DIR ?? '../client/dist',
};

export const isProd = env.nodeEnv === 'production';

if (isProd && env.jwtSecret === 'dev-insecure-secret-change-me') {
  console.warn('[security] JWT_SECRET is using the insecure default in production!');
}
