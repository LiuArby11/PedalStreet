create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate_username text;
  attempt integer := 0;
begin
  base_username := lower(
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      split_part(new.email, '@', 1)
    )
  );

  if coalesce(base_username, '') = '' then
    base_username := 'user';
  end if;

  loop
    candidate_username := case
      when attempt = 0 then base_username
      when attempt = 1 then base_username || '_' || substring(new.id::text from 1 for 8)
      else base_username || '_' || substring(new.id::text from 1 for 8) || '_' || attempt::text
    end;

    begin
      insert into public.profiles (id, first_name, last_name, username, phone, address, email_copy, is_admin)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'firstName', ''),
        coalesce(new.raw_user_meta_data->>'lastName', ''),
        candidate_username,
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
          end,
          username = case
            when coalesce(public.profiles.username, '') = '' then excluded.username
            else public.profiles.username
          end;

      return new;
    exception
      when unique_violation then
        attempt := attempt + 1;
        if attempt > 8 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
