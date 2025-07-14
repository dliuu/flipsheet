// Mock Supabase and auth functions before importing read_properties functions
const mockSupabase = {
  from: jest.fn(),
};

const mockGetCurrentUser = jest.fn();

jest.mock('../supabaseClient', () => ({
  supabase: mockSupabase,
}));

jest.mock('../lib/auth', () => ({
  getCurrentUser: mockGetCurrentUser,
}));

import { getUserProperties, getPropertyById } from '../lib/read_properties';
import { Property } from '../types/database';

describe('Read Properties Functions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
  };

  const mockProperties: Property[] = [
    {
      id: 'property-1',
      user_id: 'user-123',
      title: 'Test Property 1',
      description: 'A test property',
      address: '123 Test St',
      asking_price: 250000,
      estimated_after_repair_value: 350000,
      estimated_closing_costs: 10000,
      estimated_as_is_value: 275000,
      rehab_cost: 50000,
      rehab_duration_months: 2,
      bedrooms: 3,
      bathrooms: 2.5,
      interior_sqft: 2150,
      lot_sqft: 8500,
      seller_email: 'seller@example.com',
      seller_phone: '(555) 123-4567',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'property-2',
      user_id: 'user-123',
      title: 'Test Property 2',
      description: 'Another test property',
      address: '456 Test Ave',
      asking_price: 300000,
      estimated_after_repair_value: 400000,
      estimated_closing_costs: 12000,
      estimated_as_is_value: 320000,
      rehab_cost: 60000,
      rehab_duration_months: 3,
      bedrooms: 4,
      bathrooms: 3,
      interior_sqft: 2500,
      lot_sqft: 10000,
      seller_email: 'seller2@example.com',
      seller_phone: '(555) 987-6543',
      status: 'active',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(mockUser);
  });

  describe('getUserProperties', () => {
    it('should return user properties when user is authenticated', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockProperties, error: null }),
          }),
        }),
      });

      const result = await getUserProperties();

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(result).toEqual(mockProperties);
    });

    it('should throw error when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(getUserProperties()).rejects.toThrow('User not authenticated');
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
          }),
        }),
      });

      await expect(getUserProperties()).rejects.toThrow('Failed to get user properties: Database connection failed');
    });

    it('should return empty array when user has no properties', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await getUserProperties();

      expect(result).toEqual([]);
    });
  });

  describe('getPropertyById', () => {
    it('should return property when found', async () => {
      const propertyId = 'property-123';
      const mockProperty: Property = {
        id: propertyId,
        user_id: 'user-123',
        title: 'Test Property',
        description: 'A test property',
        address: '123 Test St',
        asking_price: 250000,
        estimated_after_repair_value: 350000,
        estimated_closing_costs: 10000,
        estimated_as_is_value: 275000,
        rehab_cost: 50000,
        rehab_duration_months: 2,
        bedrooms: 3,
        bathrooms: 2.5,
        interior_sqft: 2150,
        lot_sqft: 8500,
        seller_email: 'seller@example.com',
        seller_phone: '(555) 123-4567',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
          }),
        }),
      });

      const result = await getPropertyById(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(result).toEqual(mockProperty);
    });

    it('should return null when property not found', async () => {
      const propertyId = 'non-existent-property';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116', message: 'No rows returned' } 
            }),
          }),
        }),
      });

      const result = await getPropertyById(propertyId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const propertyId = 'property-123';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database connection failed' } 
            }),
          }),
        }),
      });

      await expect(getPropertyById(propertyId)).rejects.toThrow('Failed to get property by ID: Database connection failed');
    });

    it('should handle network errors', async () => {
      const propertyId = 'property-123';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Network timeout')),
          }),
        }),
      });

      await expect(getPropertyById(propertyId)).rejects.toThrow('Failed to get property by ID: Network timeout');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle successful property retrieval workflow', async () => {
      // Test the complete workflow: get user properties, then get specific property
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockProperties, error: null }),
            single: jest.fn().mockResolvedValue({ data: mockProperties[0], error: null }),
          }),
        }),
      });

      // First, get user properties
      const userProperties = await getUserProperties();
      expect(userProperties).toEqual(mockProperties);

      // Then, get a specific property by ID
      const specificProperty = await getPropertyById('property-1');
      expect(specificProperty).toEqual(mockProperties[0]);
    });

    it('should handle empty properties list scenario', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await getUserProperties();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle authentication failure scenario', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(getUserProperties()).rejects.toThrow('User not authenticated');
    });
  });
}); 