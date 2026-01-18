import { redisClient } from '../config/redis';

export class RedisService {
  private readonly FILE_METADATA_PREFIX = 'file_metadata:';
  private readonly USER_FILES_PREFIX = 'user_files:';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  // File metadata caching
  async cacheFileMetadata(fileId: string, metadata: any): Promise<void> {
    const key = `${this.FILE_METADATA_PREFIX}${fileId}`;
    await redisClient.set(key, JSON.stringify(metadata), this.CACHE_TTL);
  }

  async getCachedFileMetadata(fileId: string): Promise<any | null> {
    const key = `${this.FILE_METADATA_PREFIX}${fileId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateFileMetadata(fileId: string): Promise<void> {
    const key = `${this.FILE_METADATA_PREFIX}${fileId}`;
    await redisClient.del(key);
  }

  // User files list caching
  async cacheUserFiles(userId: string, page: number, files: any[]): Promise<void> {
    const key = `${this.USER_FILES_PREFIX}${userId}:${page}`;
    await redisClient.set(key, JSON.stringify(files), this.CACHE_TTL);
  }

  async getCachedUserFiles(userId: string, page: number): Promise<any[] | null> {
    const key = `${this.USER_FILES_PREFIX}${userId}:${page}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateUserFilesCache(userId: string): Promise<void> {
    // Pattern: user_files:{userId}:*
    // Note: In production, use Redis SCAN for pattern matching
    console.warn('Invalidate user files cache not fully implemented - requires Redis SCAN');
  }

  // Search results caching
  async cacheSearchResults(userId: string, query: string, results: any[]): Promise<void> {
    const key = `search:${userId}:${query}`;
    await redisClient.set(key, JSON.stringify(results), 1800); // 30 minutes TTL
  }

  async getCachedSearchResults(userId: string, query: string): Promise<any[] | null> {
    const key = `search:${userId}:${query}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  // General cache invalidation
  async clearAllCache(): Promise<void> {
    // In production, use FLUSHDB or proper namespace management
    console.warn('Clear all cache not implemented - use Redis FLUSHDB in production');
  }

  // Cache statistics
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
  }> {
    // This is a simplified version
    // In production, use Redis INFO command
    return {
      totalKeys: 0,
      memoryUsage: '0MB',
    };
  }
}

export const redisService = new RedisService();