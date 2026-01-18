import { redisClient } from '../config/redis';

export class TokenRepository {
  private readonly ACCESS_TOKEN_PREFIX = 'access_token:';
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly BLACKLIST_PREFIX = 'blacklist:';

  // Access Token methods
  async storeAccessToken(userId: string, token: string, expirySeconds: number): Promise<void> {
    const key = `${this.ACCESS_TOKEN_PREFIX}${userId}:${token}`;
    await redisClient.set(key, 'valid', expirySeconds);
  }

  async validateAccessToken(userId: string, token: string): Promise<boolean> {
    const key = `${this.ACCESS_TOKEN_PREFIX}${userId}:${token}`;
    const exists = await redisClient.exists(key);
    return exists;
  }

  async invalidateAccessToken(userId: string, token: string): Promise<void> {
    const key = `${this.ACCESS_TOKEN_PREFIX}${userId}:${token}`;
    await redisClient.del(key);
  }

  async invalidateAllUserAccessTokens(userId: string): Promise<void> {
    // Note: In production, use Redis SCAN for pattern matching
    // This is simplified for the boilerplate
    const pattern = `${this.ACCESS_TOKEN_PREFIX}${userId}:*`;
    // Implementation would require Redis SCAN command
    console.warn('Invalidate all access tokens not fully implemented - requires Redis SCAN');
  }

  // Refresh Token methods
  async storeRefreshToken(userId: string, token: string, expirySeconds: number): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${token}`;
    await redisClient.set(key, userId, expirySeconds);
  }

  async validateRefreshToken(token: string): Promise<string | null> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${token}`;
    const userId = await redisClient.get(key);
    return userId;
  }

  async invalidateRefreshToken(token: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${token}`;
    await redisClient.del(key);
  }

  // Blacklist methods
  async blacklistToken(token: string, expirySeconds: number): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    await redisClient.set(key, 'blacklisted', expirySeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const exists = await redisClient.exists(key);
    return exists;
  }

  // Cleanup methods
  async cleanupExpiredTokens(): Promise<void> {
    // Redis automatically expires keys with TTL
    // This method can be used for additional cleanup logic
    console.log('Token cleanup completed');
  }
}