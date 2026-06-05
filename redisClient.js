const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    // يرسل إشارة "Ping" كل 30 ثانية لمنع السيرفر من إغلاق الاتصال فجأة
    pingInterval: 30000,
    // وظيفة لإعادة الاتصال تلقائياً في حال انقطع السيرفر
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis connection lost. Retrying in ${delay}ms...`);
      return delay;
    }
  }
});

// التعامل مع الأخطاء بدون ما ينهار السيرفر
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
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