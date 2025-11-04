-- ============================================================================
-- Migration: Disable RLS for Backend-Only Tables
-- Date: 2025-11-04
-- Description: Disables RLS for generations and generation_error_logs tables
--              as they are backend-only tables accessed through API endpoints.
--              Security is enforced at the API level (JWT validation).
-- ============================================================================

-- Remove existing policies first
drop policy if exists generations_insert_policy on public.generations;
drop policy if exists generations_update_policy on public.generations;
drop policy if exists generation_error_logs_insert_policy on public.generation_error_logs;

-- Disable RLS on backend-only tables
alter table public.generations disable row level security;
alter table public.generation_error_logs disable row level security;

-- Add comments explaining the security model
comment on table public.generations is 
  'Backend-only table for AI generation metrics. RLS disabled - security enforced at API level via JWT validation.';
  
comment on table public.generation_error_logs is 
  'Backend-only table for error logging. RLS disabled - security enforced at API level via JWT validation.';

