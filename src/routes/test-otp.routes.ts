// src/routes/test-otp.routes.ts
// TEST ONLY - Simple OTP endpoint without database dependencies

import { Router, Request, Response } from "express";
import { gallaboxUtil } from "../utils/gallabox";
import logger from "../config/logger";

const router = Router();

// In-memory OTP storage for testing (no database needed!)
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

/**
 * TEST ONLY: Send OTP without database
 * POST /api/test/send-otp
 * Body: { phone: "919876543210" }
 */
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpStore.set(phone, { otp, expiresAt });

    // Log OTP to console (for testing)
    logger.info(`🔐 TEST OTP for ${phone}: ${otp}`);
    console.log(`\n🔐 TEST OTP for ${phone}: ${otp}\n`);

    // Try to send via WhatsApp (optional - won't fail if Gallabox not configured)
    if (gallaboxUtil.isReady()) {
      try {
        await gallaboxUtil.sendOTP(phone, otp);
        logger.info(`✅ OTP sent via WhatsApp to ${phone}`);
      } catch (error) {
        logger.warn(`⚠️ WhatsApp send failed, but OTP is available in console`);
      }
    } else {
      logger.warn(`⚠️ Gallabox not configured - OTP shown in console only`);
    }

    return res.json({
      success: true,
      message: "OTP sent successfully",
      data: {
        phone,
        // In test mode, return OTP in response (NEVER do this in production!)
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
    });
  } catch (error: any) {
    logger.error("Error sending test OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

/**
 * TEST ONLY: Verify OTP without database
 * POST /api/test/verify-otp
 * Body: { phone: "919876543210", otp: "123456" }
 */
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    // Check if OTP exists
    const stored = otpStore.get(phone);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message:
          "No OTP found for this phone number. Please request a new OTP.",
      });
    }

    // Check if expired
    if (new Date() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // OTP is valid! Remove it (one-time use)
    otpStore.delete(phone);

    logger.info(`✅ OTP verified successfully for ${phone}`);

    return res.json({
      success: true,
      message: "OTP verified successfully",
      data: {
        phone,
        verified: true,
        // Mock tokens for testing
        accessToken: "test_access_token_" + Date.now(),
        refreshToken: "test_refresh_token_" + Date.now(),
      },
    });
  } catch (error: any) {
    logger.error("Error verifying test OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
});

/**
 * TEST ONLY: Check stored OTPs (for debugging)
 * GET /api/test/otp-status
 */
router.get("/otp-status", (req: Request, res: Response) => {
  const status = Array.from(otpStore.entries()).map(([phone, data]) => ({
    phone,
    otp: data.otp,
    expiresAt: data.expiresAt,
    expired: new Date() > data.expiresAt,
  }));

  return res.json({
    success: true,
    data: {
      count: otpStore.size,
      otps: status,
    },
  });
});

export default router;
