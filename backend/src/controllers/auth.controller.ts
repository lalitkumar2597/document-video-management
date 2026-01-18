import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../middleware/error.middleware";
import { configs } from "../config/env";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    const { user, tokens } = await authService.register({
      email,
      password,
      firstName,
      lastName,
    });

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: configs.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const { user, tokens } = await authService.login(email, password);

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: configs.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  });

  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.accessToken) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(req.user.userId, req.accessToken, refreshToken);

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  });

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const { tokens, user } = await authService.refreshTokens(refreshToken);

    // Set new refresh token as HTTP-only cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: configs.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  });

  static me = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  });

  static logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    await authService.logoutAllDevices(req.user.userId);

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  });
}
