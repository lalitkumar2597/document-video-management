import { Request, Response, NextFunction } from "express";
import { AuthRequest, UserTokenPayload } from "../types";
import { JWTService } from "../utils/jwt";
import { authService } from "../services/auth.service";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get access token from header
    const accessToken = JWTService.getTokenFromHeader(
      req.headers.authorization,
    );
    if (!accessToken) {
      res.status(401).json({ error: "No access token provided" });
      return;
    }

    // Verify token
    let payload: UserTokenPayload;
    try {
      payload = JWTService.verifyAccessToken(accessToken);
    } catch (error) {
      res.status(401).json({ error: "Invalid or expired access token" });
      return;
    }

    // Validate token in Redis
    const isValid = await authService.validateAccessToken(
      payload.userId,
      accessToken,
    );
    if (!isValid) {
      res.status(401).json({ error: "Access token is invalid or revoked" });
      return;
    }

    // Set user and token in request
    req.user = payload;
    req.accessToken = accessToken;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessToken = JWTService.getTokenFromHeader(
      req.headers.authorization,
    );
    if (!accessToken) {
      next();
      return;
    }

    let payload: UserTokenPayload;
    try {
      payload = JWTService.verifyAccessToken(accessToken);
    } catch {
      next();
      return;
    }

    const isValid = await authService.validateAccessToken(
      payload.userId,
      accessToken,
    );
    if (!isValid) {
      next();
      return;
    }

    req.user = payload;
    req.accessToken = accessToken;
    next();
  } catch {
    next();
  }
};

export const refreshTokenMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    // Verify refresh token
    let payload: UserTokenPayload;
    try {
      payload = JWTService.verifyRefreshToken(refreshToken);
    } catch (error) {
      res.clearCookie("refreshToken");
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Set user from refresh token (limited permissions)
    req.user = payload;
    next();
  } catch (error) {
    console.error("Refresh token middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
