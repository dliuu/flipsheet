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

// Mock React hooks for testing component behavior
const mockUseState = jest.fn();
const mockUseEffect = jest.fn();

jest.mock('react', () => ({
  useState: mockUseState,
  useEffect: mockUseEffect,
}));

describe('Read Properties Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProperties', () => {
    it('should return user properties when user is authenticated', async () => {
      // Mock authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Mock properties data
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

      // Mock Supabase query chain
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProperties, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getUserProperties();

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockProperties);
    });

    it('should throw error when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(getUserProperties()).rejects.toThrow('User not authenticated');
      expect(mockGetCurrentUser).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Mock database error
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getUserProperties()).rejects.toThrow('Failed to get user properties: Database connection failed');
    });

    it('should return empty array when user has no properties', async () => {
      // Mock authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Mock empty result
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
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

      // Mock Supabase query chain
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyById(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockProperty);
    });

    it('should return null when property not found', async () => {
      const propertyId = 'non-existent-property';

      // Mock Supabase query chain with PGRST116 error (not found)
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116', message: 'No rows returned' } 
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyById(propertyId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const propertyId = 'property-123';

      // Mock Supabase query chain with database error
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database connection failed' } 
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getPropertyById(propertyId)).rejects.toThrow('Failed to get property by ID: Database connection failed');
    });

    it('should handle network errors', async () => {
      const propertyId = 'property-123';

      // Mock Supabase query chain with network error
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Network timeout')),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getPropertyById(propertyId)).rejects.toThrow('Failed to get property by ID: Network timeout');
    });
  });

  describe('Dashboard Integration Tests', () => {
    it('should work with React useState and useEffect pattern', async () => {
      // Mock React hooks
      const mockSetUserProperties = jest.fn();
      const mockSetLoading = jest.fn();
      const mockSetError = jest.fn();
      
      mockUseState
        .mockReturnValueOnce([[], mockSetUserProperties]) // user_properties
        .mockReturnValueOnce([true, mockSetLoading]) // loading
        .mockReturnValueOnce([null, mockSetError]); // error

      // Mock authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Mock properties data
      const mockProperties: Property[] = [
        {
          id: 'property-1',
          user_id: 'user-123',
          title: 'Dashboard Test Property',
          description: 'A property for dashboard testing',
          address: '123 Dashboard St',
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
      ];

      // Mock Supabase query chain
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProperties, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Simulate the dashboard's fetchUserProperties function
      const fetchUserProperties = async () => {
        try {
          mockSetLoading(true);
          mockSetError(null);
          const properties = await getUserProperties();
          mockSetUserProperties(properties);
        } catch (err) {
          console.error('Error fetching user properties:', err);
          mockSetError(err instanceof Error ? err.message : 'Failed to fetch properties');
        } finally {
          mockSetLoading(false);
        }
      };

      await fetchUserProperties();

      // Verify the function calls match dashboard behavior
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockSetUserProperties).toHaveBeenCalledWith(mockProperties);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
    });

    it('should handle errors in dashboard context', async () => {
      // Mock React hooks
      const mockSetUserProperties = jest.fn();
      const mockSetLoading = jest.fn();
      const mockSetError = jest.fn();
      
      mockUseState
        .mockReturnValueOnce([[], mockSetUserProperties]) // user_properties
        .mockReturnValueOnce([true, mockSetLoading]) // loading
        .mockReturnValueOnce([null, mockSetError]); // error

      // Mock unauthenticated user to trigger error
      mockGetCurrentUser.mockResolvedValue(null);

      // Simulate the dashboard's fetchUserProperties function
      const fetchUserProperties = async () => {
        try {
          mockSetLoading(true);
          mockSetError(null);
          const properties = await getUserProperties();
          mockSetUserProperties(properties);
        } catch (err) {
          console.error('Error fetching user properties:', err);
          mockSetError(err instanceof Error ? err.message : 'Failed to fetch properties');
        } finally {
          mockSetLoading(false);
        }
      };

      await fetchUserProperties();

      // Verify error handling
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockSetError).toHaveBeenCalledWith('Failed to get user properties: User not authenticated');
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockSetUserProperties).not.toHaveBeenCalled(); // Should not be called on error
    });

    it('should handle empty properties list in dashboard', async () => {
      // Mock React hooks
      const mockSetUserProperties = jest.fn();
      const mockSetLoading = jest.fn();
      const mockSetError = jest.fn();
      
      mockUseState
        .mockReturnValueOnce([[], mockSetUserProperties]) // user_properties
        .mockReturnValueOnce([true, mockSetLoading]) // loading
        .mockReturnValueOnce([null, mockSetError]); // error

      // Mock authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Mock empty properties result
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Simulate the dashboard's fetchUserProperties function
      const fetchUserProperties = async () => {
        try {
          mockSetLoading(true);
          mockSetError(null);
          const properties = await getUserProperties();
          mockSetUserProperties(properties);
        } catch (err) {
          console.error('Error fetching user properties:', err);
          mockSetError(err instanceof Error ? err.message : 'Failed to fetch properties');
        } finally {
          mockSetLoading(false);
        }
      };

      await fetchUserProperties();

      // Verify empty array handling
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockSetUserProperties).toHaveBeenCalledWith([]);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });
}); 