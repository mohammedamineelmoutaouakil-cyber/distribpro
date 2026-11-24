-- ============================================================================
-- DistribPro — 0003 Row Level Security
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
