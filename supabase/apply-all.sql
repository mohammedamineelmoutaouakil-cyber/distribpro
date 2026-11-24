-- =============================================================
-- Fichier : supabase/migrations/0001_schema.sql
-- =============================================================

-- ============================================================================
-- DistribPro â€” 0001 schema
-- Multi-tenant B2B ordering platform. All money is stored as BIGINT centimes.
-- ============================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type public.company_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.membership_role as enum ('admin', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.customer_status as enum ('invited', 'pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_id as enum ('starter', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('trial', 'active', 'expired', 'suspended');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Companies (tenants)
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sector text,
  description text,
  logo_path text,
  banner_path text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  ice text,
  website text,
  status public.company_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'admin',
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);
create index if not exists company_memberships_user_idx on public.company_memberships(user_id);

-- ---------------------------------------------------------------------------
-- Subscriptions (managed manually by the platform super admin)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan public.plan_id not null default 'starter',
  status public.subscription_status not null default 'trial',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Customer groups & accounts
-- ---------------------------------------------------------------------------
create table if not exists public.customer_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (company_id, slug)
);

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  group_id uuid references public.customer_groups(id) on delete set null,
  company_name text not null check (char_length(company_name) between 2 and 160),
  contact_name text,
  email text not null,
  phone text,
  city text,
  address text,
  ice text,
  status public.customer_status not null default 'invited',
  invite_token uuid unique default gen_random_uuid(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customer_accounts_company_email_idx
  on public.customer_accounts(company_id, lower(email));
create index if not exists customer_accounts_user_idx on public.customer_accounts(user_id);
create index if not exists customer_accounts_company_status_idx on public.customer_accounts(company_id, status);
create index if not exists customer_accounts_invite_token_idx on public.customer_accounts(invite_token);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);
create index if not exists categories_company_idx on public.categories(company_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(name) between 2 and 180),
  sku text not null check (char_length(sku) between 1 and 64),
  description text,
  image_path text,
  base_price_centimes bigint not null check (base_price_centimes >= 0),
  min_order_qty integer not null default 1 check (min_order_qty between 1 and 100000),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists products_company_sku_idx on public.products(company_id, lower(sku));
create index if not exists products_company_active_idx on public.products(company_id, is_active);
create index if not exists products_company_category_idx on public.products(company_id, category_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id);

-- ---------------------------------------------------------------------------
-- Personalized pricing
-- ---------------------------------------------------------------------------
create table if not exists public.customer_group_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  group_id uuid not null references public.customer_groups(id) on delete cascade,
  price_centimes bigint not null check (price_centimes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, group_id)
);
create index if not exists group_prices_company_idx on public.customer_group_prices(company_id);
create index if not exists group_prices_group_idx on public.customer_group_prices(group_id);

create table if not exists public.customer_specific_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.customer_accounts(id) on delete cascade,
  price_centimes bigint not null check (price_centimes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, customer_id)
);
create index if not exists customer_prices_company_idx on public.customer_specific_prices(company_id);
create index if not exists customer_prices_customer_idx on public.customer_specific_prices(customer_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customer_accounts(id) on delete restrict,
  reference text not null unique,
  status public.order_status not null default 'pending',
  notes text,
  item_count integer not null default 0 check (item_count >= 0),
  total_centimes bigint not null default 0 check (total_centimes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_company_created_idx on public.orders(company_id, created_at desc);
create index if not exists orders_customer_idx on public.orders(customer_id);
create index if not exists orders_company_status_idx on public.orders(company_id, status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price_centimes bigint not null check (unit_price_centimes >= 0),
  line_total_centimes bigint not null check (line_total_centimes >= 0),
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_company_idx on public.order_items(company_id);

-- ---------------------------------------------------------------------------
-- Platform administration (kept OUTSIDE user-editable auth metadata)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','companies','subscriptions','customer_accounts','categories','products','customer_group_prices','customer_specific_prices','orders']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Profile provisioning on auth signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        phone = coalesce(public.profiles.phone, excluded.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Protect tenant lifecycle fields from wholesaler self-modification.
-- Only platform admins (or service-role/SQL contexts without auth.uid()) may
-- suspend/activate a company.
-- ---------------------------------------------------------------------------
create or replace function public.protect_company_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.status is distinct from old.status
     and not public.is_platform_admin() then
    raise exception 'COMPANY_STATUS_FORBIDDEN';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_company_fields on public.companies;
create trigger protect_company_fields
  before update on public.companies
  for each row execute function public.protect_company_fields();


-- =============================================================
-- Fichier : supabase/migrations/0002_functions.sql
-- =============================================================

-- ============================================================================
-- DistribPro â€” 0002 authorization & business functions
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Authorization helpers. SECURITY DEFINER avoids RLS recursion and ensures
-- membership is resolved from the database, never from client input.
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid()
  );
$$;

create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships m
    where m.company_id = p_company_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships m
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$$;

create or replace function public.current_customer_id(p_company_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.customer_accounts c
  where c.company_id = p_company_id
    and c.user_id = auth.uid()
  order by c.created_at asc
  limit 1;
$$;

create or replace function public.current_customer_group_id(p_company_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.group_id
  from public.customer_accounts c
  where c.company_id = p_company_id
    and c.user_id = auth.uid()
  order by c.created_at asc
  limit 1;
$$;

create or replace function public.company_operational(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies co
    join public.subscriptions s on s.company_id = co.id
    where co.id = p_company_id
      and co.status = 'active'
      and s.status in ('trial', 'active')
      and s.expires_at > now()
  );
$$;

grant execute on function public.is_platform_admin() to authenticated, anon;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.is_company_admin(uuid) to authenticated;
grant execute on function public.current_customer_id(uuid) to authenticated;
grant execute on function public.current_customer_group_id(uuid) to authenticated;
grant execute on function public.company_operational(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Company onboarding: company + admin membership + trial + defaults, atomically.
-- ---------------------------------------------------------------------------
create or replace function public.register_company(
  p_company_name text,
  p_slug text,
  p_sector text default null,
  p_phone text default null,
  p_email text default null,
  p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_company_id uuid;
  v_slug text;
  v_suffix integer := 0;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if length(trim(coalesce(p_company_name, ''))) < 2 then
    raise exception 'INVALID_COMPANY_NAME';
  end if;

  if exists (select 1 from public.company_memberships where user_id = v_user) then
    raise exception 'ALREADY_MEMBER';
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(coalesce(nullif(trim(p_slug), ''), 'entreprise')), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'entreprise'; end if;
  v_slug := left(v_slug, 40);

  while exists (select 1 from public.companies where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := left(v_slug, 40) || '-' || v_suffix::text;
  end loop;

  insert into public.companies (name, slug, sector, phone, email, status)
  values (trim(p_company_name), v_slug, nullif(trim(p_sector), ''), nullif(trim(p_phone), ''), nullif(trim(p_email), ''), 'active')
  returning id into v_company_id;

  insert into public.company_memberships (company_id, user_id, role)
  values (v_company_id, v_user, 'admin');

  insert into public.subscriptions (company_id, plan, status, starts_at, expires_at)
  values (v_company_id, 'starter', 'trial', now(), now() + interval '14 days');

  insert into public.customer_groups (company_id, name, slug, description) values
    (v_company_id, 'Standard', 'standard', 'Client professionnel standard'),
    (v_company_id, 'Professionnel', 'professionnel', 'Client professionnel rÃ©gulier'),
    (v_company_id, 'VIP', 'vip', 'Grand compte, tarifs privilÃ©giÃ©s');

  insert into public.categories (company_id, name, slug, sort_order)
  values (v_company_id, 'GÃ©nÃ©ral', 'general', 0);

  insert into public.profiles (id, full_name, email)
  values (v_user, nullif(trim(p_full_name), ''), p_email)
  on conflict (id) do update
    set full_name = coalesce(nullif(trim(p_full_name), ''), public.profiles.full_name);

  return v_company_id;
end;
$$;

grant execute on function public.register_company(text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Invitation lookup (safe, limited fields, only while invite is pending).
-- ---------------------------------------------------------------------------
create or replace function public.get_invite_info(p_token uuid)
returns table (
  supplier_name text,
  supplier_logo_path text,
  customer_company text,
  email text,
  status public.customer_status
)
language sql
stable
security definer
set search_path = public
as $$
  select co.name, co.logo_path, ca.company_name, ca.email, ca.status
  from public.customer_accounts ca
  join public.companies co on co.id = ca.company_id
  where ca.invite_token = p_token
  limit 1;
$$;

grant execute on function public.get_invite_info(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Accept an invitation: link auth user to the customer account.
-- The invite becomes "pending" and still requires wholesaler approval.
-- ---------------------------------------------------------------------------
create or replace function public.accept_customer_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_customer public.customer_accounts%rowtype;
  v_email text;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_customer
  from public.customer_accounts
  where invite_token = p_token
  for update;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if v_customer.status <> 'invited' then
    raise exception 'INVITE_ALREADY_USED';
  end if;

  select email into v_email from auth.users where id = v_user;
  if v_email is null or lower(v_email) <> lower(v_customer.email) then
    raise exception 'EMAIL_MISMATCH';
  end if;

  update public.customer_accounts
  set user_id = v_user,
      status = 'pending',
      invite_token = null
  where id = v_customer.id;

  return v_customer.id;
end;
$$;

grant execute on function public.accept_customer_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic order creation with authoritative server-side pricing.
-- Pricing priority: individual price > group price > base price.
-- The browser only sends product ids and quantities.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_company_id uuid,
  p_items jsonb,
  p_notes text default null
)
returns table (
  created_order_id uuid,
  order_reference text,
  order_total_centimes bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_customer public.customer_accounts%rowtype;
  v_product public.products%rowtype;
  v_line record;
  v_quantity integer;
  v_price bigint;
  v_line_total bigint;
  v_total bigint := 0;
  v_count integer := 0;
  v_ref text;
  v_order public.orders%rowtype;
  v_snapshot jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_customer
  from public.customer_accounts
  where company_id = p_company_id
    and user_id = v_user
    and status = 'active'
  order by created_at asc
  limit 1;

  if not found then
    raise exception 'CUSTOMER_NOT_ACTIVE';
  end if;

  if not public.company_operational(p_company_id) then
    raise exception 'COMPANY_NOT_OPERATIONAL';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  if jsonb_array_length(p_items) > 100 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  if char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'NOTES_TOO_LONG';
  end if;

  for v_line in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
    group by x.product_id
  loop
    if v_line.product_id is null or v_line.quantity is null or v_line.quantity < 1 or v_line.quantity > 100000 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select * into v_product
    from public.products
    where id = v_line.product_id and company_id = p_company_id
    for update;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    if not v_product.is_active then
      raise exception 'PRODUCT_INACTIVE:%', v_product.name;
    end if;

    if v_line.quantity < v_product.min_order_qty then
      raise exception 'MIN_ORDER_QTY:%:%', v_product.name, v_product.min_order_qty;
    end if;

    select coalesce(
      (
        select p.price_centimes from public.customer_specific_prices p
        where p.product_id = v_product.id and p.customer_id = v_customer.id
      ),
      (
        select p.price_centimes from public.customer_group_prices p
        where p.product_id = v_product.id
          and p.group_id = v_customer.group_id
          and v_customer.group_id is not null
      ),
      v_product.base_price_centimes
    ) into v_price;

    v_line_total := v_price * v_line.quantity;
    v_total := v_total + v_line_total;
    v_count := v_count + 1;

    v_snapshot := v_snapshot || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'sku', v_product.sku,
      'quantity', v_line.quantity,
      'unit_price_centimes', v_price,
      'line_total_centimes', v_line_total
    );
  end loop;

  v_ref := 'DP-' || to_char(now(), 'YYMMDD') || '-' ||
           upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (company_id, customer_id, reference, status, notes, item_count, total_centimes)
  values (p_company_id, v_customer.id, v_ref, 'pending', nullif(trim(p_notes), ''), v_count, v_total)
  returning * into v_order;

  insert into public.order_items (
    order_id, company_id, product_id, product_name, sku,
    quantity, unit_price_centimes, line_total_centimes
  )
  select
    v_order.id,
    p_company_id,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name',
    item ->> 'sku',
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price_centimes')::bigint,
    (item ->> 'line_total_centimes')::bigint
  from jsonb_array_elements(v_snapshot) as item;

  return query select v_order.id, v_order.reference, v_order.total_centimes;
end;
$$;

grant execute on function public.create_order(uuid, jsonb, text) to authenticated;


-- =============================================================
-- Fichier : supabase/migrations/0003_rls.sql
-- =============================================================

-- ============================================================================
-- DistribPro â€” 0003 Row Level Security
-- Every policy derives the tenant from authenticated membership / customer
-- linkage. Client-supplied company identifiers are never trusted.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.customer_groups enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customer_group_prices enable row level security;
alter table public.customer_specific_prices enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.platform_admins enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
drop policy if exists "companies_select_scoped" on public.companies;
create policy "companies_select_scoped" on public.companies
  for select to authenticated
  using (
    public.is_platform_admin()
    or public.is_company_member(id)
    or public.current_customer_id(id) is not null
  );

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin" on public.companies
  for update to authenticated
  using (public.is_company_admin(id) or public.is_platform_admin())
  with check (public.is_company_admin(id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- company_memberships
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_select_scoped" on public.company_memberships;
create policy "memberships_select_scoped" on public.company_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_company_admin(company_id)
    or public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- subscriptions (read: tenant members and customers; write: platform admin)
-- ---------------------------------------------------------------------------
drop policy if exists "subscriptions_select_scoped" on public.subscriptions;
create policy "subscriptions_select_scoped" on public.subscriptions
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.current_customer_id(company_id) is not null
    or public.is_platform_admin()
  );

drop policy if exists "subscriptions_update_platform" on public.subscriptions;
create policy "subscriptions_update_platform" on public.subscriptions
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- customer_groups
-- ---------------------------------------------------------------------------
drop policy if exists "customer_groups_select_scoped" on public.customer_groups;
create policy "customer_groups_select_scoped" on public.customer_groups
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.current_customer_id(company_id) is not null
    or public.is_platform_admin()
  );

drop policy if exists "customer_groups_write_admin" on public.customer_groups;
create policy "customer_groups_write_admin" on public.customer_groups
  for all to authenticated
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- ---------------------------------------------------------------------------
-- customer_accounts
-- ---------------------------------------------------------------------------
drop policy if exists "customers_select_scoped" on public.customer_accounts;
create policy "customers_select_scoped" on public.customer_accounts
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or user_id = auth.uid()
    or public.is_platform_admin()
  );

drop policy if exists "customers_insert_admin" on public.customer_accounts;
create policy "customers_insert_admin" on public.customer_accounts
  for insert to authenticated
  with check (public.is_company_admin(company_id));

drop policy if exists "customers_update_admin" on public.customer_accounts;
create policy "customers_update_admin" on public.customer_accounts
  for update to authenticated
  using (public.is_company_admin(company_id) or public.is_platform_admin())
  with check (public.is_company_admin(company_id) or public.is_platform_admin());

drop policy if exists "customers_delete_admin" on public.customer_accounts;
create policy "customers_delete_admin" on public.customer_accounts
  for delete to authenticated
  using (public.is_company_admin(company_id));

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
drop policy if exists "categories_select_scoped" on public.categories;
create policy "categories_select_scoped" on public.categories
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.current_customer_id(company_id) is not null
    or public.is_platform_admin()
  );

drop policy if exists "categories_write_admin" on public.categories;
create policy "categories_write_admin" on public.categories
  for all to authenticated
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
drop policy if exists "products_select_scoped" on public.products;
create policy "products_select_scoped" on public.products
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.is_platform_admin()
    or (is_active and public.current_customer_id(company_id) is not null)
  );

drop policy if exists "products_write_admin" on public.products;
create policy "products_write_admin" on public.products
  for all to authenticated
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
drop policy if exists "product_images_select_scoped" on public.product_images;
create policy "product_images_select_scoped" on public.product_images
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.is_platform_admin()
    or (
      public.current_customer_id(company_id) is not null
      and exists (
        select 1 from public.products p
        where p.id = product_id and p.is_active = true
      )
    )
  );

drop policy if exists "product_images_write_admin" on public.product_images;
create policy "product_images_write_admin" on public.product_images
  for all to authenticated
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- ---------------------------------------------------------------------------
-- personalized prices
-- ---------------------------------------------------------------------------
drop policy if exists "group_prices_select_scoped" on public.customer_group_prices;
create policy "group_prices_select_scoped" on public.customer_group_prices
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.is_platform_admin()
    or group_id = public.current_customer_group_id(company_id)
  );

drop policy if exists "group_prices_write_admin" on public.customer_group_prices;
create policy "group_prices_write_admin" on public.customer_group_prices
  for all to authenticated
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

drop policy if exists "customer_prices_select_scoped" on public.customer_specific_prices;
create policy "customer_prices_select_scoped" on public.customer_specific_prices
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.is_platform_admin()
    or customer_id = public.current_customer_id(company_id)
  );

drop policy if exists "customer_prices_write_admin" on public.customer_specific_prices;
create policy "customer_prices_write_admin" on public.customer_specific_prices
  for all to authenticated
  using (public.is_company_admin(company_id))
  with check (public.is_company_admin(company_id));

-- ---------------------------------------------------------------------------
-- orders (INSERT is intentionally not granted: only create_order() writes)
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_scoped" on public.orders;
create policy "orders_select_scoped" on public.orders
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.is_platform_admin()
    or customer_id = public.current_customer_id(company_id)
  );

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update to authenticated
  using (public.is_company_admin(company_id) or public.is_platform_admin())
  with check (public.is_company_admin(company_id) or public.is_platform_admin());

drop policy if exists "order_items_select_scoped" on public.order_items;
create policy "order_items_select_scoped" on public.order_items
  for select to authenticated
  using (
    public.is_company_member(company_id)
    or public.is_platform_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.customer_id = public.current_customer_id(o.company_id)
    )
  );

-- ---------------------------------------------------------------------------
-- platform_admins (read own membership; writes only via service role)
-- ---------------------------------------------------------------------------
drop policy if exists "platform_admins_select_own" on public.platform_admins;
create policy "platform_admins_select_own" on public.platform_admins
  for select to authenticated
  using (user_id = auth.uid());


-- =============================================================
-- Fichier : supabase/migrations/0004_storage.sql
-- =============================================================

-- ============================================================================
-- DistribPro â€” 0004 Storage buckets & policies
-- Buckets are private. Images are served through short-lived signed URLs.
-- Object paths are always "<company_id>/...".
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', false, 2097152, array['image/jpeg','image/png','image/webp']),
  ('company-assets', 'company-assets', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "distribpro_storage_read" on storage.objects;
create policy "distribpro_storage_read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('product-images', 'company-assets')
    and (
      public.is_platform_admin()
      or public.is_company_member(((storage.foldername(name))[1])::uuid)
      or public.current_customer_id(((storage.foldername(name))[1])::uuid) is not null
    )
  );

drop policy if exists "distribpro_storage_insert" on storage.objects;
create policy "distribpro_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "distribpro_storage_update" on storage.objects;
create policy "distribpro_storage_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "distribpro_storage_delete" on storage.objects;
create policy "distribpro_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  );


