import { tenant } from "@teamhanko/passkeys-next-auth-provider";

// Make Hanko optional - only throw error if trying to use it without config
const hankoApiKey = process.env.HANKO_API_KEY;
const hankoTenantId = process.env.NEXT_PUBLIC_HANKO_TENANT_ID;

const hanko = hankoApiKey && hankoTenantId
  ? tenant({
      apiKey: hankoApiKey,
      tenantId: hankoTenantId,
    })
  : null;

// Export a function that checks if Hanko is configured
export const isHankoConfigured = () => hankoApiKey && hankoTenantId;

// Export hanko client (null if not configured)
export default hanko;
