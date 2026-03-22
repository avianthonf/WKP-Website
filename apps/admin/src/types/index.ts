export type Size = 'small' | 'medium' | 'large';
export type CategoryType = 'pizza' | 'addon' | 'dessert';
export type ToppingCategory = 'cheese' | 'meat' | 'vegetable' | 'sauce' | 'herb' | 'other';
export type OrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Category {
  id: string;
  slug: string;
  label: string;
  description?: string;
  icon?: string;
  type: CategoryType;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Topping {
  id: string;
  slug: string;
  name: string;
  category: ToppingCategory;
  is_veg: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Pizza {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category_id: string;
  price_small: number;
  price_medium: number;
  price_large: number;
  image_url?: string | null;
  is_veg: boolean;
  is_bestseller: boolean;
  is_spicy: boolean;
  is_new: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories?: { label: string; id: string };
  pizza_toppings?: { topping_id: string; toppings?: Topping }[];
}

export interface Extra {
  id: string;
  slug: string;
  name: string;
  price_small: number;
  price_medium: number;
  price_large: number;
  is_veg: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image_url?: string | null;
  price: number;
  is_veg: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Dessert {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image_url?: string | null;
  price: number;
  is_veg: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: string;
  pizza_id?: string;
  extra_id?: string;
  addon_id?: string;
  dessert_id?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  extras_json?: Record<string, unknown> | null;
  customization_json?: Record<string, unknown> | null;
  created_at: string;
  pizzas?: { name: string };
  extras?: { name: string };
  addons?: { name: string };
  desserts?: { name: string };
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone?: string;
  fulfillment_type?: 'delivery' | 'pickup' | null;
  delivery_address?: string;
  delivery_location_url?: string | null;
  delivery_location_source?: 'geolocation' | 'manual' | 'mixed' | null;
  delivery_location_accuracy_meters?: number | null;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  scheduled_for?: string | null;
  total_price: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface Notification {
  id: string;
  title: string;
  body?: string;
  type: string;
  is_active: boolean;
  pinned: boolean;
  expires_at?: string;
  created_at: string;
}

export interface SiteConfigItem {
  id: string;
  key: string;
  value: string;
  label?: string;
  type: string;
  description?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  shift_start?: string | null;
  shift_end?: string | null;
  status: 'active' | 'off_shift' | 'on_call' | 'offline';
  is_on_shift: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
