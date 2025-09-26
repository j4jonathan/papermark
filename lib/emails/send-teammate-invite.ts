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
    console.error("Failed to send teammate invite email:", e);
    // Log the invitation URL for debugging
    console.log("Invitation URL:", url);
    // Don't throw to allow invitation to complete even if email fails
  }
};
