const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    pingInterval: 30000,
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis connection lost. Retrying in ${delay}ms...`);
      return delay;
    }
  }
});


redisClient.on('error', (err) => {
  console.error('FULL REDIS ERROR');
  console.error(err);
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready and Connected!');
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Initial Redis connection failed:', err);
  }
})();

module.exports = redisClient;