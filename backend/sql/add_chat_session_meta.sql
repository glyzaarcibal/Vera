alter table public.chat_sessions
add column if not exists session_meta jsonb default '{}'::jsonb;
