// Shared types for the Meesho-style product wizard.
// The wizard keeps all form state here so tabs stay stateless; the container
// owns the state and tabs receive controlled props.

export type MediaItem = {
  url: string;
  public_id?: string;
  type?: 'image' | 'video';
  sort_order?: number;
  is_main_image?: boolean;
  is_thumbnail?: boolean;
};

export type CategoryAttributeValue = {
  attribute_id: number;
  value_code?: string;
  value_text?: string;
  value_number?: number;
};

export type VariantRow = {
  localId: string;        // client-side id so React keys stay stable
  color?: string;
  size?: string;
  sku: string;
  selling_price: string;
  mrp: string;
  stock_qty: string;
  media: MediaItem[];
};

export type WizardFormData = {
  // Tab 1 — Add Product
  category_id: number | null;
  category_path?: string;
  brand_id: number | null;
  brand_name?: string;
  product_name: string;
  product_description: string;
  media: MediaItem[];

  // Tab 2 — Basic Details
  attributes: CategoryAttributeValue[];
  size_chart_url: string;
  cost_price: string;
  selling_price: string;   // supplier listed price
  wdrp: string;            // wrong/defective returns price (optional)
  mrp: string;
  gst_rate: string;        // percentage, e.g. 5, 12, 18
  commission_pct: string;  // used only for live Bank Settlement preview (not sent)

  // Tab 3 — Additional Details
  hsn_code: string;
  country_of_origin: string;
  manufacturer_details: string;
  packer_details: string;
  importer_details: string;
  weight_g: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  meta_title: string;
  meta_desc: string;
  meta_keywords: string;
  short_desc: string;

  // Tab 4 — Variants
  style_code: string;
  variants: VariantRow[];

  // Shared
  sku: string;             // auto-generated if blank
  stock_qty: string;
  low_stock_threshold: string;
};

export const INITIAL_FORM_DATA: WizardFormData = {
  category_id: null,
  brand_id: null,
  product_name: '',
  product_description: '',
  media: [],

  attributes: [],
  size_chart_url: '',
  cost_price: '',
  selling_price: '',
  wdrp: '',
  mrp: '',
  gst_rate: '',
  commission_pct: '10',

  hsn_code: '',
  country_of_origin: 'India',
  manufacturer_details: '',
  packer_details: '',
  importer_details: '',
  weight_g: '',
  length_cm: '',
  width_cm: '',
  height_cm: '',
  meta_title: '',
  meta_desc: '',
  meta_keywords: '',
  short_desc: '',

  style_code: '',
  variants: [],

  sku: '',
  stock_qty: '',
  low_stock_threshold: '5',
};

export const WIZARD_STEPS = [
  { key: 'add-product',        label: 'Add Product' },
  { key: 'basic-details',      label: 'Basic Details' },
  { key: 'additional-details', label: 'Additional Details' },
  { key: 'add-variants',       label: 'Add Variant(s)' },
] as const;

export type WizardStepKey = typeof WIZARD_STEPS[number]['key'];
