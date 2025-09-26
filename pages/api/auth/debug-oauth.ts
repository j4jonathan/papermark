import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Security: Only allow in development or with a secret key
  const debugKey = req.query.key;
  if (process.env.NODE_ENV === "production" && debugKey !== "debug-vdr-2025") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Test 1: Environment Variables
  const envVars = {
    // Core
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL ? "Set (hidden)" : "Not set",

    // NextAuth
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set (hidden)" : "Not set",
    NEXT_PUBLIC_IS_SELF_HOSTED: process.env.NEXT_PUBLIC_IS_SELF_HOSTED,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "Not set",

    // Database
    DATABASE_URL: process.env.DATABASE_URL ? "Set (hidden)" : "Not set",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "Set (hidden)" : "Not set",
    POSTGRES_PRISMA_URL_NON_POOLING: process.env.POSTGRES_PRISMA_URL_NON_POOLING ? "Set (hidden)" : "Not set",

    // OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "Set (hidden)" : "Not set",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "Set (hidden)" : "Not set",
  };

  // Test 2: Request Headers
  const headers = {
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    "x-forwarded-host": req.headers["x-forwarded-host"],
    "x-forwarded-proto": req.headers["x-forwarded-proto"],
  };

  // Test 3: Database Connection
  let dbStatus = { connected: false, error: null as any, tables: null as any };

  try {
    // Dynamic import to avoid build issues
    const prisma = (await import("@/lib/prisma")).default;

    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1+1 as test`;
    dbStatus.connected = true;

    // Check for NextAuth tables
    const tables = await prisma.$queryRaw`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'Account', 'Session', 'VerificationToken')
      ORDER BY table_name
    `;
    dbStatus.tables = tables;

  } catch (error: any) {
    dbStatus.error = {
      message: error.message,
      code: error.code,
      meta: error.meta,
    };
  }

  // Test 4: NextAuth Configuration
  const nextAuthConfig = {
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    providers: {
      google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
    cookieConfig: {
      domain: process.env.VERCEL && process.env.NEXT_PUBLIC_IS_SELF_HOSTED !== "true"
        ? ".papermark.com"
        : "undefined (allows any domain)",
      secure: !!process.env.VERCEL,
    }
  };

  // Test 5: URL Construction
  const urlTests = {
    currentUrl: `${headers["x-forwarded-proto"] || "http"}://${headers.host}${req.url}`,
    expectedAuthUrl: process.env.NEXTAUTH_URL,
    match: headers.host === new URL(process.env.NEXTAUTH_URL || "http://localhost").host,
  };

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: envVars,
    headers: headers,
    database: dbStatus,
    nextAuth: nextAuthConfig,
    urlTests: urlTests,
    diagnostics: {
      isVercel: !!process.env.VERCEL,
      isSelfHosted: process.env.NEXT_PUBLIC_IS_SELF_HOSTED === "true",
      willSetCookieDomain: !!process.env.VERCEL && process.env.NEXT_PUBLIC_IS_SELF_HOSTED !== "true",
      expectedCookieDomain: process.env.VERCEL && process.env.NEXT_PUBLIC_IS_SELF_HOSTED !== "true"
        ? ".papermark.com"
        : "none",
    },
  });
}