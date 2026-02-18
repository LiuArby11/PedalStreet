alter table public.orders
add column if not exists payment_status text not null default 'PENDING';

alter table public.orders
drop constraint if exists orders_payment_status_check;

alter table public.orders
add constraint orders_payment_status_check
check (payment_status in ('PENDING', 'CONFIRMED', 'PAID'));

create index if not exists idx_orders_payment_status
on public.orders (payment_status);

do $$
begin
  if exists (
    select 1
    from public.products
    where coalesce(is_archived, false) = false
    group by lower(trim(name))
    having count(*) > 1
  ) then
    raise notice 'Active duplicate product names detected. Resolve duplicates before enforcing unique index.';
  else
    create unique index if not exists products_active_name_unique_idx
      on public.products (lower(trim(name)))
      where coalesce(is_archived, false) = false;
  end if;
end;
$$;
