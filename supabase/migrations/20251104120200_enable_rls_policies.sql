-- ============================================================================
-- Migration: Configure Row Level Security Policies
-- Author: AI Assistant
-- Date: 2025-11-04
-- Description: Defines RLS policies for the flashcards table to ensure users
--              can only access their own data. The generations and 
--              generation_error_logs tables remain without policies as they
--              are intended for backend/admin access only.
-- Tables Modified:
--   - flashcards: Full CRUD policies for authenticated users
-- Security Model:
--   - Users can only access flashcards where user_id matches their auth.uid()
--   - Anonymous users have no access to any flashcards
--   - All operations (SELECT, INSERT, UPDATE, DELETE) are restricted
-- Notes:
--   - RLS was already enabled in table creation migration
--   - Policies are granular: one per operation per role
--   - generations and generation_error_logs have no policies (backend only)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies for: flashcards
-- Security Model: Users can only access their own flashcards
-- Roles: authenticated users only (anon users have no access)
-- ----------------------------------------------------------------------------

-- Policy: SELECT for authenticated users
-- Purpose: Allows users to read only their own flashcards
-- Condition: The user_id column must match the authenticated user's ID
-- Used by: All user-facing queries that retrieve flashcards (US-010, US-011)
-- Performance: Subquery ensures auth.uid() is evaluated once, not per row
create policy flashcards_select_policy
  on public.flashcards
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Policy: INSERT for authenticated users
-- Purpose: Allows users to create new flashcards only for themselves
-- Condition: The user_id being inserted must match the authenticated user's ID
-- Used by: Manual flashcard creation (US-008) and AI generation acceptance (US-007)
-- Note: This prevents users from creating flashcards owned by other users
-- Performance: Subquery ensures auth.uid() is evaluated once, not per row
create policy flashcards_insert_policy
  on public.flashcards
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Policy: UPDATE for authenticated users
-- Purpose: Allows users to update only their own flashcards
-- Condition: The user_id column must match the authenticated user's ID
-- Used by: Flashcard editing functionality (US-009)
-- Note: This applies to the existing row, preventing updates to other users' cards
-- Performance: Subquery ensures auth.uid() is evaluated once, not per row
create policy flashcards_update_policy
  on public.flashcards
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policy: DELETE for authenticated users
-- Purpose: Allows users to delete only their own flashcards
-- Condition: The user_id column must match the authenticated user's ID
-- Used by: Flashcard deletion functionality (US-012)
-- Note: Combined with ON DELETE CASCADE, ensures complete data removal
-- Performance: Subquery ensures auth.uid() is evaluated once, not per row
create policy flashcards_delete_policy
  on public.flashcards
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Add comments to policies for documentation
comment on policy flashcards_select_policy on public.flashcards is 
  'Allows authenticated users to read only their own flashcards';
comment on policy flashcards_insert_policy on public.flashcards is 
  'Allows authenticated users to create flashcards only for themselves';
comment on policy flashcards_update_policy on public.flashcards is 
  'Allows authenticated users to update only their own flashcards';
comment on policy flashcards_delete_policy on public.flashcards is 
  'Allows authenticated users to delete only their own flashcards';

-- ----------------------------------------------------------------------------
-- RLS Policies for: generations
-- Security Model: No user-facing access - backend/analytics only
-- ----------------------------------------------------------------------------
-- Note: This table has RLS enabled but no policies defined.
-- Access should be controlled at the application/API level.
-- Only backend services and admin tools should interact with this table.
-- If future requirements need user access to their generation history,
-- policies similar to flashcards can be added.

-- ----------------------------------------------------------------------------
-- RLS Policies for: generation_error_logs
-- Security Model: No user-facing access - admin/monitoring only
-- ----------------------------------------------------------------------------
-- Note: This table has RLS enabled but no policies defined.
-- Access should be strictly controlled at the application/API level.
-- Only administrators and monitoring systems should access this data.
-- Users should never have direct access to error logs for security reasons.

