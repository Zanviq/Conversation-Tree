const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  // Set to true when the app is served over HTTPS
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  seedOnStart: process.env.SEED_ON_START !== 'false',
};
