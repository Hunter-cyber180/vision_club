const Redis = require("ioredis");
const configs = require("./configs");

class MemoryStore {
  constructor() {
    this.store = new Map(); // key -> { value, expiresAt }
  }
  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  async set(key, value, mode, ttlSeconds) {
    const expiresAt = mode === "EX" && ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }
  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }
}

function buildIoredisClient() {
  const opts = { maxRetriesPerRequest: 1, lazyConnect: true, retryStrategy: () => null };
  if (configs.redis.uri) return new Redis(configs.redis.uri, opts);
  return new Redis({ host: configs.redis.host, port: configs.redis.port, password: configs.redis.password, ...opts });
}

let resolvedClient = null; // بعد از init، همیشه همینه — دیگه هیچ‌وقت عوض نمی‌شه

async function initRedis() {
  const candidate = buildIoredisClient();
  candidate.on("error", () => {});
  try {
    await candidate.connect();
    await candidate.ping();
    console.log("✅ Redis connected — refresh token ها روی Redis واقعی ذخیره می‌شن.");
    resolvedClient = candidate;
  } catch (error) {
    candidate.disconnect();
    console.warn("============================================================");
    console.warn("⚠️  اتصال به Redis برقرار نشد (" + error.message + ")");
    console.warn("   به‌جای Redis، از یک حافظه‌ی داخلی موقت (in-memory) استفاده می‌شه.");
    console.warn("   لاگین/رفرش‌توکن همچنان کار می‌کنه، فقط با ری‌استارت سرور");
    console.warn("   سشن‌ها پاک می‌شن و بین چند سرور به اشتراک گذاشته نمی‌شن.");
    console.warn("   برای رفعش: مطمئن شو Redis واقعاً روی همون آدرس/پورتی که");
    console.warn("   در .env گذاشتی (REDIS_URI یا REDIS_HOST/REDIS_PORT) در حال اجراست.");
    console.warn("============================================================");
    resolvedClient = new MemoryStore();
  }
  return resolvedClient;
}

const client = {
  async get(key) {
    return resolvedClient.get(key);
  },
  async set(key, value, mode, ttlSeconds) {
    return resolvedClient.set(key, value, mode, ttlSeconds);
  },
  async del(key) {
    return resolvedClient.del(key);
  },
};

module.exports = client;
module.exports.initRedis = initRedis;
