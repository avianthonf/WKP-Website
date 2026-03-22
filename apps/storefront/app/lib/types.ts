export type Size = 'small' | 'medium' | 'large';
export type CategoryType = 'pizza' | 'addon' | 'dessert';
export type OrderStatus = 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Category {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  icon?: string | null;
  type: CategoryType;
  sort_order: number;
  is_active: boolean;
}

export interface Topping {
  id: string;
  slug: string;
  name: string;
  category: string;
  is_veg: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Pizza {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
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
  categories?: { id: string; label: string; slug?: string };
  pizza_toppings?: Array<{ topping_id: string; toppings?: Topping }>;
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
}

export interface Addon {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  is_veg: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
}

export interface Dessert {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  is_veg: boolean;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
}

export interface Notification {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  is_active: boolean;
  pinned: boolean;
  expires_at?: string | null;
  created_at: string;
}

export interface SiteConfigItem {
  id: string;
  key: string;
  value: string;
  label?: string | null;
  type: string;
  description?: string | null;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone?: string | null;
  fulfillment_type?: 'delivery' | 'pickup' | null;
  delivery_address?: string | null;
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
  notes?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: string;
  pizza_id?: string | null;
  extra_id?: string | null;
  addon_id?: string | null;
  dessert_id?: string | null;
  size?: Size | null;
  quantity: number;
  unit_price: number;
  extras_json?: unknown;
  customization_json?: unknown;
  pizzas?: { name: string };
  extras?: { name: string };
  addons?: { name: string };
  desserts?: { name: string };
}

export interface StorefrontBundle {
  categories: Category[];
  pizzas: Pizza[];
  toppings: Topping[];
  extras: Extra[];
  addons: Addon[];
  desserts: Dessert[];
  notifications: Notification[];
  config: Record<string, string>;
  isOpen: boolean;
  maintenanceMode: boolean;
}

export interface CartLine {
  id: string;
  kind: 'pizza' | 'extra' | 'addon' | 'dessert';
  sourceId: string;
  name: string;
  imageUrl?: string | null;
  size?: Size;
  quantity: number;
  unitPrice: number;
  extras?: Array<{ id: string; name: string; price: number }>;
  customization?: Record<string, unknown>;
  notes?: string;
}
