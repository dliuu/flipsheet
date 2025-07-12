import { supabase } from '../supabaseClient';
import { User, Property, PropertyPhoto, CreatePropertyData } from '../types/database';

// User functions
export const createUser = async (email: string, password: string, phoneNumber?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone_number: phoneNumber
      }
    }
  });
  
  if (error) throw error;
  return data;
};

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Property functions
export const createProperty = async (propertyData: CreatePropertyData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...propertyData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
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
    .from('property_photos')
    .select('*')
    .eq('property_id', propertyId)
    .order('photo_order', { ascending: true });

  if (error) throw error;
  return data;
};

export const uploadPropertyPhotos = async (propertyId: string, photos: File[]) => {
  const photoUrls: string[] = [];
  
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const fileName = `${propertyId}/${Date.now()}-${i}.${file.name.split('.').pop()}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('property-photos')
      .getPublicUrl(fileName);
    
    photoUrls.push(publicUrl);
  }

  // Save photo URLs to database
  const photoRecords = photoUrls.map((url, index) => ({
    property_id: propertyId,
    photo_url: url,
    photo_order: index
  }));

  const { error } = await supabase
    .from('property_photos')
    .insert(photoRecords);

  if (error) throw error;
  return photoUrls;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Update property
export const updateProperty = async (id: string, updates: Partial<CreatePropertyData>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the property
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
    .eq('user_id', user.id); // Ensure user owns the property

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