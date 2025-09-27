# Papermark VDR Deployment Fixes - Session Log

## Date: 2025-09-27
## Repository: https://github.com/j4jonathan/papermark
## Deployment URL: vdr.unsensible.com (Vercel)

## Initial Problem
Self-hosted Papermark VDR deployment failing with multiple issues:
1. OAuth authentication failures
2. Build errors related to Redis type safety
3. Static generation errors for dynamic API routes
4. Slack integration failures when environment variables not set

## Environment Configuration
- **Database**: Supabase PostgreSQL with pgbouncer
- **Redis**: Upstash Redis (CONFIGURED - not optional)
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- **Email**: Resend API
  - `RESEND_API_KEY`
  - `EMAIL_FROM=noreply@unsensible.com`
- **Deployment**: Vercel with custom domain vdr.unsensible.com

## Fixes Applied (In Order)

### 1. Redis Type Safety Fixes
**Problem**: TypeScript errors with Redis possibly being null
**Solution**: Added non-null assertions (`!`) throughout codebase since Redis IS configured

**Files Modified**:
- `lib/redis.ts` - Changed ratelimit function to always return Ratelimit instance
- `lib/auth/dataroom-auth.ts` - Updated function signatures to return non-nullable types
- `lib/auth/preview-auth.ts` - Updated function signatures to return non-nullable types
- `app/api/views-dataroom/route.ts` - Fixed optional chaining on session tokens
- `lib/redis-job-store.ts` - Added non-null assertions to all Redis calls
- `pages/api/teams/[teamId]/viewers/[id]/index.ts` - Fixed redis.set call
- `ee/features/security/lib/ratelimit.ts` - Added non-null assertions
- `pages/api/assistants/chat.ts` - Fixed ratelimit instances
- `pages/api/file/tus/[[...file]].ts` - Fixed lockerRedisClient
- `pages/api/file/tus-viewer/[[...file]].ts` - Fixed lockerRedisClient
- `pages/api/teams/[teamId]/branding.ts` - Added non-null assertions
- `pages/api/teams/[teamId]/index.ts` - Added non-null assertions
- `pages/api/report.ts` - Added non-null assertions
- `pages/api/account/index.ts` - Added non-null assertions
- `lib/emails/send-email-otp-verification.ts` - Added non-null assertions
- `lib/integrations/slack/install.ts` - Added non-null assertions
- `app/api/integrations/slack/oauth/callback/route.ts` - Added non-null assertions

**Commits**:
- `751f1a35` - Initial Redis non-null assertions
- `244d3322` - Complete Redis updates
- `b457547e` - Fix viewer API
- `04d2cdbb` - Remaining modules
- `5767a832` - TUS upload handlers

### 2. Slack Integration Made Optional
**Problem**: Build failing when SLACK_CLIENT_ID and SLACK_CLIENT_SECRET not set
**Solution**: Modified Slack integration to gracefully handle missing configuration

**Files Modified**:
- `lib/integrations/slack/client.ts` - Made SlackClient handle missing env vars
- `lib/integrations/slack/events.ts` - Made SlackEventManager handle null client

**Key Changes**:
```typescript
// SlackClient constructor no longer throws, sets isConfigured flag
this.isConfigured = !!(this.clientId && this.clientSecret);

// SlackEventManager creates singleton with try/catch
try {
  slackEventManagerInstance = new SlackEventManager();
} catch (error) {
  // Slack integration not configured - this is fine for self-hosted
}

// All notification functions check for null manager
if (!slackEventManager) return;
```

**Commit**: `922acaf4`

### 3. Dynamic Route Rendering Fixes
**Problem**: "Failed to collect page data" errors during build for routes using runtime features
**Solution**: Added `export const dynamic = 'force-dynamic'` and `export const runtime = 'nodejs'`

**Critical Discovery**: These exports MUST be placed BEFORE any import statements!

**Files Modified**:
- `app/(ee)/api/faqs/route.ts`
- `app/api/views-dataroom/route.ts`
- `app/api/views/route.ts`
- `app/(ee)/api/links/[id]/upload/route.ts`
- `app/api/integrations/slack/oauth/authorize/route.ts`
- `app/api/integrations/slack/oauth/callback/route.ts` (already had dynamic export)

**Correct Pattern**:
```typescript
// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
// ... other imports
```

**Commits**:
- `b727bdae` - Initial dynamic exports
- `3926ed9c` - More routes
- `5bac1342` - Added runtime exports
- `956f7df0` - **CRITICAL**: Moved exports before imports

### 4. Premium Features Enabled
**Problem**: Self-hosted deployment had billing restrictions
**Solution**: Modified billing checks to return unlimited features for self-hosted

**Files Modified**:
- `lib/swr/use-billing.ts` - Returns datarooms-plus plan for self-hosted
- `ee/limits/server.ts` - Returns Infinity for all limits when self-hosted

## Build Verification
Local build completes successfully:
```bash
npm run build
✓ Compiled successfully
✓ Generating static pages
```

## Current Status
- All TypeScript errors resolved
- Build completes without errors locally
- Latest commit: `956f7df0`
- Deployment should succeed on Vercel

## Key Learnings
1. Redis is REQUIRED - use non-null assertions (`!`) everywhere
2. Dynamic route exports MUST come before imports for Next.js static analysis
3. Slack integration should be optional for self-hosted deployments
4. Use both `dynamic = 'force-dynamic'` AND `runtime = 'nodejs'` for API routes with runtime features

## Next Steps After Reboot
1. Check Vercel deployment status for commit `956f7df0`
2. If still failing, check Vercel build logs for any new errors
3. Test OAuth login on deployed site
4. Verify all features work without Slack configured
5. Test document upload and dataroom access

## Troubleshooting Commands
```bash
# Check build locally
npm run build

# Check specific file for dynamic exports
grep -n "export const" app/api/*/route.ts

# Find routes using runtime features
grep -l "getServerSession\|cookies()\|headers()\|searchParams" app/**/route.ts

# Check Redis usage
grep -n "redis\." file.ts
```

## Contact
Repository: j4jonathan/papermark
Deployment: Vercel (vdr.unsensible.com)