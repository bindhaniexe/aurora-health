-- Migration: Add unique constraint on sleep_logs(user_id, sleep_date)
-- This enables upsert (ON CONFLICT) so one log per day per user is enforced.

alter table public.sleep_logs
  add constraint uq_sleep_logs_user_date unique (user_id, sleep_date);
