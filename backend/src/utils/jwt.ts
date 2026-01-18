import jwt from 'jsonwebtoken';
import { configs } from '../config/env';
import { UserTokenPayload, JWTTokenPair } from '../types';

export class JWTService {
  static generateAccessToken(payload: UserTokenPayload): string {
    return jwt.sign(payload, configs.JWT_ACCESS_SECRET, {
      expiresIn: configs.ACCESS_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: UserTokenPayload): string {
    return jwt.sign(payload, configs.JWT_REFRESH_SECRET, {
      expiresIn: configs.REFRESH_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  static generateTokenPair(payload: UserTokenPayload): JWTTokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static verifyAccessToken(token: string): UserTokenPayload {
    return jwt.verify(token, configs.JWT_ACCESS_SECRET) as UserTokenPayload;
  }

  static verifyRefreshToken(token: string): UserTokenPayload {
    return jwt.verify(token, configs.JWT_REFRESH_SECRET) as UserTokenPayload;
  }

  static decodeToken(token: string): UserTokenPayload | null {
    try {
      return jwt.decode(token) as UserTokenPayload;
    } catch {
      return null;
    }
  }

  static getTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Helper method to check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded === 'string') {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp ? decoded.exp < currentTime : true;
    } catch {
      return true;
    }
  }
}