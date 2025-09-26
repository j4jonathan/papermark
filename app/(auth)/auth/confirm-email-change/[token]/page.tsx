import { Metadata } from "next";
import { redirect } from "next/navigation";

import NotFound from "@/pages/404";
import { VerificationToken } from "@prisma/client";
import { waitUntil } from "@vercel/functions";

import { hashToken } from "@/lib/api/auth/token";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/resend";
import { CustomUser } from "@/lib/types";
import { subscribe, unsubscribe } from "@/lib/unsend";

import EmailUpdated from "@/components/emails/email-updated";

import ConfirmEmailChangePageClient from "./page-client";
import { getSession } from "./utils";

export const runtime = "nodejs";

const data = {
  description: "Confirm email change",
  title: "Confirm email change | Papermark",
  url: "/auth/confirm-email-change",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.papermark.com"),
  title: data.title,
  description: data.description,
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Papermark",
    images: [
      {
        url: "/_static/meta-image.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: data.title,
    description: data.description,
    creator: "@papermarkio",
    images: ["/_static/meta-image.png"],
  },
};

interface PageProps {
  params: { token: string };
}

export default async function ConfirmEmailChangePage(props: PageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <VerifyEmailChange {...props} />
    </div>
  );
}

const VerifyEmailChange = async ({ params: { token } }: PageProps) => {
  const tokenFound = await prisma.verificationToken.findUnique({
    where: {
      token: hashToken(token),
    },
  });

  if (!tokenFound || tokenFound.expires < new Date()) return <NotFound />;

  const session = await getSession();

  if (!session) {
    redirect(`/login?next=/auth/confirm-email-change/${token}`);
  }

  const currentUserId = (session.user as CustomUser).id;

  // Email change requires Redis for temporary storage
  if (!redis) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Feature Not Available</h1>
          <p className="mt-2 text-gray-600">
            Email change confirmation requires Redis configuration.
          </p>
        </div>
      </div>
    );
  }

  const data = await redis.get<{ email: string; newEmail: string }>(
    `email-change-request:user:${currentUserId}`,
  );

  if (!data) return <NotFound />;

  await unsubscribe(data.email);

  await prisma.user.update({
    where: {
      id: currentUserId,
    },
    data: {
      email: data.newEmail,
    },
  });

  waitUntil(
    Promise.all([
      deleteRequest(tokenFound),

      subscribe(data.newEmail),

      sendEmail({
        to: data.email,
        subject: "Your email address has been changed",
        system: true,
        react: EmailUpdated({
          oldEmail: data.email,
          newEmail: data.newEmail,
        }),
        test: process.env.NODE_ENV === "development",
      }),
    ]),
  );

  return <ConfirmEmailChangePageClient />;
};

const deleteRequest = async (tokenFound: VerificationToken) => {
  // Delete from database
  await prisma.verificationToken.delete({
    where: {
      token: tokenFound.token,
    },
  });

  // Delete from Redis if it's configured
  if (redis) {
    await redis.del(`email-change-request:user:${tokenFound.identifier}`);
  }
};
