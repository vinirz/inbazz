import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';
import environment from './src/common/environment';

export default defineConfig({
  out: './src/database/migrations',
  schema: './src/database/schema/*',
  dialect: 'postgresql',
  verbose: true,
  migrations: {
    prefix: 'timestamp',
  },
  dbCredentials: {
    host: environment.DATABASE_HOST,
    port: Number(environment.DATABASE_PORT),
    database: environment.DATABASE_NAME,
    user: environment.DATABASE_USER,
    password: environment.DATABASE_PASSWORD,
    ssl: false,
  },
});
