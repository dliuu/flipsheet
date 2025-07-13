export interface User {
  id: string;
  email: string;
  phone_number?: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  address: string;
  asking_price?: number;
  estimated_after_repair_value?: number;
  estimated_closing_costs?: number;
  estimated_as_is_value?: number;
  rehab_cost?: number;
  rehab_duration_months?: number;
  bedrooms?: number;
  bathrooms?: number;
  interior_sqft?: number;
  lot_sqft?: number;
  seller_email?: string;
  seller_phone?: string;
  status: 'active' | 'inactive' | 'sold';
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  image_order: number;
  created_at: string;
}

export interface CreatePropertyData {
  title: string;
  description?: string;
  address: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number; // This will be mapped to interior_sqft
  lot_size?: number; // This will be mapped to lot_sqft
  asking_price?: number;
  estimated_closing_costs?: number;
  estimated_after_repair_value?: number;
  estimated_as_is_value?: number;
  rehab_cost?: number;
  rehab_duration_months?: number;
  contact_email?: string; // This will be mapped to seller_email
  phone_number?: string; // This will be mapped to seller_phone
} 