import { drizzle } from 'drizzle-orm/node-postgres';
import environment from '../../../common/environment';
import schema from '../../schema';

const db = drizzle({
  connection: {
    host: environment.DATABASE_HOST,
    port: environment.DATABASE_PORT,
    user: environment.DATABASE_USER,
    password: environment.DATABASE_PASSWORD,
    database: environment.DATABASE_NAME,
    ssl: false,
  },
  schema,
});

export default db;
