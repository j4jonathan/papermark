-- Self-Hosted Papermark Database Setup
-- This script enables all features for self-hosted deployments

-- Update all existing teams to business plan with unlimited features
UPDATE "Team"
SET
  plan = 'business',
  limits = jsonb_build_object(
    'users', 1000,
    'links', null,
    'documents', null,
    'domains', 100,
    'datarooms', 1000,
    'customDomainOnPro', true,
    'customDomainInDataroom', true,
    'advancedLinkControlsOnPro', true
  )
WHERE
  plan IN ('free', 'starter', 'pro')
  OR plan IS NULL;

-- Ensure all teams have proper limits set
UPDATE "Team"
SET
  limits = jsonb_build_object(
    'users', 1000,
    'links', null,
    'documents', null,
    'domains', 100,
    'datarooms', 1000,
    'customDomainOnPro', true,
    'customDomainInDataroom', true,
    'advancedLinkControlsOnPro', true
  )
WHERE
  limits IS NULL
  OR (limits->>'datarooms')::int < 100;

-- Optional: Enable advanced mode for all teams
UPDATE "Team"
SET
  "enableExcelAdvancedMode" = true;

-- Report results
SELECT
  COUNT(*) as teams_updated,
  plan,
  limits->>'datarooms' as dataroom_limit
FROM "Team"
GROUP BY plan, limits->>'datarooms';

-- Verify the update
SELECT
  id,
  name,
  plan,
  limits->>'datarooms' as dataroom_limit,
  "createdAt"
FROM "Team"
ORDER BY "createdAt" DESC;