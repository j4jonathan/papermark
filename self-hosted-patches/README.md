# Self-Hosted Papermark Configuration

This directory contains patches and scripts to enable all features for self-hosted Papermark deployments without modifying the core codebase.

## Quick Start

1. **First Time Setup:**
   ```bash
   cd ~/GitHub/unsensible/papermark
   ./self-hosted-patches/apply-patches.sh
   ```

2. **After Pulling Updates:**
   ```bash
   git pull upstream main
   ./self-hosted-patches/apply-patches.sh
   ```

## What This Does

- Enables all premium features (Datarooms, unlimited documents, etc.)
- Sets your team to 'business' plan with unlimited limits
- Bypasses billing/subscription checks
- Maintains compatibility with upstream updates

## Components

### 1. Environment Variable
Adds `NEXT_PUBLIC_IS_SELF_HOSTED=true` to enable self-hosted mode.

### 2. Database Migration
Updates all teams to 'business' plan with unlimited features.

### 3. Code Patch
Minimal modification to `use-billing.ts` to check for self-hosted mode.

## Files

- `apply-patches.sh` - Main script to apply all patches
- `database-setup.sql` - SQL to enable all features
- `code-patches/use-billing.patch` - Code modifications
- `.env.self-hosted` - Environment template

## Maintenance

When updating Papermark:
1. Pull latest changes: `git pull upstream main`
2. Re-apply patches: `./self-hosted-patches/apply-patches.sh`
3. Run migrations: `npm run dev:prisma`

## Reverting

To revert to standard mode:
1. Remove `NEXT_PUBLIC_IS_SELF_HOSTED` from `.env`
2. Run: `git checkout lib/swr/use-billing.ts`
3. Update database: `psql -c "UPDATE \"Team\" SET plan='free'"`

## Notes

- These patches are designed to survive updates
- Only modifies ~10 lines of code
- No impact on core functionality
- Can be easily removed if needed

---
Last Updated: $(date +%Y-%m-%d)