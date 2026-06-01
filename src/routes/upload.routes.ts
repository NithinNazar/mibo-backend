import { Router } from "express";
import multer from "multer";
import { uploadToS3, deleteFromS3 } from "../utils/s3Upload";
import { ENV } from "../config/env";

const router = Router();

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/**
 * POST /api/upload/clinician-profile
 * Upload clinician profile picture directly to S3 (no processing)
 * Admin is responsible for uploading pre-optimized images
 */
router.post(
  "/clinician-profile",
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      console.log(
        `📤 Uploading clinician profile picture: ${req.file.originalname}`,
      );

      // Upload directly to S3 without any processing
      // Admin uploads pre-optimized images
      const imageUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "clinicians",
      );

      console.log(`✅ Upload successful: ${imageUrl}`);

      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          imageUrl,
          originalName: req.file.originalname,
          size: req.file.size,
          format: req.file.mimetype,
        },
      });
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      console.error("Error stack:", error.stack);
      console.error("AWS Config:", {
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET,
        cloudfront: process.env.CLOUDFRONT_DOMAIN,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      });
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error.message,
        details: ENV.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

/**
 * DELETE /api/upload/image
 * Delete image from S3
 */
router.delete("/image", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    await deleteFromS3(imageUrl);

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: error.message,
    });
  }
});

export default router;
