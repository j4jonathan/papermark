# Papermark VDR Deployment Notes

## Critical Database Configuration for Vercel

### Prisma with Supabase Connection Pooling

When using Supabase's connection pooler (pgbouncer) with Prisma on Vercel, you MUST add query parameters to prevent prepared statement errors:

```env
# Pooled connections - MUST include pgbouncer parameters
DATABASE_URL="postgresql://[pooler-username]:[password]@[pooler-host]:6543/postgres?pgbouncer=true&connection_limit=1"
POSTGRES_PRISMA_URL="postgresql://[pooler-username]:[password]@[pooler-host]:6543/postgres?pgbouncer=true&connection_limit=1"

# Non-pooled connection - NO parameters needed
POSTGRES_PRISMA_URL_NON_POOLING="postgresql://postgres:[password]@[direct-host]:5432/postgres"
```

### Why This Is Required

1. **pgbouncer=true**: Tells Prisma to use pgbouncer-compatible mode, disabling prepared statements
2. **connection_limit=1**: Ensures each request uses a single connection to avoid pooling conflicts

Without these parameters, you'll encounter errors like:
- `PostgresError { code: "42P05", message: "prepared statement \"s3\" already exists" }`
- Login gets stuck or fails silently
- Database queries timeout or fail intermittently

### Environment Variables Required in Vercel

You MUST set ALL of these in your Vercel deployment:

1. **DATABASE_URL** - With pgbouncer parameters
2. **POSTGRES_PRISMA_URL** - With pgbouncer parameters
3. **POSTGRES_PRISMA_URL_NON_POOLING** - Direct connection without parameters
4. **DIRECT_DATABASE_URL** - For migrations (same as NON_POOLING)

### Updating Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Update the pooled database URLs to include `?pgbouncer=true&connection_limit=1`
4. Keep non-pooled URLs without any query parameters
5. Redeploy your application

### Self-Hosted Configuration

For self-hosted deployments, ensure:
```env
NEXT_PUBLIC_IS_SELF_HOSTED=true
```

This enables all premium features without plan restrictions.

## Troubleshooting

If login still fails after updating:
1. Clear browser cookies for the domain
2. Check Vercel function logs for any remaining database errors
3. Ensure all database environment variables are properly set
4. Verify OAuth credentials are correctly configured