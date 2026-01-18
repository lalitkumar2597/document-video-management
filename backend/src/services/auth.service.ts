import { UserRepository } from "../repositories/user.repository";
import { TokenRepository } from "../repositories/token.repository";
import { JWTService } from "../utils/jwt";
import { IUser } from "../models/User";
import { UserTokenPayload, JWTTokenPair } from "../types";

export class AuthService {
  private userRepository: UserRepository;
  private tokenRepository: TokenRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenRepository = new TokenRepository();
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ user: IUser; tokens: JWTTokenPair }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create new user
    const user = await this.userRepository.create(userData);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token in Redis
    await this.tokenRepository.storeRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      7 * 24 * 60 * 60, // 7 days in seconds
    );

    // Store access token in Redis
    await this.tokenRepository.storeAccessToken(
      user._id.toString(),
      tokens.accessToken,
      15 * 60, // 15 minutes in seconds
    );

    // Add refresh token to user's document
    await this.userRepository.addRefreshToken(user._id, tokens.refreshToken);

    // Update last login
    await this.userRepository.updateLastLogin(user._id);

    return { user, tokens };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: IUser; tokens: JWTTokenPair }> {
    // Find user with password
    const user = await this.userRepository.findByEmail(email, true);
    if (!user || !user.isActive) {
      throw new Error("Invalid credentials or inactive account");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token in Redis
    await this.tokenRepository.storeRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      7 * 24 * 60 * 60,
    );

    // Store access token in Redis
    await this.tokenRepository.storeAccessToken(
      user._id.toString(),
      tokens.accessToken,
      15 * 60,
    );

    // Add refresh token to user's document
    await this.userRepository.addRefreshToken(user._id, tokens.refreshToken);

    // Update last login
    await this.userRepository.updateLastLogin(user._id);

    return { user, tokens };
  }

  async logout(
    userId: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<void> {
    // Invalidate access token
    await this.tokenRepository.invalidateAccessToken(userId, accessToken);

    // Invalidate refresh token if provided
    if (refreshToken) {
      await this.tokenRepository.invalidateRefreshToken(refreshToken);
      await this.userRepository.removeRefreshToken(userId, refreshToken);
    }

    // Add tokens to blacklist
    await this.tokenRepository.blacklistToken(accessToken, 15 * 60);
    if (refreshToken) {
      await this.tokenRepository.blacklistToken(refreshToken, 7 * 24 * 60 * 60);
    }
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ tokens: JWTTokenPair; user: IUser }> {
    // Validate refresh token in Redis
    const userId =
      await this.tokenRepository.validateRefreshToken(refreshToken);
    if (!userId) {
      throw new Error("Invalid or expired refresh token");
    }

    // Verify refresh token is in user's document
    const user = await this.userRepository.findByIdWithTokens(userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new Error("Refresh token not found for user");
    }

    // Verify JWT
    const payload = JWTService.verifyRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Store new refresh token in Redis
    await this.tokenRepository.storeRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
      7 * 24 * 60 * 60,
    );

    // Store new access token in Redis
    await this.tokenRepository.storeAccessToken(
      user._id.toString(),
      tokens.accessToken,
      15 * 60,
    );

    // Update user's refresh tokens
    await this.userRepository.removeRefreshToken(user._id, refreshToken);
    await this.userRepository.addRefreshToken(user._id, tokens.refreshToken);

    // Invalidate old refresh token
    await this.tokenRepository.invalidateRefreshToken(refreshToken);

    return { tokens, user };
  }

  async validateAccessToken(
    userId: string,
    accessToken: string,
  ): Promise<boolean> {
    // Check if token is blacklisted
    const isBlacklisted =
      await this.tokenRepository.isTokenBlacklisted(accessToken);
    if (isBlacklisted) {
      return false;
    }

    // Check if token is valid in Redis
    return await this.tokenRepository.validateAccessToken(userId, accessToken);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    // Clear all refresh tokens from user document
    await this.userRepository.clearAllRefreshTokens(userId);

    // Invalidate all access tokens (simplified)
    await this.tokenRepository.invalidateAllUserAccessTokens(userId);
  }

  private generateTokens(user: IUser): JWTTokenPair {
    const payload: UserTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return JWTService.generateTokenPair(payload);
  }
}

export const authService = new AuthService();
