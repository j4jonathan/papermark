import crypto from "crypto";

export function generateChecksum(url: string): string {
  // Use a secure secret key stored in environment variables
  // For self-hosted deployments, use NEXTAUTH_SECRET as fallback
  const secret = process.env.NEXT_PRIVATE_VERIFICATION_SECRET ||
                 process.env.NEXTAUTH_SECRET ||
                 "default-verification-secret-change-in-production";

  // Create HMAC using SHA-256
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(url);

  // Return hex digest
  return hmac.digest("hex");
}
