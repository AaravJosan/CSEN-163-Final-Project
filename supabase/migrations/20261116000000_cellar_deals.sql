-- Cellar Deals database: products, student profiles (dining points) and orders.
--
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- It is safe to re-run `select public.reset_demo_inventory();` later to restock
-- the sample items and move their best-by dates back to today/tomorrow.
--
-- Points, stock and order status are only changed through the functions at the
-- bottom of this file (place_order, cancel_order, ...). The tables have no
-- insert/update policies for students, so the browser can't edit them directly.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('Meals', 'Drinks', 'Fruit', 'Salads', 'Snacks')),
  kind text not null check (kind in ('Meal', 'Drink', 'Fruit', 'Salad')),
  description text not null default '',
  original_price numeric(8, 2) check (original_price >= 0),
  price numeric(8, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  best_by timestamptz not null,
  tag_label text not null default 'In stock',
  tag_tone text not null default 'neutral' check (tag_tone in ('deal', 'free', 'neutral')),
  allergens text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  points numeric(10, 2) not null default 42.50 check (points >= 0),
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'preparing'
    check (status in ('preparing', 'ready', 'picked-up', 'cancelled', 'unclaimed')),
  -- [{ "id", "name", "kind", "quantity", "unitPrice" }], copied at purchase time
  items jsonb not null,
  total numeric(10, 2) not null check (total >= 0),
  pickup_start timestamptz not null,
  pickup_end timestamptz not null,
  created_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
-- Codes are short (CD-1234), so they only need to be unique among open orders.
create unique index orders_active_code_idx on public.orders (code)
  where status in ('preparing', 'ready');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_staff from public.profiles where id = auth.uid()), false);
$$;

-- 9:00 PM Cellar time, `days_from_today` days from now.
create function public.cellar_best_by(days_from_today integer)
returns timestamptz
language sql
stable
as $$
  select ((now() at time zone 'America/Los_Angeles')::date + days_from_today + time '21:00')
    at time zone 'America/Los_Angeles';
$$;

-- Puts an order's items back on sale.
create function public.restock_items(p_items jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p
  set stock = p.stock + x.quantity
  from (
    select id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as t (id text, quantity integer)
    group by id
  ) x
  where p.id = x.id;
$$;

-- ---------------------------------------------------------------------------
-- New sign-ins: only @scu.edu accounts, each gets a profile with starting points
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or lower(new.email) not like '%@scu.edu' then
    raise exception 'Only @scu.edu accounts can use Cellar Deals.';
  end if;

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that signed in before this file was run.
insert into public.profiles (id, email, full_name)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
from auth.users
where lower(email) like '%@scu.edu'
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

create policy "Signed-in users can view products"
  on public.products for select to authenticated
  using (true);

create policy "Staff can add products"
  on public.products for insert to authenticated
  with check (public.is_staff());

create policy "Staff can update products"
  on public.products for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "Users can view their own profile; staff can view all"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

create policy "Students can view their own orders; staff can view all"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- ---------------------------------------------------------------------------
-- Actions (called from the app with supabase.rpc)
-- ---------------------------------------------------------------------------

-- Checks stock, expiry and points, then takes the stock and points and creates
-- the order, all in one transaction. Errors are shown to the student as-is.
create function public.place_order(
  p_items jsonb,
  p_pickup_start timestamptz,
  p_pickup_end timestamptz
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_points numeric(10, 2);
  v_item jsonb;
  v_qty integer;
  v_product public.products%rowtype;
  v_total numeric(10, 2) := 0;
  v_lines jsonb := '[]'::jsonb;
  v_code text;
  v_order public.orders%rowtype;
begin
  if v_user is null then
    raise exception 'Sign in to place an order.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if p_pickup_start is null or p_pickup_end is null
     or p_pickup_end <= p_pickup_start
     or p_pickup_end <= now()
     or p_pickup_start > now() + interval '3 days' then
    raise exception 'Choose a pickup window that hasn''t ended yet.';
  end if;

  select points into v_points from public.profiles where id = v_user for update;
  if not found then
    raise exception 'No dining account found for this login.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Each item needs a quantity of at least 1.';
    end if;

    select * into v_product from public.products where id = v_item ->> 'product_id' for update;
    if not found then
      raise exception 'An item in your cart is no longer available. Remove it and try again.';
    end if;
    if v_product.best_by <= now() then
      raise exception '% passed its best-by time. Remove it to continue.', v_product.name;
    end if;
    if v_product.stock < v_qty then
      if v_product.stock = 0 then
        raise exception '% sold out. Remove it to continue.', v_product.name;
      end if;
      raise exception 'Only % % left. Update your cart to continue.', v_product.stock, v_product.name;
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;
    v_total := v_total + v_product.price * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'kind', v_product.kind,
      'quantity', v_qty,
      'unitPrice', v_product.price
    ));
  end loop;

  if v_total > v_points then
    -- The app looks for this prefix to open the Add funds dialog.
    raise exception 'INSUFFICIENT_FUNDS:You need $% more in dining points.',
      to_char(v_total - v_points, 'FM999990.00');
  end if;

  update public.profiles set points = points - v_total where id = v_user;

  loop
    v_code := 'CD-' || (1000 + floor(random() * 9000))::integer::text;
    exit when not exists (
      select 1 from public.orders where code = v_code and status in ('preparing', 'ready')
    );
  end loop;

  insert into public.orders (code, user_id, items, total, pickup_start, pickup_end)
  values (v_code, v_user, v_lines, v_total, p_pickup_start, p_pickup_end)
  returning * into v_order;

  return v_order;
end;
$$;

-- Students can cancel until the order is Ready: points and stock go back.
create function public.cancel_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders
  where id = p_order_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  if v_order.status <> 'preparing' then
    raise exception 'Only orders that are still being prepared can be cancelled.';
  end if;

  perform public.restock_items(v_order.items);
  update public.profiles set points = points + v_order.total where id = v_order.user_id;
  update public.orders set status = 'cancelled' where id = v_order.id returning * into v_order;
  return v_order;
end;
$$;

-- Staff: preparing → ready → picked up.
create function public.advance_order_status(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Only Cellar staff can update orders.';
  end if;

  update public.orders
  set status = case status when 'preparing' then 'ready' else 'picked-up' end
  where id = p_order_id and status in ('preparing', 'ready')
  returning * into v_order;
  if not found then
    raise exception 'This order can''t be updated.';
  end if;
  return v_order;
end;
$$;

-- Demo top-up: no real payment is made.
create function public.add_funds(p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'Sign in to add funds.';
  end if;
  if p_amount is null or p_amount not in (10, 25, 50, 100) then
    raise exception 'Choose $10, $25, $50 or $100.';
  end if;

  update public.profiles set points = points + p_amount
  where id = auth.uid()
  returning points into v_points;
  if not found then
    raise exception 'No dining account found for this login.';
  end if;
  return v_points;
end;
$$;

-- Orders not picked up by the end of their window go back on sale and are refunded.
-- The app calls this when it loads; it is safe to call any number of times.
create function public.release_unclaimed_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_count integer := 0;
begin
  for v_order in
    select * from public.orders
    where status in ('preparing', 'ready') and pickup_end < now()
    for update skip locked
  loop
    perform public.restock_items(v_order.items);
    update public.profiles set points = points + v_order.total where id = v_order.user_id;
    update public.orders set status = 'unclaimed' where id = v_order.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Sample inventory. Restocks every sample item and resets its best-by date
-- relative to today, so the demo always has items expiring today.
create function public.reset_demo_inventory()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Runs from the SQL editor (no signed-in user) or for staff.
  if auth.uid() is not null and not public.is_staff() then
    raise exception 'Only Cellar staff can reset the inventory.';
  end if;

  insert into public.products
    (id, name, category, kind, description, original_price, price, stock, best_by, tag_label, tag_tone, allergens)
  values
    ('turkey-pesto-sandwich', 'Turkey Pesto Sandwich', 'Meals', 'Meal',
     'Sliced turkey, basil pesto, provolone and tomato on ciabatta. Made fresh this morning at the Cellar.',
     9.50, 4.75, 2, public.cellar_best_by(0), 'Expires today', 'deal', '{nuts,dairy,gluten}'),
    ('california-roll', 'California Roll', 'Meals', 'Meal',
     'Crab, avocado and cucumber rolled in sesame rice. Eight pieces with soy sauce on the side.',
     7.00, 3.50, 3, public.cellar_best_by(0), '50% off', 'deal', '{shellfish,soy,sesame}'),
    ('cold-brew-coffee', 'Cold Brew Coffee', 'Drinks', 'Drink',
     'Slow-steeped cold brew, served black. 16 oz.',
     4.25, 0, 1, public.cellar_best_by(0), 'Free', 'free', '{}'),
    ('mixed-fruit-cup', 'Mixed Fruit Cup', 'Fruit', 'Fruit',
     'Melon, pineapple, grapes and berries, cut this morning.',
     null, 3.95, 4, public.cellar_best_by(0), 'Buy 1 get 1', 'deal', '{}'),
    ('caesar-salad', 'Caesar Salad', 'Salads', 'Salad',
     'Romaine, shaved parmesan, garlic croutons and Caesar dressing.',
     8.25, 5.50, 3, public.cellar_best_by(1), 'Expires tomorrow', 'deal', '{dairy,gluten,fish}'),
    ('greek-yogurt-parfait', 'Greek Yogurt Parfait', 'Snacks', 'Fruit',
     'Greek yogurt layered with berries, honey and granola.',
     4.50, 2.25, 2, public.cellar_best_by(0), 'Expires today', 'deal', '{dairy,nuts}'),
    ('chocolate-milk', 'Chocolate Milk', 'Drinks', 'Drink',
     'Low-fat chocolate milk from a local dairy. 12 oz.',
     null, 2.75, 10, public.cellar_best_by(4), 'In stock', 'neutral', '{dairy}'),
    ('hummus-pita', 'Hummus & Pita', 'Snacks', 'Salad',
     'Classic hummus with warm pita wedges, cucumber and carrots.',
     6.00, 3.00, 4, public.cellar_best_by(1), '50% off', 'deal', '{gluten,sesame}'),
    ('chicken-caesar-wrap', 'Chicken Caesar Wrap', 'Meals', 'Meal',
     'Grilled chicken, romaine, parmesan and Caesar dressing in a flour tortilla.',
     null, 8.95, 6, public.cellar_best_by(2), 'In stock', 'neutral', '{dairy,gluten,fish}'),
    ('green-smoothie', 'Green Smoothie', 'Drinks', 'Drink',
     'Spinach, mango, banana and apple juice, blended this morning.',
     6.50, 3.25, 2, public.cellar_best_by(0), 'Expires today', 'deal', '{}'),
    ('apple-slices', 'Apple Slices', 'Fruit', 'Fruit',
     'Crisp sliced apples with a side of peanut butter.',
     null, 1.50, 12, public.cellar_best_by(3), 'In stock', 'neutral', '{peanuts}'),
    ('spicy-tuna-roll', 'Spicy Tuna Roll', 'Meals', 'Meal',
     'Tuna, spicy mayo and cucumber rolled in seasoned rice.',
     7.50, 0, 1, public.cellar_best_by(0), 'Free', 'free', '{fish,soy,eggs}'),
    ('garden-salad', 'Garden Salad', 'Salads', 'Salad',
     'Mixed greens, cherry tomatoes, cucumber and balsamic vinaigrette.',
     6.00, 4.00, 5, public.cellar_best_by(1), 'Expires tomorrow', 'deal', '{}'),
    ('pretzel-bites', 'Pretzel Bites', 'Snacks', 'Meal',
     'Soft pretzel bites with warm cheddar dip.',
     5.00, 2.50, 6, public.cellar_best_by(1), '50% off', 'deal', '{gluten,dairy}'),
    ('banana', 'Banana', 'Fruit', 'Fruit',
     'A ripe banana. Good for a quick snack between classes.',
     null, 0.75, 15, public.cellar_best_by(2), 'In stock', 'neutral', '{}'),
    ('sparkling-water', 'Sparkling Water', 'Drinks', 'Drink',
     'Lime sparkling water. 12 oz can.',
     null, 1.50, 20, public.cellar_best_by(7), 'In stock', 'neutral', '{}')
  on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    kind = excluded.kind,
    description = excluded.description,
    original_price = excluded.original_price,
    price = excluded.price,
    stock = excluded.stock,
    best_by = excluded.best_by,
    tag_label = excluded.tag_label,
    tag_tone = excluded.tag_tone,
    allergens = excluded.allergens;
end;
$$;

-- Internal helpers aren't callable from the app; actions need a signed-in user.
revoke execute on function public.restock_items(jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.place_order(jsonb, timestamptz, timestamptz) from public, anon;
revoke execute on function public.cancel_order(uuid) from public, anon;
revoke execute on function public.advance_order_status(uuid) from public, anon;
revoke execute on function public.add_funds(numeric) from public, anon;
revoke execute on function public.release_unclaimed_orders() from public, anon;
revoke execute on function public.reset_demo_inventory() from public, anon;
grant execute on function public.place_order(jsonb, timestamptz, timestamptz) to authenticated;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.advance_order_status(uuid) to authenticated;
grant execute on function public.add_funds(numeric) to authenticated;
grant execute on function public.release_unclaimed_orders() to authenticated;
grant execute on function public.reset_demo_inventory() to authenticated;

-- Live updates: staff see new orders and students see status changes right away.
alter publication supabase_realtime add table public.products, public.orders, public.profiles;

select public.reset_demo_inventory();
