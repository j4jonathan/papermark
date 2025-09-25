import { tenant } from "@teamhanko/passkeys-next-auth-provider";

const hanko = tenant({
  apiKey: process.env.HANKO_API_KEY || "dummy_key_for_build",
  tenantId: process.env.NEXT_PUBLIC_HANKO_TENANT_ID || "dummy_tenant_for_build",
});

export function isHankoConfigured() {
  return !!(
    process.env.HANKO_API_KEY &&
    process.env.NEXT_PUBLIC_HANKO_TENANT_ID &&
    process.env.HANKO_API_KEY !== "dummy_key_for_build" &&
    process.env.HANKO_API_KEY !== "dummy_key_for_production" &&
    process.env.NEXT_PUBLIC_HANKO_TENANT_ID !== "dummy_tenant_for_build" &&
    process.env.NEXT_PUBLIC_HANKO_TENANT_ID !== "dummy_tenant_for_production"
  );
}

export default hanko;
