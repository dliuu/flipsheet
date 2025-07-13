import { supabase } from '../supabaseClient';
import { Property, PropertyImage, CreatePropertyData } from '../types/database';
import { signUp, signIn, signOut, SignUpData, SignInData } from './auth';

// User functions - now using centralized auth functions
export const createUser = async (email: string, password: string, phoneNumber?: string) => {
  const signUpData: SignUpData = {
    email,
    password,
    fullName: '', // This will need to be provided by the caller
    phoneNumber
  };
  
  const { user, error } = await signUp(signUpData);
  if (error) throw new Error(error.message);
  return user;
};

export const signInUser = async (email: string, password: string) => {
  const signInData: SignInData = {
    email,
    password
  };
  
  const { user, error } = await signIn(signInData);
  if (error) throw new Error(error.message);
  return user;
};

export const signOutUser = async () => {
  const { error } = await signOut();
  if (error) throw new Error(error.message);
};

// Property functions
export const createProperty = async (propertyData: CreatePropertyData) => {
  // Map form data to database schema
  const mappedData = {
    title: propertyData.title,
    description: propertyData.description,
    address: propertyData.address,
    property_type: propertyData.property_type,
    bedrooms: propertyData.bedrooms,
    bathrooms: propertyData.bathrooms,
    interior_sqft: propertyData.square_footage,
    lot_sqft: propertyData.lot_size,
    asking_price: propertyData.asking_price,
    estimated_closing_costs: propertyData.estimated_closing_costs,
    estimated_after_repair_value: propertyData.estimated_after_repair_value,
    estimated_as_is_value: propertyData.estimated_as_is_value,
    rehab_cost: propertyData.rehab_cost,
    rehab_duration_months: propertyData.rehab_duration_months,
    seller_email: propertyData.contact_email,
    seller_phone: propertyData.phone_number,
  };

  const { data, error } = await supabase
    .from('properties')
    .insert(mappedData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

export const getProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getPropertyById = async (id: string) => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const getPropertyPhotos = async (propertyId: string) => {
  const { data, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('image_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

export const uploadPropertyPhotos = async (propertyId: string, photos: File[]) => {
  // Verify the property exists
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .single();

  if (propertyError) {
    throw new Error('Property not found');
  }

  const photoUrls: string[] = [];
  
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const fileName = `${propertyId}/${Date.now()}-${i}.${file.name.split('.').pop()}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('property-photos')
      .getPublicUrl(fileName);
    
    photoUrls.push(publicUrl);
  }

  // Save photo URLs to database
  const photoRecords = photoUrls.map((url, index) => ({
    property_id: propertyId,
    image_url: url,
    image_order: index
  }));

  const { data, error } = await supabase
    .from('property_images')
    .insert(photoRecords);

  if (error) throw new Error(error.message);
  return photoUrls;
};

// Get current user
export const getCurrentUser = async () => {
  const { getCurrentUser: getAuthUser } = await import('./auth');
  return await getAuthUser();
};

// Update property
export const updateProperty = async (id: string, updates: Partial<CreatePropertyData>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete property
export const deleteProperty = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

// Get user's properties
export const getUserProperties = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Comprehensive property creation function
export const createPropertyWithPhotos = async (
  propertyData: CreatePropertyData,
  photos: File[] = []
) => {
  try {
    // Step 1: Create the property
    const property = await createProperty(propertyData);
    
    // Step 2: Upload photos if provided
    if (photos.length > 0) {
      await uploadPropertyPhotos(property.id, photos);
    }
    
    return property;
  } catch (error: any) {
    throw new Error(error.message);
  }
}; 