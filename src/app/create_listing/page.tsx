'use client';

import { useState, useRef } from 'react';
import { createProperty, uploadPropertyPhotos } from '../../lib/database';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateListingPage() {
  const { user, signUp } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    askingPrice: '',
    rehabValue: '',
    rehabCost: '',
    potentialProfit: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    lotSize: '',
    contactEmail: '',
    phoneNumber: ''
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupData, setSignupData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
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
    
    if (!user) {
      // Prefill signup form with existing data
      setSignupData({
        email: formData.contactEmail,
        phoneNumber: formData.phoneNumber,
        password: '',
        confirmPassword: ''
      });
      
      // Show modal
      setShowModal(true);
      return;
    }

    // User is authenticated, proceed with property creation
    await submitProperty();
  };

  const submitProperty = async () => {
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      // Create property
      const property = await createProperty({
        title: formData.title,
        description: formData.description,
        address: formData.address,
        asking_price: parseFloat(formData.askingPrice) || undefined,
        rehab_value: parseFloat(formData.rehabValue) || undefined,
        rehab_cost: parseFloat(formData.rehabCost) || undefined,
        potential_profit: parseFloat(formData.potentialProfit) || undefined,
        bedrooms: parseFloat(formData.bedrooms) || undefined,
        bathrooms: parseFloat(formData.bathrooms) || undefined,
        square_footage: parseInt(formData.squareFootage) || undefined,
        lot_size: parseInt(formData.lotSize) || undefined,
        contact_email: formData.contactEmail,
        phone_number: formData.phoneNumber
      });

      // Upload photos if any
      if (photos.length > 0) {
        await uploadPropertyPhotos(property.id, photos);
      }

      // Show success message
      alert('Property listed successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        address: '',
        askingPrice: '',
        rehabValue: '',
        rehabCost: '',
        potentialProfit: '',
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

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await signUp(signupData.email, signupData.password, signupData.phoneNumber);
      setShowModal(false);
      alert('Account created successfully! You can now list your property.');
      
      // Automatically submit the property after successful signup
      await submitProperty();
      
    } catch (error) {
      console.error('Error signing up:', error);
      alert('Error creating account. Please try again.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#121416] leading-tight">
            List Your Off-Market Property
          </h1>
          {user && (
            <p className="text-sm text-[#6a7681] mt-2">
              Welcome back, {user.email}
            </p>
          )}
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
                Estimated Rehab Value ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="rehabValue"
                value={formData.rehabValue}
                onChange={handleInputChange}
                placeholder="350000"
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
                Potential Profit ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="potentialProfit"
                value={formData.potentialProfit}
                onChange={handleInputChange}
                placeholder="50000"
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
              {isSubmitting ? 'Creating Property...' : (user ? 'List Property' : 'List Property (Sign Up Required)')}
            </button>
          </div>
        </form>
      </div>

      {/* Signup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#121416] leading-tight">
                Create Your Account
              </h2>
              <p className="text-sm text-[#6a7681] mt-2">
                Sign up to list your property
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[#121416] text-base font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupInputChange}
                  required
                  className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#121416] text-base font-medium">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={signupData.phoneNumber}
                  onChange={handleSignupInputChange}
                  className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#121416] text-base font-medium">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupInputChange}
                  required
                  className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#121416] text-base font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupInputChange}
                  required
                  className="w-full h-14 px-4 rounded-xl bg-[#f1f2f4] text-[#121416] placeholder:text-[#6a7681] text-base font-normal focus:outline-none focus:ring-0 border-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-12 px-4 rounded-full bg-[#f1f2f4] text-[#121416] text-base font-bold tracking-[0.015em] hover:bg-[#e5e7eb] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 px-4 rounded-full bg-[#dce8f3] text-[#121416] text-base font-bold tracking-[0.015em] hover:bg-[#c5d9e8] transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 