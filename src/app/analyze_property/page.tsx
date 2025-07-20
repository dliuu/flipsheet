'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { useAuth } from '@/lib/auth/useAuth';
import { getPropertyImages } from '@/lib/read_property_images';
import { Property, PropertyImage } from '@/types/database';

export default function AnalyzePropertyPage() {
  const searchParams = useSearchParams();
  const propertyParam = searchParams.get('property');
  const { user } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userContact, setUserContact] = useState('');
  const [message, setMessage] = useState('');

  // Check if current user is the property owner
  const isPropertyOwner = user && property && user.id === property.user_id;

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (propertyParam) {
      try {
        const propertyData = JSON.parse(decodeURIComponent(propertyParam));
        setProperty(propertyData);
        fetchPropertyImages(propertyData.id);
      } catch (parseError) {
        setError('Invalid property data');
        setLoading(false);
      }
    } else {
      setError('Property is required');
      setLoading(false);
    }
  }, [propertyParam]);

  const checkConnection = async () => {
    try {
      const { session, error } = await getSession();
      
      if (error) {
        setIsConnected(false);
      } else {
        setIsConnected(!!session);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const fetchPropertyImages = async (propertyId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch property images
      try {
        const images = await getPropertyImages(propertyId);
        setPropertyImages(images);
      } catch (imageError) {
        console.warn('Failed to load property images:', imageError);
        // Continue without images
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to load property images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
  };

  const handleContactSeller = () => {
    setShowContactModal(true);
  };

  const handleCloseModal = () => {
    setShowContactModal(false);
    setUserContact('');
    setMessage('');
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email functionality
    handleCloseModal();
  };

  // Auto-rotate images every 7 seconds if there are images
  useEffect(() => {
    if (propertyImages.length === 0) return;
    
    const interval = setInterval(() => {
      setSelectedImage((prevIndex) => (prevIndex + 1) % propertyImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [propertyImages.length]);

  // Loading state
  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading property...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600 mb-2">Error</div>
                  <div className="text-gray-600">{error || 'Property not found'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate financial metrics
  const totalInvestment = (property?.asking_price || 0) + (property?.estimated_closing_costs || 0) + (property?.rehab_cost || 0);
  const totalProfit = (property?.estimated_after_repair_value || 0) - totalInvestment;
  const totalROI = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
  const annualizedROI = property?.rehab_duration_months && property.rehab_duration_months > 0 
    ? (totalROI / property.rehab_duration_months) * 12 
    : 0;
  const profitPerSqft = property?.interior_sqft && property.interior_sqft > 0 
    ? totalProfit / property.interior_sqft 
    : 0;

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Property Title and Fix and Flip Tag Row */}
            <div className="flex justify-between items-start px-4 pt-5 pb-3">
              <h1 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] flex-1">
                {property?.title}
              </h1>
              <div className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#f0f2f5] text-[#111518] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#e4e6e9] transition-colors ml-4">
                <span className="truncate">Fix and Flip</span>
              </div>
            </div>

            {/* Property Description */}
            {property?.description && (
              <p className="text-[#111518] text-base font-normal leading-normal pb-3 pt-1 px-4">
                {property.description}
              </p>
            )}

            {/* Summary */}
            <div className="px-4 py-6">
              <div className="w-full gap-1 overflow-hidden bg-gray-50 rounded-lg p-4 max-w-[864px]">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">Capital Needed</span>
                      <span className="text-red-600 text-sm font-bold">$0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">Total Profit</span>
                      <span className="text-green-600 text-sm font-bold">$0</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">% ROI</span>
                      <span className="text-[#111518] text-sm font-bold">0%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#111518] text-sm font-medium">% Annualized ROI</span>
                      <span className="text-[#111518] text-sm font-bold">0%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Image */}
            {propertyImages.length > 0 && (
              <div className="flex w-full grow bg-white @container py-3 px-4">
                <div className="w-full gap-1 overflow-hidden bg-white @[480px]:gap-2 aspect-[3/2] flex max-w-[864px]">
                  <div
                    className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1 transition-all duration-700 ease-in-out"
                    style={{backgroundImage: `url("${propertyImages[selectedImage]?.image_url}")`}}
                  ></div>
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {propertyImages.length > 0 && (
              <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 mt-6">
                <div className="flex items-stretch gap-3">
                  {propertyImages.map((image, index) => (
                    <div key={image.id} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-36">
                      <div
                        className={`w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedImage === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        }`}
                        style={{backgroundImage: `url("${image.image_url}")`}}
                        onClick={() => handleImageClick(index)}
                      ></div>
                      <p className="text-[#111518] text-base font-medium leading-normal">Image {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property Details */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Property Details</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Address</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">{property?.address}</p>
              </div>
              {property?.bedrooms && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Bedrooms</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.bedrooms}</p>
                </div>
              )}
              {property?.bathrooms && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Bathrooms</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.bathrooms}</p>
                </div>
              )}
              {property?.interior_sqft && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Interior Square Footage</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.interior_sqft.toLocaleString()} sq ft</p>
                </div>
              )}
              {property?.lot_sqft && (
                <div className="pb-2">
                  <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Lot Square Footage</p>
                  <p className="text-[#111518] text-sm font-normal leading-normal">{property.lot_sqft.toLocaleString()} sq ft</p>
                </div>
              )}
            </div>

            {/* Purchasing Costs */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Purchasing Costs</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Purchase Price</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Closing Costs</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Rehab Costs</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Other Costs</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
            </div>

            {/* After Repair Valuation */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">After Repair Valuation</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">After Repair Value</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">After Repair Square Footage</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">ARV Per Square Foot</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Market Variance %</label>
                <input 
                  type="number" 
                  placeholder="0%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
            </div>

            {/* Holding Costs */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Holding Costs</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Property Taxes</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Insurance Costs</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">HOA Fees</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Utilities Costs</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Accounting and Legal Fees</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
              <div className="pb-2">
                <label className="text-[#60768a] text-sm font-normal leading-normal mb-1 block">Other Fees</label>
                <input 
                  type="number" 
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[#111518] text-sm"
                />
              </div>
            </div>

            {/* Calculations */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Calculations</h3>
            <div className="p-4 bg-gray-50 rounded-lg mx-4">
              <div className="space-y-4">
                {/* After Repair Value */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        The projected market price of the property after repair.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">After Repair Value</span>
                  </div>
                  <span className="text-[#111518] text-sm">$0</span>
                </div>

                {/* Selling Costs */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Tax and Agent Commissions
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Selling Costs</span>
                  </div>
                  <span className="text-red-600 text-sm">-$0</span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300 my-3"></div>

                {/* Sale Proceeds */}
                <div className="flex justify-between items-center">
                  <span className="text-[#111518] text-sm font-medium">Sale Proceeds</span>
                  <span className="text-[#111518] text-sm font-bold">$0</span>
                </div>

                {/* Holding Costs */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Property Taxes + Insurance Costs + HOA Fees + Utilities Costs + Accounting and Legal Fees + Other Fees
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Holding Costs</span>
                  </div>
                  <span className="text-red-600 text-sm">-$0</span>
                </div>

                {/* Invested Capital */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Purchase Price + Closing Costs + Rehab Costs + Other Purchasing Costs
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Invested Capital</span>
                  </div>
                  <span className="text-red-600 text-sm">-$0</span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300 my-3"></div>

                {/* Total Profit */}
                <div className="flex justify-between items-center">
                  <span className="text-[#111518] text-sm font-medium">Total Profit</span>
                  <span className="text-green-600 text-sm font-bold">$0</span>
                </div>

                {/* Tax Rate */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 mr-2 cursor-pointer hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Capital Gains Tax Rate
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <span className="text-[#111518] text-sm font-medium">Tax Rate</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="0%"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-[#111518] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-300 my-3"></div>

                {/* Post-Tax Profit */}
                <div className="flex justify-between items-center">
                  <span className="text-[#111518] text-sm font-medium">Post-Tax Profit</span>
                  <span className="text-green-600 text-sm font-bold">$0</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                {(property?.seller_email || property?.seller_phone) && (
                  <button 
                    onClick={handleContactSeller}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#0b80ee] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0a6fd8] transition-colors"
                  >
                    <span className="truncate">Contact Seller</span>
                  </button>
                )}
              </div>
            </div>

            {/* Disclosures */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Disclosures</h3>
            <p className="text-[#111518] text-base font-normal leading-normal pb-3 pt-1 px-4">
              All information provided is deemed reliable but not guaranteed. Buyers are advised to conduct their own due diligence. This property is being sold as-is, where-is,
              with all faults. The seller makes no representations or warranties, express or implied, regarding the condition of the property. This is not an offer to sell
              property. Offers are subject to seller approval. Contact a real estate attorney for legal advice.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (property?.seller_email || property?.seller_phone) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#111518]">Contact Seller</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Seller Contact Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#111518] mb-3">Seller Information</h3>
                <div className="space-y-2">
                  {property?.seller_email && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[#111518]">{property.seller_email}</span>
                    </div>
                  )}
                  {property?.seller_phone && (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-[#111518]">{property.seller_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111518] mb-2">
                    Your Contact Information
                  </label>
                  <input
                    type="text"
                    value={userContact}
                    onChange={(e) => setUserContact(e.target.value)}
                    placeholder="your@email.com or (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111518] mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the seller about your interest in this property..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-[#111518] rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#0b80ee] text-white rounded-lg hover:bg-[#0a6fd8] transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
