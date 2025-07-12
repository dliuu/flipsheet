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
  rehab_value?: number;
  rehab_cost?: number;
  potential_profit?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  lot_size?: number;
  contact_email?: string;
  phone_number?: string;
  status: 'active' | 'inactive' | 'sold';
  created_at: string;
  updated_at: string;
}

export interface PropertyPhoto {
  id: string;
  property_id: string;
  photo_url: string;
  photo_order: number;
  created_at: string;
}

export interface CreatePropertyData {
  title: string;
  description?: string;
  address: string;
  asking_price?: number;
  rehab_value?: number;
  rehab_cost?: number;
  potential_profit?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_footage?: number;
  lot_size?: number;
  contact_email?: string;
  phone_number?: string;
} 