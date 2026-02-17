alter table public.profiles
add column if not exists address text;

alter table public.orders
add column if not exists delivery_instructions text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, username, phone, address, email_copy, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'firstName', ''),
    coalesce(new.raw_user_meta_data->>'lastName', ''),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    new.email,
    false
  )
  on conflict (id) do update
  set email_copy = excluded.email_copy,
      phone = case
        when coalesce(public.profiles.phone, '') = '' then excluded.phone
        else public.profiles.phone
      end,
      address = case
        when coalesce(public.profiles.address, '') = '' then excluded.address
        else public.profiles.address
      end;

  return new;
end;
$$;
