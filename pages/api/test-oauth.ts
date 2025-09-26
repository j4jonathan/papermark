import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple OAuth config test - no database, just env vars

  const config = {
    timestamp: new Date().toISOString(),

    oauth: {
      googleClientId: process.env.GOOGLE_CLIENT_ID ? "Set" : "NOT SET",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "NOT SET",
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      secretPrefix: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 7) || "missing",
    },

    nextauth: {
      url: process.env.NEXTAUTH_URL || "NOT SET",
      secret: process.env.NEXTAUTH_SECRET ? "Set" : "NOT SET",
      selfHosted: process.env.NEXT_PUBLIC_IS_SELF_HOSTED || "NOT SET",
    },

    database: {
      postgresUrl: process.env.POSTGRES_PRISMA_URL ? "Set" : "NOT SET",
      postgresNonPooling: process.env.POSTGRES_PRISMA_URL_NON_POOLING ? "Set" : "NOT SET",
      databaseUrl: process.env.DATABASE_URL ? "Set" : "NOT SET",
    },

    deployment: {
      vercel: !!process.env.VERCEL,
      vercelUrl: process.env.VERCEL_URL ? "Set" : "NOT SET",
      nodeEnv: process.env.NODE_ENV,
    },

    expectedCallback: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,

    troubleshooting: {
      hint1: "If oauth.googleClientSecret is NOT SET, add it in Vercel dashboard",
      hint2: "If secretPrefix is not 'GOCSPX-', the secret is wrong",
      hint3: "Client ID should be ~72 chars, Secret should be ~35 chars",
      hint4: "Make sure no spaces or quotes in the environment variables",
    }
  };

  return res.status(200).json(config);
}