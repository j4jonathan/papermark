import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Test database connection
    const dbTime = await prisma.$queryRaw`SELECT NOW()`;

    // Check for tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'Account', 'Session', 'VerificationToken')
      ORDER BY table_name
    `;

    // Count users
    const userCount = await prisma.user.count();

    // Count accounts
    const accountCount = await prisma.account.count();

    // Test environment variables
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_PRISMA_URL_NON_POOLING: !!process.env.POSTGRES_PRISMA_URL_NON_POOLING,
      DATABASE_URL: !!process.env.DATABASE_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXT_PUBLIC_IS_SELF_HOSTED: process.env.NEXT_PUBLIC_IS_SELF_HOSTED,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
    };

    return res.status(200).json({
      success: true,
      database: {
        connected: true,
        time: dbTime,
        tables: tables,
        userCount,
        accountCount,
      },
      environment: envCheck,
      prismaClient: {
        configured: true,
        datasourceUrl: process.env.POSTGRES_PRISMA_URL ? "Set (hidden)" : "Not set",
      },
      nextAuthConfig: {
        url: process.env.NEXTAUTH_URL || "Not set",
        googleCallback: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      }
    });
  } catch (error: any) {
    console.error("Database test error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      errorCode: error.code,
      environment: {
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        POSTGRES_PRISMA_URL_NON_POOLING: !!process.env.POSTGRES_PRISMA_URL_NON_POOLING,
        DATABASE_URL: !!process.env.DATABASE_URL,
      }
    });
  }
}