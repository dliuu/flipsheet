'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export default function PropertyPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [userContact, setUserContact] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
    } catch (error) {
      setIsConnected(false);
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
    console.log('User contact:', userContact);
    console.log('Message:', message);
    handleCloseModal();
  };

  const propertyImages = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCh5VSCDHfb_4vmYfZTKxOs-Vc5f3PPjWsZp6V3-lko6frB4ybEYfbZEDIiepfDMIUBpWQN3eG4SuJcq6lTCSn1cdwgKx9f8pnQx8ysfY8aYqnHGOHy7ADKcI054noxe9n2RAs1EnamQvRDyta0ZOOZ0VsvRUYaWBQaytUcbRM3SCLg49nFvkXoedts8ODd9jHBYOkSBRoKXRl1nHTFp_BqtWZ_-GzQq2pkGWSxoe_HFcqA-yHn3KOYcC2gxJfaUE1JsoV_O9mDHm7a",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC5d2oOTNeZsgoZVS0yXsJ0GAiSetU2RsnbTxuoOORCdi7k2joz-zVGwXCQUkKDwf9QGiMGNkfaLyBZVee5v9wuUVQBk7T9try16XVAp6SxCtaFUpFtW7VbGQO-vCXFNqxcCqWQqvN-FIyje6KOcD6776Ih5twnzeWPVJzH9bjA9KRiNxAkEFyVPRv1nRabl4P9sExvoY13RwfrV5Q5XmTeH5AVDkc27oEHcuMQFoD5JhwosNZd0LV8b3cXa3aA86Cfc7IYmx5D3-bh",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBCA0ZzHiftSLrS_GXU_fRzNymF0zza4NB-yTPxiRuM74WgpJz9lRjARjX3AYr_N3C3f3uQm6G0xxq3qJ67-OsafA4FFz6kToULpeQ2adzI30E-KmM3FJdXitncV0G4DNpdnMrKNF3tmqw5BT4Y9qbV83TYaOdY5o0zcevFvbE-xHKIPWLyevirNqML1zMDRqc3lAyshDtwqACp0kCoDt-J-Ve5lijhOlgYifKOgeo0gd0AXRnPJq2MfQk1iM7G27kQyEeje8N7xaJ8",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDorhl8mr1qxqgjgnGsS0cDTrYx7diqXFk1OvN4_uNNnGZwIZjahn-EXakdEAH9z4dqE0V5664GE74t5qUyi1kqJJ4r_RiP23sSDg4HEx1o4zdl03-nBmn6RraSELLDT8WwwsExSaFgdHVPBXFiq5nFG30qW2nVlB8I5EwaYgVghvlPj1m9ydyqBBaQi8e0A0WDEMQWIzjP0ZN2IYrZWallsOvroZ5E44u_UzQr1janyi-cYcVo_7hocP3JMpj4m1BROcokn5J21atN",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDLjHXFEhfvUyk8XGwwT5vXDg8S-n-nhnY-fYuwkMoFnAvtCkwzTL1U0zMiZvKfQlYai0qPwJB0VLVaVcPvBhRGFKEnDCF5nmUrc3d_pQMHI1qykl3dZZqg7oRxoKGRW-ciPbKbE6I7Yp8fZLQ3bbZeg9cME6x_KfoiSlWcLvxn-aDYiePhjXc_V-llMn6lg9O3FNTwuTQsAaG1Ud7pQMcpIKdG6aPMn5Sj_0ChPiDsWsY7PvtMYLCsWo7dGKWZmCQnRCl_NFC8-umB",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCMWdRAuvl6EWRleAbCVb3qVJFDNrPqugPRveTXXv792UQtii9o5WH11pAZjOjG4U6sz45OpA0PSCopI559StRHX95ZC_d83y37X-xwclgY4zKqJ2iKitneam5hw00O_gYRvxsxgcyg7qvuDT8HmckO5JRYT9MJ1pY3_L2gFwX-D8JWKsY7lqukzXgUFBfiqKgEps32hhmoZJB24oWA0YmD_c6BlEvQ6vVvTPtO6GMZQGb0-lWSf5bIghofFQOLu9p54an9VqQfyzyy",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBhXiQeneEynFIiL4_IXCaeNOLHEMjxsWfB7_Yb5a4bPgLdntu8D3vTvps34gZo3L0mHK5zYBtQzBgchfj3QBJ5aI6FTXIlsk4YBo3XyMb6guh9b4igQntbsr4jjWhDGiHs1ry6RDlC-8GWl__gAorvwlk-0ZBoRrPtH4DgOAIZSIAqCnxEaVUDJDAoa6F4pXK2bXsidvD5PbrNokGSQMirJ8cIxTEmZimzEnIPtVrfMBg-j89QGP-UhkxSSJJP1RYMKci4g7bUOAZM",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB6TIcYv_h77ycq4IpnkMgxTlh4ObO1oTm1tL8w7Hx1G37KlfEtfIttAeVONUBRQaQB_nSW03rxWt69g_0yp9Bualz2mIP2_OnYSVnzFm4Y3RiMM_VAGN4M9_ciUziUIijlFLjpdBHB9XHq4HTvxd28cYHU_lgSLPnZ6u8j46n6RVkLg68XIA8p7isFwLSgN_8o4PjZ09jPPOOFwzKBS9dCdsnZhaWDd-H8GZJ9tk-fCS7puswNyvqp2_VvJ6_ZiNVuGqXVWtl9PsxE",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB12jGlP_4hmPlJ5Sa_u1z4uGmd-HSshjw4SiXqImBIbXbdU97f_IpsDkU4mA-klwDHaODAe4HrnVOAGoWMYonc34SWfu9eP0FSsLgjLeEQUihL6rAZw4wzcLxTBkORQCdlaZ-ScezNLYkH5C_elYM1-PfYIWkSHKIHsXApasELGxOaUoaPbiA1IScGsY0qRu0oyn73TBGzdcXs22I2mu2UTjGO7Tyo9sx9ZrBHeBQ3lTU7-Nng13RiiHGd4boAD6JJ9L41hxzr64N6",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDR-8ztxAoXa5yuFVI8_ow26COG3JbxoIsToJVUK7SyaHV54SduVjG0awpczZ-rSLA10EGjv3hQod2UmKiVbWkk3Nr-mrdPQraT9EcZcQ_dO-12JXFIcu6bVNyXItxHtN49JP9awsPujMun7vcIY2bEdfF6qQs9DEG5IXa9_8UynZzjsAc4pmkVnRBPlblG9KaewxnwE45rg0h1XLWxw32_q5NslDd1Iet-JSJS2yPGHhPUYLZl0yzVUQpBAV6wfvDIPXHVPcmh6r1H",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCi5GqZ2-uTKShZcm_pi82svPY9p56q_5k9fKYyWw7ehKi5V78qDyNbY7kdEGTdLdYwgdoXbROmyqfpJK7IZmFWQi7JINvLCcEWG0EYuKUrwGlDDpbldaU5z0KEImxDBXNhyzqrHWbJZSdx7RRvWJxVOUzVeah66fbwP2JZrVzLWEkM7HojCq8TCFVFvhyQqq7dvPQe2ZZxudrjZZ0F1ugIVIQVpdpGneAbY5tnB7KWNdWTIIOCGkWk6HQO_32PhHd9mMbcJEUye7wq",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBzlHAooXnyyjTYWaTYVm_6O-PFY2viRzi8RC4A2b004uHVxk_000MpJ_XTQ9E_QOUIqfgKmqiAz5bhtomZpN_C14gBc2FTaSuTiBsvFzlrFcR9gmcXwiLqpHML2y2Cg5zfh4BfvJlBsbwarzODwxz5-VrqUCfFPN4dGBwrvMrkb-4RhevcQn3lqke3xGb1f1oXRZVMlfMKWIfbZHCzMIJcWqX7X96IaX7NIigtHtSqS487PZIUCrtUvEhklCxHxT2z0kFIUTc9W-_n",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAx8MDSUJw-1n6WkFqo8zaCis7fAwQI7Aa3X9L6Dq6fuDkUvGBxdAYFzFV9ly8p1lI6AVbVnNY7vqWDHsx-xsEDpu1XT2bTnxqOOGiAJYcAJR_ZNwfXaCZ2sGbptNocxfn2DVlCxpmPbW9w55wnuAQzUh0AH5Ci1z-lCVzZvWm5D8qboWuZFLcVUdU7EX4rqWFQokZUmmsjIeWqRkQrDBBh4g7NwsGicx9piIk6Voj0i7H8SBA6ar-tAru5VRlwUQdZODfHgnfBgh14",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBJGgPCMYPlUZn_Tu0UjEL0vLY4zhPJBHJMYGCqAB9x3Y1M6dSvIf8Tl_k3zUV6tdQQ1g7l2kVCJZCAkSBlHWBsLyeJCBE14m3s7IVAcq5u_2Uh7GriFfSssNA3FShdcYyHjh69iz7D9jt5bcBFckRHhGwTL8D56GBCHpUG0cTjHH-4DY3IFsx_K6fqecSMWtAz9f271rtEvQvfhSgDju3x4mljhrRI0mgjhLMD_QEc08rL5jCypqvo-6R6Tc_9BVFAEVy31hHwGX8k",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAFmvBABkK9aHpikVXbj0t6FCa5EjpJ0OH8G3Rp8JLyvBZL7yDvavjPQW2MSzcOk8UV6AZiuLYWD3YwQVjymheMIrVBSiz235gH3ffPawPEsMMY7zSTq8VxyubwQGc32cuKTZqUz9F5kj8VTaJojbuO099BLBo9Jo_4tSHRviMIYz-8fAI99oCaD4PE79JUjs3Y9fWqyh8yDslk9OaVsCN_24WzI21ckxcMJ0POFmU0cNTpx8MtlFa5i-wseKliDPKZE91Wd4pKOGu0"
  ];

  // Auto-rotate images every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedImage((prevIndex) => (prevIndex + 1) % propertyImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [propertyImages.length]);

  const mainImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCF9J9NlUJ2yFzF_WxdWs9_cRZwyEGofymoUrl6Rq7TnyXBh6SSvNMdwpFO2l2ZZSs10DT9sP1NeQwPWkMgluVlfogKbQTrkSgOFBczXbXlTjlQl46fsOmcl0iAMwy_JZx9ZgJ36FA-nq0TBUXroEY8ghrVFEWdUGHdIIm3j8uQCNDPL12x4dbXr2G5qGamt6HW5vh3vpUi2oX9yWjKUcQiacYhp7ZN-L7I-uiqOS9UEW41oKO1wxfSEk7DMRw2ODWxS9fyfERy27-4";

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Inter, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Image Gallery */}
                         <div className="flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
               <div className="flex items-stretch p-4 gap-3">
                 {propertyImages.map((image, index) => (
                   <div key={index} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                     <div
                       className={`w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex flex-col cursor-pointer transition-all duration-200 hover:scale-105 ${
                         selectedImage === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                       }`}
                       style={{backgroundImage: `url("${image}")`}}
                       onClick={() => handleImageClick(index)}
                     ></div>
                     <p className="text-[#111518] text-base font-medium leading-normal">Image {index + 1}</p>
                   </div>
                 ))}
               </div>
             </div>

                         {/* Main Image */}
             <div className="flex w-full grow bg-white @container py-3">
               <div className="w-full gap-1 overflow-hidden bg-white @[480px]:gap-2 aspect-[3/2] flex">
                 <div
                   className="w-full bg-center bg-no-repeat bg-cover aspect-auto rounded-none flex-1 transition-all duration-700 ease-in-out"
                   style={{backgroundImage: `url("${propertyImages[selectedImage]}")`}}
                 ></div>
               </div>
             </div>

            {/* Property Title */}
            <h1 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left pb-3 pt-5">
              Off-Market Property in Prime Location
            </h1>

            {/* Property Description */}
            <p className="text-[#111518] text-base font-normal leading-normal pb-3 pt-1 px-4">
              This off-market property presents a unique opportunity for investors. Located in a highly desirable neighborhood, it offers significant potential for renovation and
              resale. The property features a spacious layout, a large backyard, and is close to schools and amenities.
            </p>

                        {/* Property Details */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Property Details</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Address</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">123 Main Street, Anytown, CA 90210</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Type of Home</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">Single Family</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Bedrooms</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">3</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Bathrooms</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">2.5</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Interior Square Footage</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">2,150 sq ft</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Lot Square Footage</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">8,500 sq ft</p>
              </div>
            </div>


            {/* Key Metrics */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Key Metrics</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Asking Price</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">$250,000</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Est Closing Costs</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">$10,000</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Est After Repair Value</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">$400,000</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Est As-Is Value</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">$275,000</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Rehab Cost</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">$50,000</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Rehab Duration</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">2 months</p>
              </div>
            </div>

            {/* Calculated Metrics */}
            <h3 className="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Calculated Metrics</h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Total Profit</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">$90,000</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Total Return on Investment (ROI)</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">34.62%</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Annualized Return on Investment</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">207.69%</p>
              </div>
              <div className="pb-2">
                <p className="text-[#60768a] text-sm font-normal leading-normal mb-1">Profit per Square Foot</p>
                <p className="text-[#111518] text-sm font-normal leading-normal">$41.86</p>
              </div>
            </div>

                         {/* Action Buttons */}
             <div className="flex justify-stretch">
               <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
                 <button 
                   onClick={handleContactSeller}
                   className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#0b80ee] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0a6fd8] transition-colors"
                 >
                   <span className="truncate">Contact Seller</span>
                 </button>
                 <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#f0f2f5] text-[#111518] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#e4e6e9] transition-colors">
                   <span className="truncate">Download Report</span>
                 </button>
                 <button 
                   onClick={() => window.location.href = '/create_listing'}
                   className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#28a745] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#218838] transition-colors"
                 >
                   <span className="truncate">List Property</span>
                 </button>
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
       {showContactModal && (
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
                   <div className="flex items-center">
                     <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                     <span className="text-[#111518]">seller@example.com</span>
                   </div>
                   <div className="flex items-center">
                     <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                     </svg>
                     <span className="text-[#111518]">(555) 123-4567</span>
                   </div>
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
