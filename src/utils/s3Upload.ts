import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Lazy initialization - only create S3Client when first needed
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    // Only initialize when first upload/delete is called
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "eu-north-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    console.log("✅ S3Client initialized");
  }
  return s3Client;
}

/**
 * Upload file to S3 and return CloudFront URL
 * @param fileBuffer - File buffer to upload
 * @param originalName - Original filename
 * @param mimeType - File MIME type
 * @param folder - S3 folder (e.g., 'clinicians', 'documents')
 * @returns CloudFront URL of uploaded file
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = "clinicians",
): Promise<string> {
  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `${folder}/${timestamp}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: filename,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: "max-age=31536000", // Cache for 1 year
    // ACL removed - bucket uses bucket policy for public access instead
  });

  try {
    const client = getS3Client(); // Get S3Client only when needed
    await client.send(command);

    // Return CloudFront URL for fast CDN delivery
    const cloudfrontUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${filename}`;

    console.log(`✅ File uploaded successfully: ${cloudfrontUrl}`);
    return cloudfrontUrl;
  } catch (error: any) {
    console.error("❌ S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Delete file from S3
 * @param fileUrl - CloudFront or S3 URL of file to delete
 * @returns Success status
 */
export async function deleteFromS3(fileUrl: string): Promise<boolean> {
  try {
    // Extract filename from URL
    // URL format: https://d1234.cloudfront.net/clinicians/123-file.webp
    const urlParts = fileUrl.split("/");
    const filename = urlParts.slice(3).join("/"); // Get everything after domain

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: filename,
    });

    const client = getS3Client(); // Get S3Client only when needed
    await client.send(command);
    console.log(`✅ File deleted successfully: ${filename}`);
    return true;
  } catch (error: any) {
    console.error("❌ S3 delete error:", error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
}
