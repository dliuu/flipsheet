// Mock Supabase before importing database functions
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

jest.mock('../supabaseClient', () => ({
  supabase: mockSupabase,
}));

import { 
  createProperty, 
  uploadPropertyPhotos, 
  createPropertyWithPhotos,
  getPropertyPhotos 
} from '../lib/database';
import { CreatePropertyData } from '../types/database';

describe('Database Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    it('should create a property successfully', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      // Mock database insert
      const mockProperty = {
        id: 'property-123',
        title: 'Test Property',
        description: 'A test property',
        address: '123 Test St',
        property_type: 'Single Family',
        bedrooms: 3,
        bathrooms: 2.5,
        interior_sqft: 2150,
        lot_sqft: 8500,
        asking_price: 250000.00,
        estimated_closing_costs: 10000.00,
        estimated_after_repair_value: 350000.00,
        estimated_as_is_value: 275000.00,
        rehab_cost: 50000.00,
        rehab_duration_months: 2,
        seller_email: 'test@example.com',
        seller_phone: '(555) 123-4567',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        description: 'A test property',
        address: '123 Test St',
        property_type: 'Single Family',
        bedrooms: 3,
        bathrooms: 2.5,
        square_footage: 2150,
        lot_size: 8500,
        asking_price: 250000.00,
        estimated_closing_costs: 10000.00,
        estimated_after_repair_value: 350000.00,
        estimated_as_is_value: 275000.00,
        rehab_cost: 50000.00,
        rehab_duration_months: 2,
        contact_email: 'test@example.com',
        phone_number: '(555) 123-4567',
      };

      const result = await createProperty(propertyData);

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('properties');
      expect(mockInsert).toHaveBeenCalledWith({
        title: 'Test Property',
        description: 'A test property',
        address: '123 Test St',
        property_type: 'Single Family',
        bedrooms: 3,
        bathrooms: 2.5,
        interior_sqft: 2150,
        lot_sqft: 8500,
        asking_price: 250000.00,
        estimated_closing_costs: 10000.00,
        estimated_after_repair_value: 350000.00,
        estimated_as_is_value: 275000.00,
        rehab_cost: 50000.00,
        rehab_duration_months: 2,
        seller_email: 'test@example.com',
        seller_phone: '(555) 123-4567',
      });
      expect(result).toEqual(mockProperty);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: 'Single Family',
      };

      await expect(createProperty(propertyData)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: 'Single Family',
      };

      await expect(createProperty(propertyData)).rejects.toThrow();
    });

    it('should handle missing property_type', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'null value in column "property_type" of relation "properties" violates not-null constraint' } }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: '', // Empty string should cause constraint violation
      };

      await expect(createProperty(propertyData)).rejects.toThrow();
    });
  });

  describe('uploadPropertyPhotos', () => {
    it('should upload photos successfully', async () => {
      // Mock user authentication
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const propertyId = 'property-123';
      const mockFiles = [
        new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['photo2'], 'photo2.jpg', { type: 'image/jpeg' }),
      ];

      // Mock storage upload
      const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });
      
      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      // Mock database insert
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await uploadPropertyPhotos(propertyId, mockFiles);

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('property-photos');
      expect(mockUpload).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenCalledWith([
        {
          property_id: propertyId,
          image_url: 'https://example.com/photo.jpg',
          image_order: 0,
        },
        {
          property_id: propertyId,
          image_url: 'https://example.com/photo.jpg',
          image_order: 1,
        },
      ]);
      expect(result).toHaveLength(2);
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const propertyId = 'property-123';
      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];
      await expect(uploadPropertyPhotos(propertyId, mockFiles)).rejects.toThrow('User not authenticated');
    });

    it('should handle storage upload errors', async () => {
      const propertyId = 'property-123';
      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];

      const mockUpload = jest.fn().mockResolvedValue({ data: null, error: { message: 'Upload failed' } });
      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
      });

      await expect(uploadPropertyPhotos(propertyId, mockFiles)).rejects.toThrow();
    });

    it('should handle database insert errors', async () => {
      const propertyId = 'property-123';
      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];

      const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });
      
      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Database error' } });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      await expect(uploadPropertyPhotos(propertyId, mockFiles)).rejects.toThrow();
    });
  });

  describe('createPropertyWithPhotos', () => {
    it('should create property with photos successfully', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockProperty = {
        id: 'property-123',
        title: 'Test Property',
        address: '123 Test St',
      };

      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];

      // Mock createProperty
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      // Mock uploadPropertyPhotos
      const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });
      
      mockSupabase.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: 'Single Family',
      };

      const result = await createPropertyWithPhotos(propertyData, mockFiles);

      expect(result).toEqual(mockProperty);
    });

    it('should create property without photos', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockProperty = {
        id: 'property-123',
        title: 'Test Property',
        address: '123 Test St',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: 'Single Family',
      };

      const result = await createPropertyWithPhotos(propertyData);

      expect(result).toEqual(mockProperty);
    });

    it('should handle errors during property creation', async () => {
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: 'Single Family',
      };

      await expect(createPropertyWithPhotos(propertyData)).rejects.toThrow();
    });
  });

  describe('getPropertyPhotos', () => {
    it('should retrieve property photos successfully', async () => {
      const propertyId = 'property-123';
      const mockPhotos = [
        { id: 'photo-1', property_id: propertyId, image_url: 'https://example.com/photo1.jpg', image_order: 0 },
        { id: 'photo-2', property_id: propertyId, image_url: 'https://example.com/photo2.jpg', image_order: 1 },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockPhotos, error: null }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getPropertyPhotos(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('property_images');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockPhotos);
    });

    it('should handle database errors', async () => {
      const propertyId = 'property-123';

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await expect(getPropertyPhotos(propertyId)).rejects.toThrow();
    });
  });
}); 