create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "Public can read health category order" on public.app_settings;
create policy "Public can read health category order"
on public.app_settings for select to public
using (key = 'health_category_order');

-- Admin mutations are performed server-side with SUPABASE_SECRET_KEY.
