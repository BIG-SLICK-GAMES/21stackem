const dotenv = require('dotenv');

dotenv.config();

const requiredEnv = ['PORT', 'MONGO_URI', 'REDIS_HOST', 'REDIS_PORT', 'APP_ENV', 'GAME_ID'];
const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

function buildRedisUrl() {
  return `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
}

module.exports = {
  appEnv: process.env.APP_ENV,
  commonApiBaseUrl: process.env.COMMON_API_BASE_URL || '',
  gameId: process.env.GAME_ID,
  mongoDbUri: process.env.MONGO_URI,
  port: Number(process.env.PORT),
  redisUrl: buildRedisUrl(),
};
