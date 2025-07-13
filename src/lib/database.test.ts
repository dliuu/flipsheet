import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { supabase } from '../supabaseClient';
import { createProperty, uploadPropertyPhotos, createPropertyWithPhotos } from './database';

// Mock only supabase.storage
beforeAll(() => {
  Object.defineProperty(supabase, 'storage', {
    value: {
      from: jest.fn(() => ({
        // @ts-ignore
        upload: jest.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: jest.fn().mockImplementation((fileName) => ({ data: { publicUrl: `https://fakeurl.com/${fileName}` } })),
        // @ts-ignore
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    writable: true,
  });
});

// Mock File objects for testing
const createMockFile = (name: string, size: number = 1024): File => {
  const file = new File(['mock content'], name, { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('Database Functions - RLS Debug', () => {
  let testUserId: string;
  let testPropertyId: string;

  beforeEach(async () => {
    // Create a test user
    const { data: { user }, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123'
    });
    
    if (error) {
      throw error;
    }
    
    testUserId = user!.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testPropertyId) {
      await supabase.from('properties').delete().eq('id', testPropertyId);
    }
    if (testUserId) {
      // Note: We can't delete users via API, but we can clean up their data
      await supabase.from('properties').delete().eq('user_id', testUserId);
    }
  });

  describe('Authentication Debug', () => {
    it('should check authentication status', async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      expect(user).toBeTruthy();
    });

    it('should check session status', async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      expect(session).toBeTruthy();
    });
  });

  describe('Property Creation Debug', () => {
    it('should create a property successfully', async () => {
      const propertyData = {
        title: 'Test Property',
        description: 'Test description',
        address: '123 Test St',
        property_type: 'Single Family',
        asking_price: 250000,
        estimated_after_repair_value: 300000,
        estimated_closing_costs: 5000,
        estimated_as_is_value: 200000,
        rehab_cost: 50000,
        rehab_duration_months: 3,
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 1500,
        lot_size: 5000,
        contact_email: 'test@example.com',
        phone_number: '555-1234'
      };

      const property = await createProperty(propertyData);
      testPropertyId = property.id;
      
      expect(property).toBeTruthy();
      expect(property.id).toBeTruthy();
    });
  });

  describe('Photo Upload Debug', () => {
    beforeEach(async () => {
      // Create a test property first
      const propertyData = {
        title: 'Test Property for Photos',
        description: 'Test description',
        address: '123 Test St',
        property_type: 'Single Family',
        asking_price: 250000,
        estimated_after_repair_value: 300000,
        estimated_closing_costs: 5000,
        estimated_as_is_value: 200000,
        rehab_cost: 50000,
        rehab_duration_months: 3,
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 1500,
        lot_size: 5000,
        contact_email: 'test@example.com',
        phone_number: '555-1234'
      };

      const property = await createProperty(propertyData);
      testPropertyId = property.id;
    });

    it('should upload photos successfully', async () => {
      const mockPhotos = [
        createMockFile('test1.jpg'),
        createMockFile('test2.jpg')
      ];

      try {
        const photoUrls = await uploadPropertyPhotos(testPropertyId, mockPhotos);
        expect(photoUrls).toHaveLength(2);
      } catch (error) {
        throw error;
      }
    });

    it('should handle empty photos array', async () => {
      try {
        const photoUrls = await uploadPropertyPhotos(testPropertyId, []);
        expect(photoUrls).toHaveLength(0);
      } catch (error) {
        throw error;
      }
    });
  });

  describe('Comprehensive Property Creation Debug', () => {
    it('should create property with photos using comprehensive function', async () => {
      const propertyData = {
        title: 'Comprehensive Test Property',
        description: 'Test description',
        address: '456 Test Ave',
        property_type: 'Single Family',
        asking_price: 250000,
        estimated_after_repair_value: 300000,
        estimated_closing_costs: 5000,
        estimated_as_is_value: 200000,
        rehab_cost: 50000,
        rehab_duration_months: 3,
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 1500,
        lot_size: 5000,
        contact_email: 'test@example.com',
        phone_number: '555-1234'
      };

      const mockPhotos = [
        createMockFile('comprehensive1.jpg'),
        createMockFile('comprehensive2.jpg')
      ];

      try {
        const property = await createPropertyWithPhotos(propertyData, mockPhotos);
        expect(property).toBeTruthy();
        expect(property.id).toBeTruthy();
      } catch (error) {
        throw error;
      }
    });
  });

  describe('Database Schema Debug', () => {
    it('should check property_images table structure', async () => {
      // Try to get the table structure by attempting a simple select
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .limit(1);

      // This should work even if there's no data
      expect(error).toBeNull();
    });

    it('should check properties table structure', async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('Storage and RLS Debug', () => {
    it('should check if storage bucket exists and has proper permissions', async () => {
      try {
        // Try to list files in the bucket
        const { data: listData, error: listError } = await supabase.storage
          .from('property-photos')
          .list('', { limit: 1 });
        
        // This should work even if the bucket is empty
        expect(listError).toBeNull();
      } catch (error) {
        throw error;
      }
    });

    it('should test direct insert to property_images table', async () => {
      // Create a test property first
      const propertyData = {
        title: 'Test Property for Direct Insert',
        description: 'Test description',
        address: '123 Test St',
        property_type: 'Single Family',
        asking_price: 250000,
        estimated_after_repair_value: 300000,
        estimated_closing_costs: 5000,
        estimated_as_is_value: 200000,
        rehab_cost: 50000,
        rehab_duration_months: 3,
        bedrooms: 3,
        bathrooms: 2,
        square_footage: 1500,
        lot_size: 5000,
        contact_email: 'test@example.com',
        phone_number: '555-1234'
      };

      const property = await createProperty(propertyData);
      
      try {
        // Try to insert directly into property_images
        const { data, error } = await supabase
          .from('property_images')
          .insert({
            property_id: property.id,
            image_url: 'https://fakeurl.com/test.jpg',
            image_order: 0
          });

        if (error) {
          throw new Error(`Direct insert failed: ${error.message}`);
        }

        // Supabase inserts return null data by default, so we just check for no error
        expect(error).toBeNull();
      } catch (error) {
        throw error;
      }
    });

    it('should check for any RLS policies on property_images', async () => {
      try {
        // Try to select from property_images to see if there are any hidden policies
        const { data, error } = await supabase
          .from('property_images')
          .select('*')
          .limit(1);

        // If there's an RLS error, it will be in the error message
        if (error && error.message.includes('row-level security')) {
          throw new Error(`RLS policy found: ${error.message}`);
        }

        // This should work even if there's no data
        expect(error).toBeNull();
      } catch (error) {
        throw error;
      }
    });
  });
}); 