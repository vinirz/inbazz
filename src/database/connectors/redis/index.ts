import Redis from 'ioredis';
import environment from '../../../common/environment';

const redis = new Redis({
  host: environment.REDIS_HOST,
  port: environment.REDIS_PORT,
  password: environment.REDIS_PASSWORD,
  family: 4,
});

export default redis;
