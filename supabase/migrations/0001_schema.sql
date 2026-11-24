-- ============================================================================
-- DistribPro — 0001 schema
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
