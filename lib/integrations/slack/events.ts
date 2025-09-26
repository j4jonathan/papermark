import prisma from "@/lib/prisma";

import { SlackClient } from "./client";
import { getSlackEnv } from "./env";
import { createSlackMessage } from "./templates";
import { SlackEventData, SlackIntegrationServer } from "./types";

export class SlackEventManager {
  private client: SlackClient | null;

  constructor() {
    try {
      this.client = new SlackClient();
    } catch (error) {
      // Slack is not configured, which is fine for self-hosted deployments
      this.client = null;
    }
  }

  async processEvent(eventData: SlackEventData): Promise<void> {
    if (!this.client) {
      // Slack integration not configured
      return;
    }

    try {
      const env = getSlackEnv();

      const integration = await prisma.installedIntegration.findUnique({
        where: {
          teamId_integrationId: {
            teamId: eventData.teamId,
            integrationId: env.SLACK_INTEGRATION_ID,
          },
        },
        select: {
          enabled: true,
          credentials: true,
          configuration: true,
        },
      });

      if (!integration || !integration.enabled) {
        return;
      }

      await this.sendSlackNotification(
        eventData,
        integration as SlackIntegrationServer,
      );
    } catch (error) {
      console.error("Error processing Slack event:", error);
    }
  }

  /**
   * Send slack notification for an event
   */
  private async sendSlackNotification(
    eventData: SlackEventData,
    integration: SlackIntegrationServer,
  ): Promise<void> {
    if (!this.client) {
      // Slack client not configured
      return;
    }

    try {
      const channels = await this.getNotificationChannels(
        eventData,
        integration,
      );

      if (channels.length === 0) {
        return;
      }

      for (const channel of channels) {
        try {
          const message = await createSlackMessage(eventData);
          if (message) {
            const slackMessage = {
              ...message,
              channel: channel.id,
            };
            await this.client.sendMessage(
              integration.credentials.accessToken,
              slackMessage,
            );
          }
        } catch (channelError) {
          console.error(
            `Error sending to channel ${channel.name || channel.id}:`,
            channelError,
          );
        }
      }
    } catch (error) {
      console.error("Error sending instant notification:", error);
    }
  }

  // private async getSlackIntegration(teamId: string) {
  //   const env = getSlackEnv();
  //   return await prisma.installedIntegration.findUnique({
  //     where: {
  //       teamId_integrationId: {
  //         teamId,
  //         integrationId: env.SLACK_INTEGRATION_ID,
  //       },
  //       enabled: true,
  //     },
  //   });
  // }

  // private isEventTypeEnabled(eventType: string, integration: any): boolean {
  //   const notificationTypes = integration.notificationTypes || {};
  //   return notificationTypes[eventType] || false;
  // }

  private async getNotificationChannels(
    eventData: SlackEventData,
    integration: SlackIntegrationServer,
  ): Promise<any[]> {
    const enabledChannels = integration.configuration?.enabledChannels || {};
    return Object.values(enabledChannels)
      .filter((channel: any) => channel.enabled)
      .filter(
        (channel: any) =>
          channel.notificationTypes &&
          channel.notificationTypes.includes(eventData.eventType),
      );
  }
}

// Create a singleton instance, but handle configuration errors gracefully
let slackEventManagerInstance: SlackEventManager | null = null;

try {
  slackEventManagerInstance = new SlackEventManager();
} catch (error) {
  // Slack integration not configured - this is fine for self-hosted
  console.log("Slack integration not configured (missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET)");
}

export const slackEventManager = slackEventManagerInstance;

export async function notifyDocumentView(
  data: Omit<SlackEventData, "eventType">,
) {
  if (!slackEventManager) return;
  await slackEventManager.processEvent({ ...data, eventType: "document_view" });
}

export async function notifyDataroomAccess(
  data: Omit<SlackEventData, "eventType">,
) {
  if (!slackEventManager) return;
  await slackEventManager.processEvent({
    ...data,
    eventType: "dataroom_access",
  });
}

export async function notifyDocumentDownload(
  data: Omit<SlackEventData, "eventType">,
) {
  if (!slackEventManager) return;
  await slackEventManager.processEvent({
    ...data,
    eventType: "document_download",
  });
}
