"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserProperties } from '../../lib/read_properties';
import { getPropertyImages } from '../../lib/read_property_images';
import { Property, PropertyImage } from '../../types/database';

export default function Dashboard() {
  const [user_properties, setUserProperties] = useState<Property[]>([]);
  const [propertyImages, setPropertyImages] = useState<Record<string, PropertyImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const properties = await getUserProperties();
        setUserProperties(properties);

        // Fetch images for each property
        const imagesMap: Record<string, PropertyImage[]> = {};
        for (const property of properties) {
          try {
            const images = await getPropertyImages(property.id);
            imagesMap[property.id] = images;
          } catch (err) {
            console.error(`Error fetching images for property ${property.id}:`, err);
            imagesMap[property.id] = [];
          }
        }
        setPropertyImages(imagesMap);
      } catch (err) {
        console.error('Error fetching user properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProperties();
  }, []);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex flex-wrap justify-between gap-3 p-4" style={{marginLeft: '-70px'}}>
                <p className="text-[#121416] tracking-light text-[32px] font-bold leading-tight min-w-72">
                  My Listings
                </p>
              </div>
              <div className="px-4 py-3 @container">
                <div className="flex items-center justify-center h-64">
                  <p className="text-[#6a7681] text-lg">Loading your properties...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex flex-wrap justify-between gap-3 p-4" style={{marginLeft: '-70px'}}>
                <p className="text-[#121416] tracking-light text-[32px] font-bold leading-tight min-w-72">
                  My Listings
                </p>
              </div>
              <div className="px-4 py-3 @container">
                <div className="flex items-center justify-center h-64">
                  <p className="text-red-500 text-lg">Error: {error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4" style={{marginLeft: '-70px'}}>
              <p className="text-[#121416] tracking-light text-[32px] font-bold leading-tight min-w-72">
                My Listings
              </p>
            </div>
            <div className="px-4 py-3 @container">
              <div className="flex overflow-hidden rounded-xl border border-[#dde1e3] bg-white" style={{width: 'calc(100% + 100px)', marginLeft: '-70px', marginRight: '-30px'}}>
                <table className="flex-1">
                  <thead>
                    <tr className="bg-white">
                      <th className="table-188b8896-1743-47e5-8b64-704438784ff3-column-120 px-4 py-3 text-left text-[#121416] w-[470px] text-sm font-medium leading-normal" style={{paddingLeft: 'calc(1rem + 10px)'}}>
                        Address
                      </th>
                      <th className="table-188b8896-1743-47e5-8b64-704438784ff3-column-240 px-4 py-3 text-left text-[#121416] w-[400px] text-sm font-medium leading-normal">
                        Asking Price
                      </th>
                      <th className="table-188b8896-1743-47e5-8b64-704438784ff3-column-480 px-4 py-3 text-left text-[#121416] w-[400px] text-sm font-medium leading-normal">
                        After Repair Value
                      </th>
                      <th className="table-188b8896-1743-47e5-8b64-704438784ff3-column-360 px-4 py-3 text-left text-[#121416] w-[400px] text-sm font-medium leading-normal">
                        Day Added
                      </th>
                      <th className="table-188b8896-1743-47e5-8b64-704438784ff3-column-536 px-4 py-3 text-left text-[#121416] w-14 text-sm font-medium leading-normal" style={{paddingRight: 'calc(1rem + 10px)'}}>
                        Images
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {user_properties.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="h-[72px] px-4 py-2 text-center text-[#6a7681] text-sm">
                          No properties found. <Link href="/create_listing" className="text-blue-600 hover:underline">Create your first listing</Link>
                        </td>
                      </tr>
                    ) : (
                      user_properties.map((property) => (
                        <tr key={property.id} className="border-t border-t-[#dde1e3] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer">
                          <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-120 h-[72px] px-4 py-2 w-[470px] text-[#121416] text-sm font-normal leading-normal" style={{paddingLeft: 'calc(1rem + 10px)'}}>
                            {property.address}
                          </td>
                          <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-240 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                            {formatCurrency(property.asking_price)}
                          </td>
                          <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-480 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                            {formatCurrency(property.estimated_after_repair_value)}
                          </td>
                          <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-360 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                            {formatDate(property.created_at)}
                          </td>
                          <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-536 h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal" style={{paddingRight: 'calc(1rem + 10px)'}}>
                            {propertyImages[property.id] && propertyImages[property.id].length > 0 ? (
                              <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10"
                                style={{
                                  backgroundImage: `url(${propertyImages[property.id][0].image_url})`
                                }}
                              />
                            ) : (
                              <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 bg-gray-200"
                              />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @container(max-width:120px){.table-188b8896-1743-47e5-8b64-704438784ff3-column-120{display: none;}}
        @container(max-width:240px){.table-188b8896-1743-47e5-8b64-704438784ff3-column-240{display: none;}}
        @container(max-width:360px){.table-188b8896-1743-47e5-8b64-704438784ff3-column-360{display: none;}}
        @container(max-width:480px){.table-188b8896-1743-47e5-8b64-704438784ff3-column-480{display: none;}}
        @container(max-width:536px){.table-188b8896-1743-47e5-8b64-704438784ff3-column-536{display: none;}}
      `}</style>
    </div>
  );
} 