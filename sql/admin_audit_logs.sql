create extension if not exists pgcrypto;

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  actor_name text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  restored_at timestamptz,
  restored_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created_at
  on public.admin_audit_logs (created_at desc);

create index if not exists idx_admin_audit_logs_actor_id
  on public.admin_audit_logs (actor_id);

create index if not exists idx_admin_audit_logs_entity
  on public.admin_audit_logs (entity_type, entity_id);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admin can read audit logs" on public.admin_audit_logs;
create policy "Admin can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

drop policy if exists "Admin can insert audit logs" on public.admin_audit_logs;
create policy "Admin can insert audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

drop policy if exists "Admin can update audit logs" on public.admin_audit_logs;
create policy "Admin can update audit logs"
on public.admin_audit_logs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);
