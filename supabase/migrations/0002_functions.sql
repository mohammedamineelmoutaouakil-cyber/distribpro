-- ============================================================================
-- DistribPro — 0002 authorization & business functions
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
    (v_company_id, 'Professionnel', 'professionnel', 'Client professionnel régulier'),
    (v_company_id, 'VIP', 'vip', 'Grand compte, tarifs privilégiés');

  insert into public.categories (company_id, name, slug, sort_order)
  values (v_company_id, 'Général', 'general', 0);

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
