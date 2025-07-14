// Mock Supabase before importing read_property_images functions
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('../supabaseClient', () => ({
  supabase: mockSupabase,
}));

import { getPropertyImages, getPropertyImageById } from '../lib/read_property_images';
import { PropertyImage } from '../types/database';

describe('Read Property Images Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPropertyImages', () => {
    it('should retrieve all images for a property successfully', async () => {
      const propertyId = 'property-123';
      const mockImages: PropertyImage[] = [
        {
          id: 'image-1',
          property_id: propertyId,
          image_url: 'https://example.com/photo1.jpg',
          image_order: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'image-2',
          property_id: propertyId,
          image_url: 'https://example.com/photo2.jpg',
          image_order: 1,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'image-3',
          property_id: propertyId,
          image_url: 'https://example.com/photo3.jpg',
          image_order: 2,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockImages, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyImages(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('property_images');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockSelect().eq).toHaveBeenCalledWith('property_id', propertyId);
      expect(mockSelect().eq().order).toHaveBeenCalledWith('image_order', { ascending: true });
      expect(result).toEqual(mockImages);
    });

    it('should return empty array when no images found for property', async () => {
      const propertyId = 'property-123';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyImages(propertyId);

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      const propertyId = 'property-123';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Connection timeout' } 
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getPropertyImages(propertyId)).rejects.toThrow('Failed to fetch property images: Connection timeout');
    });

    it('should handle null data response', async () => {
      const propertyId = 'property-123';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyImages(propertyId);

      expect(result).toEqual([]);
    });
  });

  describe('getPropertyImageById', () => {
    it('should retrieve a specific property image by ID successfully', async () => {
      const imageId = 'image-123';
      const mockImage: PropertyImage = {
        id: imageId,
        property_id: 'property-123',
        image_url: 'https://example.com/photo.jpg',
        image_order: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockImage, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyImageById(imageId);

      expect(mockSupabase.from).toHaveBeenCalledWith('property_images');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockSelect().eq).toHaveBeenCalledWith('id', imageId);
      expect(mockSelect().eq().single).toHaveBeenCalled();
      expect(result).toEqual(mockImage);
    });

    it('should return null when image is not found', async () => {
      const imageId = 'non-existent-image';

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

      const result = await getPropertyImageById(imageId);

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const imageId = 'image-123';

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

      await expect(getPropertyImageById(imageId)).rejects.toThrow('Failed to fetch property image: Database connection failed');
    });

    it('should handle other error codes besides PGRST116', async () => {
      const imageId = 'image-123';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST500', message: 'Internal server error' } 
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getPropertyImageById(imageId)).rejects.toThrow('Failed to fetch property image: Internal server error');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple property images with different orders', async () => {
      const propertyId = 'property-123';
      // Mock data should be returned in sorted order by image_order
      const mockImages: PropertyImage[] = [
        {
          id: 'image-2',
          property_id: propertyId,
          image_url: 'https://example.com/photo2.jpg',
          image_order: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'image-3',
          property_id: propertyId,
          image_url: 'https://example.com/photo3.jpg',
          image_order: 1,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'image-1',
          property_id: propertyId,
          image_url: 'https://example.com/photo1.jpg',
          image_order: 2,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockImages, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyImages(propertyId);

      // Should return images in order by image_order
      expect(result).toEqual(mockImages);
      expect(result[0].image_order).toBe(0);
      expect(result[1].image_order).toBe(1);
      expect(result[2].image_order).toBe(2);
    });

    it('should handle property with single image', async () => {
      const propertyId = 'property-456';
      const mockImage: PropertyImage = {
        id: 'image-single',
        property_id: propertyId,
        image_url: 'https://example.com/single-photo.jpg',
        image_order: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [mockImage], error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyImages(propertyId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockImage);
    });

    it('should handle property with no images', async () => {
      const propertyId = 'property-empty';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyImages(propertyId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
}); 