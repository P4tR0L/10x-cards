-- ============================================================================
-- Migration: Create Database Indexes
-- Author: AI Assistant
-- Date: 2025-11-04
-- Description: Creates indexes on flashcards, generations, and 
--              generation_error_logs tables to optimize query performance.
-- Tables Modified:
--   - flashcards: 6 indexes for user queries, filtering, sorting, and search
--   - generations: 4 indexes for analytics and metrics aggregation
--   - generation_error_logs: 4 indexes for error analysis and monitoring
-- Notes:
--   - Indexes are designed based on expected query patterns
--   - GIN index on flashcards enables full-text search capability
--   - Composite indexes optimize common query combinations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for: flashcards
-- Purpose: Optimize user flashcard queries, filtering, sorting, and search
-- ----------------------------------------------------------------------------

-- Index on user_id: Critical for filtering flashcards by user (US-010)
-- Most common query pattern: SELECT * FROM flashcards WHERE user_id = ?
create index if not exists idx_flashcards_user_id 
  on public.flashcards using btree (user_id);

-- Index on generation_id: Enables fast retrieval of all cards from a generation session
-- Used for analytics and displaying generation results
create index if not exists idx_flashcards_generation_id 
  on public.flashcards using btree (generation_id);

-- Index on created_at: Optimizes default sorting (newest first)
-- DESC order matches most common sorting pattern
create index if not exists idx_flashcards_created_at 
  on public.flashcards using btree (created_at desc);

-- Composite index on user_id + created_at: Optimizes most frequent query pattern
-- Combines user filtering with chronological sorting in single index
-- This is the primary access pattern for displaying user's flashcards
create index if not exists idx_flashcards_user_created 
  on public.flashcards using btree (user_id, created_at desc);

-- Index on source: Enables fast filtering by flashcard source (manual/ai)
-- Used for analytics and user interface filtering
create index if not exists idx_flashcards_source 
  on public.flashcards using btree (source);

-- GIN index for full-text search: Enables search across front and back content
-- Used for search/filter functionality (US-011)
-- Note: This creates a GIN index on tsvector for efficient text search
create index if not exists idx_flashcards_front_back_gin 
  on public.flashcards using gin (
    to_tsvector('english', coalesce(front, '') || ' ' || coalesce(back, ''))
  );

-- Add comments to indexes for documentation
comment on index public.idx_flashcards_user_id is 'Optimizes filtering flashcards by user';
comment on index public.idx_flashcards_generation_id is 'Optimizes retrieving flashcards from specific generation session';
comment on index public.idx_flashcards_created_at is 'Optimizes sorting flashcards by creation date';
comment on index public.idx_flashcards_user_created is 'Composite index optimizing user filtering with chronological sorting';
comment on index public.idx_flashcards_source is 'Optimizes filtering flashcards by source type';
comment on index public.idx_flashcards_front_back_gin is 'Enables full-text search across flashcard content';

-- ----------------------------------------------------------------------------
-- Indexes for: generations
-- Purpose: Optimize analytics queries and metrics aggregation
-- ----------------------------------------------------------------------------

-- Index on user_id: Enables fast metrics aggregation per user
-- Used for user-specific analytics and reporting
create index if not exists idx_generations_user_id 
  on public.generations using btree (user_id);

-- Index on model: Optimizes performance analysis by AI model
-- Used to compare quality and acceptance rates across different models
create index if not exists idx_generations_model 
  on public.generations using btree (model);

-- Index on created_at: Optimizes time-series analysis and trending
-- DESC order matches most common pattern (recent data first)
create index if not exists idx_generations_created_at 
  on public.generations using btree (created_at desc);

-- Index on source_text_hash: Enables duplicate detection and popular content analysis
-- Used to identify repeated generation attempts and successful patterns
create index if not exists idx_generations_source_hash 
  on public.generations using btree (source_text_hash);

-- Add comments to indexes for documentation
comment on index public.idx_generations_user_id is 'Optimizes per-user metrics aggregation';
comment on index public.idx_generations_model is 'Optimizes analysis and comparison across AI models';
comment on index public.idx_generations_created_at is 'Optimizes time-series analysis of generation metrics';
comment on index public.idx_generations_source_hash is 'Enables duplicate detection and popular content analysis';

-- ----------------------------------------------------------------------------
-- Indexes for: generation_error_logs
-- Purpose: Optimize error analysis, debugging, and monitoring queries
-- ----------------------------------------------------------------------------

-- Index on user_id: Enables fast error filtering per user
-- Used to identify problematic accounts or user-specific issues
create index if not exists idx_generation_error_logs_user_id 
  on public.generation_error_logs using btree (user_id);

-- Index on model: Optimizes error analysis by AI model
-- Used to identify models with highest error rates
create index if not exists idx_generation_error_logs_model 
  on public.generation_error_logs using btree (model);

-- Index on created_at: Optimizes retrieval of recent errors
-- DESC order matches most common pattern (recent errors first)
-- Critical for monitoring and alerting systems
create index if not exists idx_generation_error_logs_created_at 
  on public.generation_error_logs using btree (created_at desc);

-- Index on source_text_hash: Enables identification of problematic input patterns
-- Used to find source texts that consistently cause errors
create index if not exists idx_generation_error_logs_source_hash 
  on public.generation_error_logs using btree (source_text_hash);

-- Add comments to indexes for documentation
comment on index public.idx_generation_error_logs_user_id is 'Optimizes per-user error filtering';
comment on index public.idx_generation_error_logs_model is 'Optimizes error analysis by AI model';
comment on index public.idx_generation_error_logs_created_at is 'Optimizes retrieval of recent errors for monitoring';
comment on index public.idx_generation_error_logs_source_hash is 'Enables identification of problematic source texts';

