const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ;
  // Remove trailing slash if present
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

export interface Shop {
  shop_id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ShopCategory {
  category_id: number;
  shop_id: number;
  shop_name?: string;
  parent_id?: number;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  children?: ShopCategory[];
}

export interface ShopBrand {
  brand_id: number;
  shop_id: number;
  shop_name?: string;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ShopAttribute {
  attribute_id: number;
  shop_id: number;
  shop_name?: string;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'date';
  attribute_type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  values?: ShopAttributeValue[];
}

export interface ShopAttributeValue {
  value_id: number;
  attribute_id: number;
  value: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ShopProduct {
  product_id: number;
  shop_id: number;
  shop_name?: string;
  category_id: number;
  category_name?: string;
  brand_id?: number;
  brand_name?: string;
  parent_product_id?: number;
  sku: string;
  product_name: string;
  product_description: string;
  cost_price: number;
  selling_price: number;
  special_price?: number;
  special_start?: string;
  special_end?: string;
  is_on_special_offer: boolean;
  is_published: boolean;
  active_flag: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  price: number;
  originalPrice?: number;
  attributes?: any[];
  variants?: any[];
  variant_count?: number;
  price_range?: {
    min: number;
    max: number;
  };
  available_attributes?: Record<string, string[]>;
  default_variant?: any;
  is_parent_product?: boolean;
  is_variant_product?: boolean;
  is_simple_product?: boolean;
  stock?: {
    stock_qty: number;
    low_stock_threshold: number;
  };
  shipping?: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_kg: number;
    shipping_class: string;
  };
  meta?: {
    short_desc: string;
    full_desc: string;
    meta_title: string;
    meta_desc: string;
    meta_keywords: string;
  };
  media?: Array<{
    media_id: number;
    type: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  primary_image?: string;
}

class ShopManagementService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Attribute Value Methods
  async getAttributeValues(attributeId: number): Promise<ShopAttributeValue[]> {
    // Get values through the attribute endpoint since there's no separate get values endpoint
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/${attributeId}`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch attribute with values');
    }
    
    const attributeData = await response.json();
    
    // Return the values from the attribute data
    return attributeData.data?.values || [];
  }

  async createAttributeValue(valueData: Omit<ShopAttributeValue, 'value_id' | 'created_at' | 'updated_at'>): Promise<ShopAttributeValue> {
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/values`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(valueData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create attribute value');
    }
    
    const result = await response.json();
    return result.data;
  }

  async updateAttributeValue(valueId: number, valueData: Partial<ShopAttributeValue>): Promise<ShopAttributeValue> {
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/values/${valueId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(valueData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update attribute value');
    }
    
    const result = await response.json();
    return result.data;
  }

  async deleteAttributeValue(attributeValueOrId: ShopAttributeValue | number): Promise<void> {
    let valueId: number;

    if (typeof attributeValueOrId === 'object') {
      valueId = attributeValueOrId.value_id;
    } else {
      valueId = attributeValueOrId;
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/values/${valueId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete attribute value');
    }
  }

  // Product Methods
  async getShops(): Promise<Shop[]> {
    const response = await fetch(`${API_BASE_URL}/api/shop/shops`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch shops');
    const data = await response.json();
    return data.data || data;
  }

  async createShop(shopData: Omit<Shop, 'shop_id' | 'created_at' | 'updated_at'>, logoFile?: File): Promise<Shop> {
    const formData = new FormData();
    
    // Add shop data
    Object.entries(shopData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add logo file if provided
    if (logoFile) {
      formData.append('logo_file', logoFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/shops`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create shop');
    }
    const data = await response.json();
    return data.data;
  }

  async updateShop(shopId: number, shopData: Partial<Shop>, logoFile?: File): Promise<Shop> {
    const formData = new FormData();
    
    // Add shop data
    Object.entries(shopData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add logo file if provided
    if (logoFile) {
      formData.append('logo_file', logoFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/shops/${shopId}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update shop');
    }
    const data = await response.json();
    return data.data;
  }

  async deleteShop(shopId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/shop/shops/${shopId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete shop');
    }
  }

  async hardDeleteShop(shopId: number): Promise<any> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/shop/shops/${shopId}/hard`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to hard delete shop');
    }
    return response.json();
  }

  // Category Management
  async getCategoriesByShop(shopId: number): Promise<ShopCategory[]> {
    const response = await fetch(`${API_BASE_URL}/api/shop/categories/shop/${shopId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.data || data;
  }

  async createCategory(categoryData: Omit<ShopCategory, 'category_id' | 'created_at' | 'updated_at'>, iconFile?: File): Promise<ShopCategory> {
    const formData = new FormData();
    
    // Add category data
    Object.entries(categoryData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add icon file if provided
    if (iconFile) {
      formData.append('icon_file', iconFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/categories`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create category');
    }
    const data = await response.json();
    return data.data;
  }

  async updateCategory(categoryId: number, categoryData: Partial<ShopCategory>, iconFile?: File): Promise<ShopCategory> {
    const formData = new FormData();
    
    // Add category data
    Object.entries(categoryData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add icon file if provided
    if (iconFile) {
      formData.append('icon_file', iconFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update category');
    }
    const data = await response.json();
    return data.data;
  }

  async deleteCategory(categoryId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/shop/categories/${categoryId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }
  }

  // Brand Management
  async getBrandsByShopCategory(shopId: number, categoryId?: number): Promise<ShopBrand[]> {
    const url = categoryId 
      ? `${API_BASE_URL}/api/shop/brands/shop/${shopId}/category/${categoryId}`
      : `${API_BASE_URL}/api/shop/brands/shop/${shopId}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch brands');
    const data = await response.json();
    return data.data || data;
  }

  async createBrand(brandData: Omit<ShopBrand, 'brand_id' | 'created_at' | 'updated_at'>, logoFile?: File): Promise<ShopBrand> {
    const formData = new FormData();
    
    // Add brand data
    Object.entries(brandData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add logo file if provided
    if (logoFile) {
      formData.append('logo_file', logoFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/brands`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create brand');
    }
    const data = await response.json();
    return data.data;
  }

  async updateBrand(brandId: number, brandData: Partial<ShopBrand>, logoFile?: File): Promise<ShopBrand> {
    const formData = new FormData();
    
    // Add brand data
    Object.entries(brandData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add logo file if provided
    if (logoFile) {
      formData.append('logo_file', logoFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/brands/${brandId}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.getAuthHeaders().Authorization,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update brand');
    }
    const data = await response.json();
    return data.data;
  }

  async deleteBrand(brandId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/shop/brands/${brandId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete brand');
    }
  }

  // Attribute Management
  async getAttributesByShopCategory(shopId: number, categoryId: number): Promise<ShopAttribute[]> {
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/shop/${shopId}/category/${categoryId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch attributes');
    const data = await response.json();
    return data.data || data;
  }

  async getActiveAttributesByShopCategory(shopId: number, categoryId: number): Promise<ShopAttribute[]> {
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/shop/${shopId}/category/${categoryId}?active_only=true`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch active attributes');
    const data = await response.json();
    return data.data || data;
  }

  async createAttribute(attributeData: Omit<ShopAttribute, 'attribute_id' | 'created_at' | 'updated_at'>): Promise<ShopAttribute> {
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(attributeData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create attribute');
    }
    const data = await response.json();
    return data.data;
  }

  async updateAttribute(attributeId: number, attributeData: Partial<ShopAttribute>): Promise<ShopAttribute> {
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/${attributeId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(attributeData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update attribute');
    }
    const data = await response.json();
    return data.data;
  }

  async deleteAttribute(attributeId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/shop/attributes/${attributeId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete attribute');
    }
  }

  // Product Management
  async getShopProducts(filters?: {
    shop_id?: number;
    category_id?: number;
    brand_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    order?: 'asc' | 'desc';
  }): Promise<{ data: ShopProduct[]; pagination?: any }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/shop/products?${params}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    const responseData = await response.json();
    
    // Normalize the response structure to match expected format
    return {
      data: responseData.products || responseData.data || [],
      pagination: responseData.pagination
    };
  }

  async getProductDetails(productId: number): Promise<ShopProduct> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}/details`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch product details');
    }
    const data = await response.json();
    return data.data;
  }

  async createProduct(productData: Omit<ShopProduct, 'product_id' | 'created_at' | 'updated_at'>): Promise<ShopProduct> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }
    const data = await response.json();
    return data.data;
  }

  async updateProduct(productId: number, productData: Partial<ShopProduct>): Promise<ShopProduct> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    }
    const data = await response.json();
    return data.data;
  }

  async deleteProduct(productId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  // Multi-step product creation methods
  async createProductStep1(stepData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step1`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save basic product information');
    }
    return await response.json();
  }

  async createProductStep2(stepData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step2`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save product attributes');
    }
    return await response.json();
  }

  async createProductStep3(stepData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step3`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save product media');
    }
    return await response.json();
  }

  async createProductStep4(stepData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step4`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save shipping information');
    }
    return await response.json();
  }

  async createProductStep5(stepData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step5`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save stock information');
    }
    return await response.json();
  }

  async createProductStep6(stepData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step6`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save product meta information');
    }
    return await response.json();
  }

  // Variant Management Methods
  async getProductVariants(productId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}/variants`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch product variants');
    }
    return await response.json();
  }

  async getVariantDetails(productId: number): Promise<any> {
    // Get the parent product and find this variant's relation
    const productResponse = await fetch(`${API_BASE_URL}/api/shop/products/${productId}/details`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!productResponse.ok) {
      const error = await productResponse.json();
      throw new Error(error.message || 'Failed to fetch product details');
    }
    const product = await productResponse.json();
    
    // If this is a variant product, get its variant relation data
    if (product.data.parent_product_id) {
      const variantsResponse = await this.getProductVariants(product.data.parent_product_id);
      const variants = variantsResponse.variants || variantsResponse.message?.variants || [];
      const variantRelation = variants.find((v: any) => v.variant_product_id === productId);
      
      return {
        product: product.data,
        variantRelation: variantRelation || null
      };
    }
    
    return {
      product: product.data,
      variantRelation: null
    };
  }

  async createVariant(productId: number, variantData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}/variants`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(variantData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create variant');
    }
    return await response.json();
  }

  async updateVariant(variantId: number, variantData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/variants/${variantId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(variantData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update variant');
    }
    return await response.json();
  }

  async updateVariantAttributes(variantId: number, attributes: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/variants/${variantId}/attributes`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ attribute_combination: attributes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update variant attributes');
    }
    return await response.json();
  }

  async addVariantMedia(variantId: number, mediaData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/variants/${variantId}/media`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(mediaData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add variant media');
    }
    return await response.json();
  }

  async getVariantMedia(variantId: number): Promise<any> {
    // For variants, we need to get the variant_product_id first, then get media for that product
    const response = await fetch(`${API_BASE_URL}/api/shop/variants/${variantId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get variant details');
    }
    const variantData = await response.json();
    const variantProductId = variantData.variant_product_id;
    
    // Now get media for the variant product
    const mediaResponse = await fetch(`${API_BASE_URL}/api/shop/products/${variantProductId}/media`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!mediaResponse.ok) {
      const error = await mediaResponse.json();
      throw new Error(error.message || 'Failed to get variant media');
    }
    return await mediaResponse.json();
  }

  async addVariantProductMedia(variantProductId: number, mediaData: any): Promise<any> {
    // Use the step3 endpoint to save media for the variant product
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step3`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        product_id: variantProductId,
        media: [mediaData]
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add variant media');
    }
    return await response.json();
  }

  async addVariantProductMediaBatch(variantProductId: number, mediaDataArray: any[]): Promise<any> {
    // Use the step3 endpoint to save multiple media items for the variant product
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step3`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        product_id: variantProductId,
        media: mediaDataArray
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add variant media batch');
    }
    return await response.json();
  }

  async getProductMedia(productId: number): Promise<any> {
    // Use the product details endpoint which includes media
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}/details`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get product details');
    }
    const productDetails = await response.json();
    // Return just the media array from the product details
    return productDetails.media || [];
  }

  async deleteVariant(variantId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/variants/${variantId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete variant');
    }
    return await response.json();
  }

  async bulkCreateVariants(productId: number, variantData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}/variants/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(variantData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create variants in bulk');
    }
    return await response.json();
  }

  async updateProductStep1(productId: number, stepData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shop/products/step1/${productId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stepData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update basic product information');
    }
    return await response.json();
  }

  async updateProductStock(productId: number, stockData: any): Promise<any> {
    // Check if this is a variant product (has parent_product_id)
    const productDetails = await this.getProductDetails(productId);
    
    if (productDetails.parent_product_id) {
      // This is a variant - use the variant update endpoint
      const variantDetails = await this.getVariantDetails(productId);
      if (variantDetails.variantRelation?.variant_id) {
        return await this.updateVariant(variantDetails.variantRelation.variant_id, stockData);
      }
    }
    
    // For non-variant products, try the product update endpoint
    const response = await fetch(`${API_BASE_URL}/api/shop/products/${productId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(stockData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product stock');
    }
    return await response.json();
  }
}

export const shopManagementService = new ShopManagementService();
