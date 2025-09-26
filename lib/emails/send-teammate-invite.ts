import TeamInvitation from "@/components/emails/team-invitation";

import { sendEmail } from "@/lib/resend";

export const sendTeammateInviteEmail = async ({
  senderName,
  senderEmail,
  teamName,
  to,
  url,
}: {
  senderName: string;
  senderEmail: string;
  teamName: string;
  to: string;
  url: string;
}) => {
  try {
    await sendEmail({
      to: to,
      subject: `You are invited to join team`,
      react: TeamInvitation({
        senderName,
        senderEmail,
        teamName,
        url,
      }),
      test: process.env.NODE_ENV === "development",
      system: true,
    });
  } catch (e) {
    // For self-hosted without email configured, log the invitation URL
    if (process.env.NEXT_PUBLIC_IS_SELF_HOSTED === "true") {
      console.log("=== TEAM INVITATION (Email not configured) ===");
      console.log(`To: ${to}`);
      console.log(`Team: ${teamName}`);
      console.log(`Invitation URL: ${url}`);
      console.log("===============================================");
      // Don't throw error for self-hosted without email
      return;
    }
    console.error(e);
    // Rethrow for non-self-hosted to maintain existing behavior
    throw e;
  }
};
