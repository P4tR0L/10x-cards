-- ============================================================================
-- Migration: Fix RLS for Backend-Only Tables
-- Date: 2025-11-04
-- Description: Adds RLS policies for generations and generation_error_logs tables
--              to allow authenticated users (API) to insert records.
--              These tables are backend-only, so we allow all authenticated 
--              users to insert (the API validates user_id server-side).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies for: generations
-- Security Model: Backend can insert/update, no user-facing access
-- ----------------------------------------------------------------------------

-- Policy: INSERT for authenticated users (API endpoints)
-- Purpose: Allows API to create generation records
-- Note: user_id is validated server-side in the API endpoint
create policy generations_insert_policy
  on public.generations
  for insert
  to authenticated
  with check (true);

-- Policy: UPDATE for authenticated users (API endpoints)
-- Purpose: Allows API to update generation metrics (acceptance counts)
-- Note: user_id is validated server-side in the API endpoint
create policy generations_update_policy
  on public.generations
  for update
  to authenticated
  using (true)
  with check (true);

-- Add comments to policies for documentation
comment on policy generations_insert_policy on public.generations is 
  'Allows API endpoints to create generation records (user_id validated server-side)';
comment on policy generations_update_policy on public.generations is 
  'Allows API endpoints to update generation metrics (user_id validated server-side)';

-- ----------------------------------------------------------------------------
-- RLS Policies for: generation_error_logs
-- Security Model: Backend can insert for error logging, no user-facing access
-- ----------------------------------------------------------------------------

-- Policy: INSERT for authenticated users (API endpoints)
-- Purpose: Allows API to log generation errors
-- Note: This is for system logging, user_id can be null
create policy generation_error_logs_insert_policy
  on public.generation_error_logs
  for insert
  to authenticated
  with check (true);

-- Add comment to policy for documentation
comment on policy generation_error_logs_insert_policy on public.generation_error_logs is 
  'Allows API endpoints to log generation errors for debugging and monitoring';

