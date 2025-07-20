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
import { getPropertyImages } from '../lib/read_property_images';
import { Property, PropertyImage } from '../types/database';

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

  const mockPropertyImages: PropertyImage[] = [
    {
      id: 'image-1',
      property_id: 'property-1',
      image_url: 'https://example.com/image1.jpg',
      image_order: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'image-2',
      property_id: 'property-1',
      image_url: 'https://example.com/image2.jpg',
      image_order: 2,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'image-3',
      property_id: 'property-1',
      image_url: 'https://example.com/image3.jpg',
      image_order: 3,
      created_at: '2024-01-01T00:00:00Z',
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

  describe('Property Page Integration Tests', () => {
    describe('getPropertyImages', () => {
      it('should return property images when found', async () => {
        const propertyId = 'property-1';

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockPropertyImages, error: null }),
            }),
          }),
        });

        const result = await getPropertyImages(propertyId);

        expect(mockSupabase.from).toHaveBeenCalledWith('property_images');
        expect(result).toEqual(mockPropertyImages);
      });

      it('should return empty array when no images found', async () => {
        const propertyId = 'property-with-no-images';

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });

        const result = await getPropertyImages(propertyId);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('should handle database errors when fetching images', async () => {
        const propertyId = 'property-1';

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Database connection failed' } 
              }),
            }),
          }),
        });

        await expect(getPropertyImages(propertyId)).rejects.toThrow('Failed to fetch property images: Database connection failed');
      });

      it('should handle network errors when fetching images', async () => {
        const propertyId = 'property-1';

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Network timeout')),
            }),
          }),
        });

        await expect(getPropertyImages(propertyId)).rejects.toThrow('Network timeout');
      });
    });

    describe('Property Page Data Fetching Workflow', () => {
      it('should successfully fetch property data and images for property page', async () => {
        const propertyId = 'property-1';

        // Mock property data fetch
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockProperties[0], error: null }),
              order: jest.fn().mockResolvedValue({ data: mockPropertyImages, error: null }),
            }),
          }),
        });

        // Fetch property data
        const property = await getPropertyById(propertyId);
        expect(property).toEqual(mockProperties[0]);

        // Fetch property images
        const images = await getPropertyImages(propertyId);
        expect(images).toEqual(mockPropertyImages);

        // Verify the complete dataset for property page
        expect(property).toHaveProperty('id', propertyId);
        expect(property).toHaveProperty('title');
        expect(property).toHaveProperty('address');
        expect(images).toHaveLength(3);
        expect(images[0]).toHaveProperty('image_url');
        expect(images[0]).toHaveProperty('image_order');
      });

      it('should handle property not found scenario', async () => {
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

        const property = await getPropertyById(propertyId);
        expect(property).toBeNull();
      });

      it('should handle property found but no images scenario', async () => {
        const propertyId = 'property-1';

        // Mock property data fetch success
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockProperties[0], error: null }),
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });

        const property = await getPropertyById(propertyId);
        const images = await getPropertyImages(propertyId);

        expect(property).toEqual(mockProperties[0]);
        expect(images).toEqual([]);
      });

      it('should handle property fetch failure but images success scenario', async () => {
        const propertyId = 'property-1';

        // Mock property data fetch failure
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Property fetch failed' } 
              }),
              order: jest.fn().mockResolvedValue({ data: mockPropertyImages, error: null }),
            }),
          }),
        });

        await expect(getPropertyById(propertyId)).rejects.toThrow('Failed to get property by ID: Property fetch failed');
      });
    });

    describe('Property Page Financial Calculations', () => {
      it('should calculate correct financial metrics for property with complete data', () => {
        const property = mockProperties[0]; // property-1 with complete financial data
        
        // Calculate expected metrics
        const totalInvestment = (property.asking_price || 0) + (property.estimated_closing_costs || 0) + (property.rehab_cost || 0);
        const totalProfit = (property.estimated_after_repair_value || 0) - totalInvestment;
        const totalROI = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
        const annualizedROI = property.rehab_duration_months && property.rehab_duration_months > 0 
          ? (totalROI / property.rehab_duration_months) * 12 
          : 0;
        const profitPerSqft = property.interior_sqft && property.interior_sqft > 0 
          ? totalProfit / property.interior_sqft 
          : 0;

        // Expected calculations for property-1
        expect(totalInvestment).toBe(310000); // 250000 + 10000 + 50000
        expect(totalProfit).toBe(40000); // 350000 - 310000
        expect(totalROI).toBeCloseTo(12.90, 2); // (40000 / 310000) * 100
        expect(annualizedROI).toBeCloseTo(77.42, 2); // (12.90 / 2) * 12
        expect(profitPerSqft).toBeCloseTo(18.60, 2); // 40000 / 2150
      });

      it('should handle financial calculations with missing data', () => {
        const propertyWithMissingData: Property = {
          ...mockProperties[0],
          asking_price: undefined,
          estimated_closing_costs: undefined,
          rehab_cost: undefined,
          estimated_after_repair_value: undefined,
          rehab_duration_months: undefined,
          interior_sqft: undefined,
        };

        const totalInvestment = (propertyWithMissingData.asking_price || 0) + (propertyWithMissingData.estimated_closing_costs || 0) + (propertyWithMissingData.rehab_cost || 0);
        const totalProfit = (propertyWithMissingData.estimated_after_repair_value || 0) - totalInvestment;
        const totalROI = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
        const annualizedROI = propertyWithMissingData.rehab_duration_months && propertyWithMissingData.rehab_duration_months > 0 
          ? (totalROI / propertyWithMissingData.rehab_duration_months) * 12 
          : 0;
        const profitPerSqft = propertyWithMissingData.interior_sqft && propertyWithMissingData.interior_sqft > 0 
          ? totalProfit / propertyWithMissingData.interior_sqft 
          : 0;

        expect(totalInvestment).toBe(0);
        expect(totalProfit).toBe(0);
        expect(totalROI).toBe(0);
        expect(annualizedROI).toBe(0);
        expect(profitPerSqft).toBe(0);
      });

      it('should handle zero values in financial calculations', () => {
        const propertyWithZeros: Property = {
          ...mockProperties[0],
          asking_price: 0,
          estimated_closing_costs: 0,
          rehab_cost: 0,
          estimated_after_repair_value: 0,
          rehab_duration_months: 0,
          interior_sqft: 0,
        };

        const totalInvestment = (propertyWithZeros.asking_price || 0) + (propertyWithZeros.estimated_closing_costs || 0) + (propertyWithZeros.rehab_cost || 0);
        const totalProfit = (propertyWithZeros.estimated_after_repair_value || 0) - totalInvestment;
        const totalROI = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
        const annualizedROI = propertyWithZeros.rehab_duration_months && propertyWithZeros.rehab_duration_months > 0 
          ? (totalROI / propertyWithZeros.rehab_duration_months) * 12 
          : 0;
        const profitPerSqft = propertyWithZeros.interior_sqft && propertyWithZeros.interior_sqft > 0 
          ? totalProfit / propertyWithZeros.interior_sqft 
          : 0;

        expect(totalInvestment).toBe(0);
        expect(totalProfit).toBe(0);
        expect(totalROI).toBe(0);
        expect(annualizedROI).toBe(0);
        expect(profitPerSqft).toBe(0);
      });
    });

    describe('Property Page Error Handling', () => {
      it('should handle property fetch timeout', async () => {
        const propertyId = 'property-1';

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error('Request timeout')),
            }),
          }),
        });

        await expect(getPropertyById(propertyId)).rejects.toThrow('Failed to get property by ID: Request timeout');
      });

      it('should handle images fetch timeout', async () => {
        const propertyId = 'property-1';

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Request timeout')),
            }),
          }),
        });

        await expect(getPropertyImages(propertyId)).rejects.toThrow('Request timeout');
      });

      it('should handle malformed property data', async () => {
        const propertyId = 'property-1';
        const malformedProperty = {
          id: propertyId,
          // Missing required fields
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: malformedProperty, error: null }),
            }),
          }),
        });

        const result = await getPropertyById(propertyId);
        expect(result).toEqual(malformedProperty);
        // The property page should handle missing fields gracefully
      });
    });
  });
}); 