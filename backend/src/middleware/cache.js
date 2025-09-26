import logger from '../utils/logger.js';

// In-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = {
  dashboard_stats: 5 * 60 * 1000, // 5 minutes
  tool_list: 10 * 60 * 1000, // 10 minutes
  user_list: 2 * 60 * 1000, // 2 minutes
  audit_logs: 1 * 60 * 1000, // 1 minute
  default: 5 * 60 * 1000 // 5 minutes
};

// Cache middleware factory
export function createCacheMiddleware(cacheKey, ttl = null) {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if explicitly disabled
    if (req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
    const cacheTTL = ttl || CACHE_TTL[key] || CACHE_TTL.default;
    
    const cached = cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < cacheTTL) {
      logger.debug(`Cache hit for key: ${key}`);
      return res.json(cached.data);
    }

    // Store the original res.json function
    const originalJson = res.json;

    // Override res.json to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
        logger.debug(`Cached response for key: ${key}`);
      }

      // Call the original json function
      return originalJson.call(this, data);
    };

    next();
  };
}

// Clear specific cache key
export function clearCache(key) {
  if (cache.has(key)) {
    cache.delete(key);
    logger.debug(`Cleared cache for key: ${key}`);
    return true;
  }
  return false;
}

// Clear all cache
export function clearAllCache() {
  const size = cache.size;
  cache.clear();
  logger.info(`Cleared all cache (${size} entries)`);
  return size;
}

// Get cache statistics
export function getCacheStats() {
  const entries = Array.from(cache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp,
    size: JSON.stringify(value.data).length
  }));

  return {
    totalEntries: cache.size,
    totalMemory: entries.reduce((sum, entry) => sum + entry.size, 0),
    entries: entries.sort((a, b) => b.age - a.age)
  };
}

// Cleanup expired entries
export function cleanupExpiredCache() {
  let cleaned = 0;
  const now = Date.now();

  for (const [key, value] of cache.entries()) {
    const ttl = CACHE_TTL[key] || CACHE_TTL.default;
    if ((now - value.timestamp) > ttl) {
      cache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} expired cache entries`);
  }

  return cleaned;
}

// Auto cleanup every 10 minutes
setInterval(cleanupExpiredCache, 10 * 60 * 1000);

export default {
  createCacheMiddleware,
  clearCache,
  clearAllCache,
  getCacheStats,
  cleanupExpiredCache
};
