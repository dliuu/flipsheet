// Mock Supabase and auth functions before importing database functions
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

const mockAuthFunctions = {
  getCurrentUser: jest.fn(),
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
};

jest.mock('../supabaseClient', () => ({
  supabase: mockSupabase,
}));

jest.mock('../lib/auth', () => mockAuthFunctions);

import {
  createProperty,
  uploadPropertyPhotos,
  createPropertyWithPhotos,
  getPropertyPhotos,
  writeFlipAnalysis,
} from '../lib/database';
import { CreatePropertyData } from '../types/database';

describe('Database Functions', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock responses
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    mockAuthFunctions.getCurrentUser.mockResolvedValue(mockUser);
  });

  describe('createProperty', () => {
    it('should create a property successfully', async () => {
      // Mock database insert
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
          }),
        }),
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
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          }),
        }),
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: 'Single Family',
      };

      await expect(createProperty(propertyData)).rejects.toThrow('Database error');
    });
  });

  describe('uploadPropertyPhotos', () => {
    it('should upload photos successfully', async () => {
      const propertyId = 'property-123';
      const mockFiles = [
        new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['photo2'], 'photo2.jpg', { type: 'image/jpeg' }),
      ];

      // Mock storage operations
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
      });

      // Mock database operations - first for property verification, then for photo insertion
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: propertyId }, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await uploadPropertyPhotos(propertyId, mockFiles);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('property-photos');
      expect(result).toHaveLength(2);
    });

    it('should handle property not found error', async () => {
      const propertyId = 'non-existent-property';
      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Property not found' } }),
          }),
        }),
      });

      await expect(uploadPropertyPhotos(propertyId, mockFiles)).rejects.toThrow('Property not found');
    });

    it('should handle storage upload errors', async () => {
      const propertyId = 'property-123';
      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: { message: 'Upload failed' } }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: propertyId }, error: null }),
          }),
        }),
      });

      await expect(uploadPropertyPhotos(propertyId, mockFiles)).rejects.toThrow('Upload failed');
    });

    it('should handle database insert errors', async () => {
      const propertyId = 'property-123';
      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];

      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: propertyId }, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      });

      await expect(uploadPropertyPhotos(propertyId, mockFiles)).rejects.toThrow('Database error');
    });
  });

  describe('createPropertyWithPhotos', () => {
    it('should create property with photos successfully', async () => {
      const mockFiles = [new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' })];

      // Mock for createProperty (first call)
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
          }),
        }),
      });

      // Mock for uploadPropertyPhotos (second call) - property verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: mockProperty.id }, error: null }),
          }),
        }),
      });

      // Mock for uploadPropertyPhotos (third call) - photo insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock storage operations for uploadPropertyPhotos
      mockSupabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
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
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProperty, error: null }),
          }),
        }),
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
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          }),
        }),
      });

      const propertyData: CreatePropertyData = {
        title: 'Test Property',
        address: '123 Test St',
        property_type: 'Single Family',
      };

      await expect(createPropertyWithPhotos(propertyData)).rejects.toThrow('Database error');
    });
  });

  describe('getPropertyPhotos', () => {
    it('should retrieve property photos successfully', async () => {
      const propertyId = 'property-123';
      const mockPhotos = [
        { id: 'photo-1', property_id: propertyId, image_url: 'https://example.com/photo1.jpg', image_order: 0 },
        { id: 'photo-2', property_id: propertyId, image_url: 'https://example.com/photo2.jpg', image_order: 1 },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockPhotos, error: null }),
          }),
        }),
      });

      const result = await getPropertyPhotos(propertyId);

      expect(mockSupabase.from).toHaveBeenCalledWith('property_images');
      expect(result).toEqual(mockPhotos);
    });

    it('should handle database errors', async () => {
      const propertyId = 'property-123';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          }),
        }),
      });

      await expect(getPropertyPhotos(propertyId)).rejects.toThrow('Database error');
    });
  });

  describe('writeFlipAnalysis', () => {
    it('should write flip analysis data successfully', async () => {
      const propertyId = 'property-123';
      const analysisData = {
        purchasePrice: 250000,
        closingCosts: 10000,
        rehabCosts: 50000,
        afterRepairValue: 350000,
        interiorSqft: 2150,
        taxRate: 25,
      };

      // Simulate no existing row
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });
      // Simulate insert
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'analysis-1', ...analysisData }, error: null }),
          }),
        }),
      });

      const result = await writeFlipAnalysis(propertyId, analysisData);
      expect(result).toMatchObject({ id: 'analysis-1', ...analysisData });
    });

    it('should update flip analysis data if row exists', async () => {
      const propertyId = 'property-123';
      const analysisData = {
        purchasePrice: 250000,
        closingCosts: 10000,
        rehabCosts: 50000,
        afterRepairValue: 350000,
        interiorSqft: 2150,
        taxRate: 25,
      };

      // Simulate existing row
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValue({ data: { id: 'analysis-1' }, error: null }),
          }),
        }),
      });
      // Simulate update
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'analysis-1', ...analysisData }, error: null }),
            }),
          }),
        }),
      });

      const result = await writeFlipAnalysis(propertyId, analysisData);
      expect(result).toMatchObject({ id: 'analysis-1', ...analysisData });
    });
  });
}); 