export interface CartItem {
  cart_item_id: number;
  product_id: number;
  merchant_id: number;
  quantity: number;
  selected_attributes?: {[key: number]: string | string[]};
  product: {
    id: number;
    name: string;
    price: number;
    original_price: number;
    special_price: number | null;
    image_url: string;
    stock: number;
    is_deleted: boolean;
    /** Why this line can no longer be bought, when it cannot. Sent by the API
     *  alongside is_deleted so the cart can explain a line rather than drop it. */
    unavailable_reason?: string | null;
    sku?: string;
  };
}

export interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number;
  special_price: number | null;
  image_url: string;
  images?: string[];
  stock: number;
  is_deleted: boolean;
  /** Why this product can no longer be bought, when it cannot. Set by the API
   *  alongside is_deleted so the cart can explain a line rather than drop it. */
  unavailable_reason?: string | null;
  sku?: string;
  description?: string;
  category?: {
    category_id: number;
    name: string;
  };
  brand?: {
    brand_id: number;
    name: string;
  };
  special_start?: string | null;
  special_end?: string | null;
  discount_pct?: number;
  placement?: {
    placement_id: number;
    sort_order: number;
    added_at: string;
    expires_at: string | null;
  };
  rating?: number;
  reviews?: number;
  isNew?: boolean;
  isBuiltIn?: boolean;
  featured?: boolean;
  favourite?: boolean;
  currency?: string;
  tags?: string[];
  primary_image?: string;
  category_id?: number;
  brand_id?: number;
  attributes?: any[];
  created_at?: string;
}

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url: string;
  parent_id: number | null;
  children?: Category[];
}

export interface DirectPurchaseItem {
  product: Product;
  quantity: number;
  selected_attributes?: {[key: number]: string | string[]};
}