/**
 * This file contains logic for reading properties from the supabase database
 * Functions to either move or create here:
 * 1. Get the User's created properties (the FK on properties is user_id). This returns a list of properties.
 * 2. Get a property by its ID
 * 
 * 
 */

import { supabase } from '../supabaseClient';
import { Property } from '../types/database';
import { getCurrentUser } from './auth';

/**
 * Get the current user's created properties
 * @returns Promise<Property[]> - Array of properties created by the current user
 */
export const getUserProperties = async (): Promise<Property[]> => {
  try {
    // Get the current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Query properties where user_id matches the current user's ID
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    throw new Error(`Failed to get user properties: ${error.message}`);
  }
};

/**
 * Get a property by its ID
 * @param propertyId - The ID of the property to retrieve
 * @returns Promise<Property | null> - The property if found, null otherwise
 */
export const getPropertyById = async (propertyId: string): Promise<Property | null> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Property not found
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    throw new Error(`Failed to get property by ID: ${error.message}`);
  }
};