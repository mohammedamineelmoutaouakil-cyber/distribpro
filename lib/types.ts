export type CompanyStatus = "active" | "suspended";
export type MembershipRole = "admin" | "staff";
export type CustomerStatus = "invited" | "pending" | "active" | "suspended";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  description: string | null;
  logo_path: string | null;
  banner_path: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  ice: string | null;
  website: string | null;
  status: CompanyStatus;
  created_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan: "starter" | "pro";
  status: "trial" | "active" | "expired" | "suspended";
  starts_at: string;
  expires_at: string;
  created_at: string;
}

export interface Membership {
  id: string;
  company_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
}

export interface CustomerGroup {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface CustomerAccount {
  id: string;
  company_id: string;
  user_id: string | null;
  group_id: string | null;
  company_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  ice: string | null;
  status: CustomerStatus;
  invite_token: string | null;
  notes: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  sku: string;
  description: string | null;
  image_path: string | null;
  base_price_centimes: number;
  min_order_qty: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  categories?: Pick<Category, "id" | "name"> | null;
}

export interface CustomerGroupPrice {
  id: string;
  company_id: string;
  product_id: string;
  group_id: string;
  price_centimes: number;
}

export interface CustomerSpecificPrice {
  id: string;
  company_id: string;
  product_id: string;
  customer_id: string;
  price_centimes: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  company_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price_centimes: number;
  line_total_centimes: number;
}

export interface Order {
  id: string;
  company_id: string;
  customer_id: string;
  reference: string;
  status: import("./constants").OrderStatus;
  notes: string | null;
  item_count: number;
  total_centimes: number;
  created_at: string;
  updated_at: string;
}

export interface OrderWithRelations extends Order {
  customer_accounts?: Pick<CustomerAccount, "id" | "company_name" | "contact_name" | "email" | "phone"> | null;
  order_items?: OrderItem[];
}

export interface PlatformAdmin {
  user_id: string;
  created_at: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface PricedCartLine {
  product: ProductWithCategory;
  quantity: number;
  unitPriceCentimes: number;
  lineTotalCentimes: number;
}
