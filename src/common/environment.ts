import dotenv from 'dotenv';
import path from 'path';

let projectRoot = process.cwd();
if (projectRoot.includes('workers')) {
  projectRoot = path.resolve(__dirname, '../../');
}

dotenv.config({ path: path.join(projectRoot, '.env') });

interface EnvSchema {
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;

  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;

  QUEUE_REDIS_HOST: string;
  QUEUE_REDIS_PORT: number;
  QUEUE_REDIS_PASSWORD: string;
}

const environment = {
  DATABASE_HOST: process.env.DATABASE_HOST,
  DATABASE_PORT: Number(process.env.DATABASE_PORT),
  DATABASE_NAME: process.env.DATABASE_NAME,
  DATABASE_USER: process.env.DATABASE_USER,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,

  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: Number(process.env.REDIS_PORT),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  QUEUE_REDIS_HOST: process.env.QUEUE_REDIS_HOST,
  QUEUE_REDIS_PORT: Number(process.env.QUEUE_REDIS_PORT),
  QUEUE_REDIS_PASSWORD: process.env.QUEUE_REDIS_PASSWORD,
} as EnvSchema;

export function loadEnviromentVariables() {
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) {
      throw new Error(`Environment variable "${key}" is not defined`);
    }
  }
}

export default environment;
