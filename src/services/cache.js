// src/services/cache.js

/**
 * Simple in-memory cache for API responses
 * Reduces unnecessary API calls and improves performance
 */
class APICache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Get or fetch data with automatic caching
   */
  async get(key, fetcher, customTTL = null) {
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      const ttl = customTTL || this.ttl;

      if (Date.now() - timestamp < ttl) {
        return data;
      }

      // Expired, remove from cache
      this.cache.delete(key);
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // On error, return stale data if available
      if (this.cache.has(key)) {
        return this.cache.get(key).data;
      }
      throw error;
    }
  }

  /**
   * Manually set cache value
   */
  set(key, data, customTTL = null) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache by pattern (e.g., "work-orders-*")
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: this.cache.size * 100, // Rough estimate
    };
  }
}

export const apiCache = new APICache();

// Cache keys constants
export const CACHE_KEYS = {
  WORK_ORDERS: "work-orders-list",
  WORK_ORDERS_DETAIL: (id) => `work-order-${id}`,
  ASSETS: "assets-list",
  ASSET_DETAIL: (id) => `asset-${id}`,
  TECHNICIANS: "technicians-list",
  TECHNICIAN_DETAIL: (id) => `technician-${id}`,
  PREVENTIVE_ORDERS: "preventive-orders-list",
  DASHBOARD: "dashboard-summary",
};

// Cache TTLs by type
export const CACHE_TTL = {
  SHORT: 60000, // 1 minute - for detailed views
  MEDIUM: 300000, // 5 minutes - for lists
  LONG: 900000, // 15 minutes - for dashboard/analytics
};
