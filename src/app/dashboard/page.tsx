"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserProperties } from '../../lib/read_properties';
import { Property } from '../../types/database';

export default function Dashboard() {
  const [user_properties, setUserProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const properties = await getUserProperties();
        setUserProperties(properties);
      } catch (err) {
        console.error('Error fetching user properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProperties();
  }, []);

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
                    <tr className="border-t border-t-[#dde1e3] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer">
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-120 h-[72px] px-4 py-2 w-[470px] text-[#121416] text-sm font-normal leading-normal" style={{paddingLeft: 'calc(1rem + 10px)'}}>
                        123 Elm Street, Anytown, CA
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-240 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $500,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-480 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $600,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-360 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        2023-08-15
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-536 h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal" style={{paddingRight: 'calc(1rem + 10px)'}}>
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10"
                          style={{
                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKKFEWlJmCA4HDzg9PTJQC2o6BWYjuIiMG6CvNJQhUhibiHo2T-rbWGzuEyd11BGY31W1FYSxbd5I8EK-OjfXAQnyUJjV-WZlDUuT06WrlYipUEjIDqUPxwtTfDA0_PC-uH8jwb6sxQ2JuJqMwLnhYSWgFvCLFyNy8HJZ0LveGam3een63h90kPmEoXv3FEHlkx3d5OJs8Xpo0oCDWrfPh5A1LG_EK_hWmGf5Sr9kaNxLdm6HljJwP5Fo5RAEQmxQrnehBp5DLP9XM")'
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="border-t border-t-[#dde1e3] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer">
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-120 h-[72px] px-4 py-2 w-[470px] text-[#121416] text-sm font-normal leading-normal" style={{paddingLeft: 'calc(1rem + 10px)'}}>
                        456 Oak Avenue, Anytown, CA
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-240 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $750,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-480 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $900,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-360 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        2023-09-20
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-536 h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal" style={{paddingRight: 'calc(1rem + 10px)'}}>
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10"
                          style={{
                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBp7BMbgqab4zPNIWTMoEfsefmJ3Dvi-SUBy9L9qLCLpK9XrOXDlLH1yBN29HfPk0KGmyIrv71NGuPDi224xFLHJ0uGNbc9WQv0kVTOv-M8BNIlRUWKpeT4AbuOw4M6xm9YOtI7bUwftS6M5TKlmwX85ow_FgidljBcOyQ-dk6cB5YcD5oR50i7_oZIu5TiyzJrWgBptRjyggGDZj9sfnQj9eq2anxHm6Z8nJqx5KeNMp1RdfzlO6d8uLVhdhUCq0Pe3t2xy9tSgFga")'
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="border-t border-t-[#dde1e3] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer">
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-120 h-[72px] px-4 py-2 w-[470px] text-[#121416] text-sm font-normal leading-normal" style={{paddingLeft: 'calc(1rem + 10px)'}}>
                        789 Pine Lane, Anytown, CA
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-240 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $600,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-480 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $700,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-360 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        2023-10-05
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-536 h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal" style={{paddingRight: 'calc(1rem + 10px)'}}>
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10"
                          style={{
                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBFzRo9J8c-q6FOtD-sscW9RLUdmz5cMzvAnXXHvHPQVX5yz0Gt0ecjKg_LTZtaR4fEfp2vpAF2W7MMvDIHIU0kXUwqh4z4DZ6M9ZetSQ8d0V9rP9PLL5_Pw3FejE9xpQoeUfu14HmyewkHaaz5MAXFtjKWjbfjkAK7KNjBOYvhf59H2P2RIrOeO55Luzqr2vFH6-GjMeyqV7srOn8qfuCtIrtPJnOZvHgeRTfNSWO5j_1466-Fj4EfxSZtWm0y7Gna-hHdn27dJ_P4")'
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="border-t border-t-[#dde1e3] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer">
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-120 h-[72px] px-4 py-2 w-[470px] text-[#121416] text-sm font-normal leading-normal" style={{paddingLeft: 'calc(1rem + 10px)'}}>
                        101 Maple Drive, Anytown, CA
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-240 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $400,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-480 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $500,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-360 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        2023-11-12
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-536 h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal" style={{paddingRight: 'calc(1rem + 10px)'}}>
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10"
                          style={{
                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuChemRawzS85F24gcuSAfcItYCfhOgo5hP6cOjisHaznrNc2qkilT83NZxrIekgen_GyknqUkykUc6c7p-ZXaiN12tVASg73FPIl1HePsgDURbjeQvHmbK_SwrF7Fc4AdcthRR-lOwnNzV_QTr2-e-jSVKD98Gwt0T-RNBt3HWopM2WQYf_hHCJJ5ttXtsfy5ddcamJzUeQqM5-1ZdYqfyWN4zIw9K8aKC8GUE6lV5DXWAjlPNRUU1pM15X30xbMZyEH7qmbU0RdQuh")'
                          }}
                        />
                      </td>
                    </tr>
                    <tr className="border-t border-t-[#dde1e3] hover:bg-[#f8f9fa] transition-colors duration-200 cursor-pointer">
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-120 h-[72px] px-4 py-2 w-[470px] text-[#121416] text-sm font-normal leading-normal" style={{paddingLeft: 'calc(1rem + 10px)'}}>
                        222 Cedar Court, Anytown, CA
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-240 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $900,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-480 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        $1,100,000
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-360 h-[72px] px-4 py-2 w-[400px] text-[#6a7681] text-sm font-normal leading-normal">
                        2023-12-01
                      </td>
                      <td className="table-188b8896-1743-47e5-8b64-704438784ff3-column-536 h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal" style={{paddingRight: 'calc(1rem + 10px)'}}>
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10"
                          style={{
                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAKBkwTATRbPrI7yGBGjuVjYW7Jc1lrX9EdzxiDoVEIy_fwZWXCVIOHoK7bWm-TSCjXkfCBLCJ7510zIbdfWhOhbzi4lkUrv1NDBs8S41ENaH84Doj0Q2TmEnO8GPvW6AIRWP87DJWUCQ6X47IXyGyOALo3-TbNR_rMOzSiLUR2oXBM5rZK2gpkypR_8hP9ehhQixClj6svseo-Sf55EJ80HU5olJph5t2xoNCwZ9eKdyfLmDd5dHjjkyRgzirNjy9-hvsLglZlle8o")'
                          }}
                        />
                      </td>
                    </tr>
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