import WelcomeEmail from "@/components/emails/welcome";

import { sendEmail } from "@/lib/resend";

import { CreateUserEmailProps } from "../types";

export const sendWelcomeEmail = async (params: CreateUserEmailProps) => {
  const { name, email } = params.user;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Papermark";
  const isCustomApp = process.env.NEXT_PUBLIC_IS_SELF_HOSTED === "true";
  const emailTemplate = WelcomeEmail({ name, appName, isCustomApp });
  try {
    await sendEmail({
      to: email as string,
      subject: `Welcome to ${appName}!`,
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
