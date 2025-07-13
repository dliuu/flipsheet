'use client';

import { useState, useRef, useEffect } from 'react';
import { createPropertyWithPhotos } from '../../lib/database';
import { supabase } from '@/supabaseClient';
import SignUpModal from '@/components/SignUpModal';

export default function CreateListingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    propertyType: '',
    askingPrice: '',
    estimatedAfterRepairValue: '',
    estimatedClosingCosts: '',
    estimatedAsIsValue: '',
    rehabCost: '',
    rehabDurationMonths: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    lotSize: '',
    contactEmail: '',
    phoneNumber: ''
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // If user is not authenticated, show the sign-up modal
      if (!user) {
        setShowSignUpModal(true);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setShowSignUpModal(true);
    }
  };

  const handleSignUpSuccess = () => {
    setIsAuthenticated(true);
    setShowSignUpModal(false);
  };

  const handleCloseModal = () => {
    setShowSignUpModal(false);
    // Redirect to home page if user closes the modal without signing up
    window.location.href = '/';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter for image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Limit to 20 photos
    const remainingSlots = 20 - photos.length;
    const newPhotos = imageFiles.slice(0, remainingSlots);
    
    if (newPhotos.length > 0) {
      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      
      // Create preview URLs
      const newUrls = newPhotos.map(file => URL.createObjectURL(file));
      setPhotoUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    const updatedUrls = photoUrls.filter((_, i) => i !== index);
    
    setPhotos(updatedPhotos);
    setPhotoUrls(updatedUrls);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitProperty();
  };

  const submitProperty = async () => {
    setIsSubmitting(true);
    
    try {
      // Create property with photos using the comprehensive function
      const property = await createPropertyWithPhotos({
        title: formData.title,
        description: formData.description,
        address: formData.address,
        property_type: formData.propertyType,
        asking_price: parseFloat(formData.askingPrice) || undefined,
        estimated_after_repair_value: parseFloat(formData.estimatedAfterRepairValue) || undefined,
        estimated_closing_costs: parseFloat(formData.estimatedClosingCosts) || undefined,
        estimated_as_is_value: parseFloat(formData.estimatedAsIsValue) || undefined,
        rehab_cost: parseFloat(formData.rehabCost) || undefined,
        rehab_duration_months: parseInt(formData.rehabDurationMonths) || undefined,
        bedrooms: parseFloat(formData.bedrooms) || undefined,
        bathrooms: parseFloat(formData.bathrooms) || undefined,
        square_footage: parseInt(formData.squareFootage) || undefined,
        lot_size: parseInt(formData.lotSize) || undefined,
        contact_email: formData.contactEmail,
        phone_number: formData.phoneNumber
      }, photos);

      // Show success message
      alert('Property listed successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        address: '',
        propertyType: '',
        askingPrice: '',
        estimatedAfterRepairValue: '',
        estimatedClosingCosts: '',
        estimatedAsIsValue: '',
        rehabCost: '',
        rehabDurationMonths: '',
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        lotSize: '',
        contactEmail: '',
        phoneNumber: ''
      });
      setPhotos([]);
      setPhotoUrls([]);
      
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Error creating property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b80ee] mx-auto mb-4"></div>
          <p className="text-[#121416] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-up modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#121416] leading-tight">
              List Your Off-Market Property
            </h1>
          </div>
          <div className="text-center py-12">
            <p className="text-[#121416] text-lg mb-4">Please sign up to list your property.</p>
          </div>
        </div>
        
        {/* Sign Up Modal */}
        <SignUpModal
          isOpen={showSignUpModal}
          onClose={handleCloseModal}
          onSuccess={handleSignUpSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#121416] leading-tight">
            List Your Off-Market Property
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Title */}
          <div className="space-y-2">
            <label className="block text-[#121416] text-base font-medium">
              Property Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Charming 3-Bedroom Home in Willow Creek"
              className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              required
            />
          </div>

          {/* Property Description */}
          <div className="space-y-2">
            <label className="block text-[#121416] text-base font-medium">
              Property Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter a detailed description of the property, including key features, potential, and any unique selling points."
              rows={6}
              className="w-full min-h-36 px-4 py-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none resize-none"
            />
          </div>

          {/* Property Address */}
          <div className="space-y-2">
            <label className="block text-[#121416] text-base font-medium">
              Property Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Oak Street, Anytown, CA"
              className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              required
            />
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="block text-[#121416] text-base font-medium">
              Property Type
            </label>
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] text-base font-normal focus:outline-none focus:ring-0 border-none"
              required
            >
              <option value="">Select Property Type</option>
              <option value="Single Family">Single Family</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Condo">Condo</option>
              <option value="Commercial">Commercial</option>
              <option value="Land">Land</option>
            </select>
          </div>

          {/* Price Fields - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Asking Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="askingPrice"
                value={formData.askingPrice}
                onChange={handleInputChange}
                placeholder="250000"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Estimated After Repair Value ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="estimatedAfterRepairValue"
                value={formData.estimatedAfterRepairValue}
                onChange={handleInputChange}
                placeholder="350000"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* Additional Price Fields - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Estimated Closing Costs ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="estimatedClosingCosts"
                value={formData.estimatedClosingCosts}
                onChange={handleInputChange}
                placeholder="10000"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Estimated As-Is Value ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="estimatedAsIsValue"
                value={formData.estimatedAsIsValue}
                onChange={handleInputChange}
                placeholder="275000"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* Cost Fields - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Estimated Rehab Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="rehabCost"
                value={formData.rehabCost}
                onChange={handleInputChange}
                placeholder="50000"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Rehab Duration (months)
              </label>
              <input
                type="number"
                step="1"
                name="rehabDurationMonths"
                value={formData.rehabDurationMonths}
                onChange={handleInputChange}
                placeholder="2"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* Bedrooms and Bathrooms - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Bedrooms
              </label>
              <input
                type="number"
                step="0.5"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                placeholder="3"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Bathrooms
              </label>
              <input
                type="number"
                step="0.5"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                placeholder="2"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* Interior Square Footage and Lot Size - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Interior Square Footage (sq ft)
              </label>
              <input
                type="number"
                step="1"
                name="squareFootage"
                value={formData.squareFootage}
                onChange={handleInputChange}
                placeholder="1500"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Lot Size (sq ft)
              </label>
              <input
                type="number"
                step="1"
                name="lotSize"
                value={formData.lotSize}
                onChange={handleInputChange}
                placeholder="5000"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* Contact Information - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[#121416] text-base font-medium">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#dde1e3] rounded-xl p-8 text-center cursor-pointer" onClick={handleUploadClick}>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#121416] leading-tight">
                  Upload Photos
                </h3>
                <p className="text-sm text-[#121416] leading-normal">
                  {photos.length === 0 
                    ? "Click to upload property photos (up to 20 photos)"
                    : `${photos.length}/20 photos uploaded`
                  }
                </p>
                <button
                  type="button"
                  disabled={photos.length >= 20}
                  className="h-10 px-4 rounded-full bg-[#f1f2f4] text-[#121416] text-sm font-bold tracking-[0.015em] hover:bg-[#e5e7eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {photos.length >= 20 ? 'Maximum photos reached' : 'Upload Photos'}
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 px-5 rounded-full bg-[#dce8f3] text-[#121416] text-base font-bold tracking-[0.015em] hover:bg-[#c5d9e8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Property...' : 'List Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 