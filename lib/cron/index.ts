import { Receiver } from "@upstash/qstash";
import { Client } from "@upstash/qstash";
import Bottleneck from "bottleneck";

// we're using Bottleneck to avoid running into Resend's rate limit of 10 req/s
export const limiter = new Bottleneck({
  maxConcurrent: 1, // maximum concurrent requests
  minTime: 100, // minimum time between requests in ms
});

// we're using Upstash's Receiver to verify the request signature
export const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

// Create a conditional qstash client - only if token is available
// For self-hosted deployments without QStash, this returns a stub
export const qstash = process.env.QSTASH_TOKEN
  ? new Client({
      token: process.env.QSTASH_TOKEN,
    })
  : ({
      // Stub methods that log a warning and do nothing
      publishJSON: async () => {
        console.warn("[QStash] Skipping webhook - QSTASH_TOKEN not configured");
        return { messageId: "stub" };
      },
      publish: async () => {
        console.warn("[QStash] Skipping message - QSTASH_TOKEN not configured");
        return { messageId: "stub" };
      },
    } as any);
