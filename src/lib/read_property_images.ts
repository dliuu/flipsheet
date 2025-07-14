/**
 * This file contains logic for reading property images from the supabase database
 * Functions to either move or create here:
 * 1. Get the images for a property. This function takes a property ID as a parameter, and returns a list of property images.
 * 2. Get the image of a property by its ID. This function takes a property_image_id.
 * 
 * Please not that in supabase, each property_image has a property_id. So we are making a query to look for property_images where the property_id is the input property's uuid.
 */

import { supabase } from '../supabaseClient';
import { PropertyImage } from '../types/database';

/**
 * Get all images for a specific property
 * @param propertyId - The UUID of the property
 * @returns Promise<PropertyImage[]> - Array of property images ordered by image_order
 */
export const getPropertyImages = async (propertyId: string): Promise<PropertyImage[]> => {
  const { data, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('image_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch property images: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a specific property image by its ID
 * @param propertyImageId - The UUID of the property image
 * @returns Promise<PropertyImage | null> - The property image or null if not found
 */
export const getPropertyImageById = async (propertyImageId: string): Promise<PropertyImage | null> => {
  const { data, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('id', propertyImageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch property image: ${error.message}`);
  }

  return data;
};