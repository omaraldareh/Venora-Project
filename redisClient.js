const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  console.log(err);
});

(async () => {
  await redisClient.connect();
  console.log('Redis Connected');
})();

module.exports = redisClient;