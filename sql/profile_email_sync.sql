alter table public.profiles
add column if not exists email_copy text;

update public.profiles p
set email_copy = u.email
from auth.users u
where p.id = u.id
  and (p.email_copy is null or trim(p.email_copy) = '');

create unique index if not exists profiles_email_copy_unique_idx
on public.profiles (lower(email_copy))
where email_copy is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, username, phone, email_copy, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'firstName', ''),
    coalesce(new.raw_user_meta_data->>'lastName', ''),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    false
  )
  on conflict (id) do update
  set email_copy = excluded.email_copy;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
