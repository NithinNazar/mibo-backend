"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
exports.deleteFromS3 = deleteFromS3;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
// Configure AWS SDK
aws_sdk_1.default.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || "eu-north-1",
});
const s3 = new aws_sdk_1.default.S3();
/**
 * Upload file to S3 and return CloudFront URL
 * @param fileBuffer - File buffer to upload
 * @param originalName - Original filename
 * @param mimeType - File MIME type
 * @param folder - S3 folder (e.g., 'clinicians', 'documents')
 * @returns CloudFront URL of uploaded file
 */
async function uploadToS3(fileBuffer, originalName, mimeType, folder = "clinicians") {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${folder}/${timestamp}-${sanitizedName}`;
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimeType,
        CacheControl: "max-age=31536000", // Cache for 1 year
        ACL: "public-read",
    };
    try {
        await s3.upload(params).promise();
        // Return CloudFront URL instead of S3 URL
        const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${filename}`;
        console.log(`✅ File uploaded successfully: ${cloudfrontUrl}`);
        return cloudfrontUrl;
    }
    catch (error) {
        console.error("❌ S3 upload error:", error);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
}
/**
 * Delete file from S3
 * @param fileUrl - CloudFront or S3 URL of file to delete
 * @returns Success status
 */
async function deleteFromS3(fileUrl) {
    try {
        // Extract filename from URL
        // URL format: https://d1234.cloudfront.net/clinicians/123-file.webp
        const urlParts = fileUrl.split("/");
        const filename = urlParts.slice(3).join("/"); // Get everything after domain
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: filename,
        };
        await s3.deleteObject(params).promise();
        console.log(`✅ File deleted successfully: ${filename}`);
        return true;
    }
    catch (error) {
        console.error("❌ S3 delete error:", error);
        throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
}
