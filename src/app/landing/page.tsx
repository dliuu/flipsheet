import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="@container">
              <div className="@[480px]:p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center p-4"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuC2PGJVTC9uET2qetU-j0J-zcGhhSx8FpP1XSGGAfUAkm4KHZEOLpDMqT4GqWfZ5JXWeRVfAYlD-D-14nr46EdOvLz0H3-Pe3qCmjiob466MlCDdij2u0-Q9FWh8prXGr-uWsGxstnwbqbKwMNbEnC-zTqKlcnWpuEH8tPlikMMqhCRS3skf1iwLVdOnsIBldpV7Wfg1ygtYHl2uUZr5RtEzv3bvUnhtFa0jMqNOCagSctpAcyJ7yTohFfVgwzCFc3LXE66hyvH-tzM")'
                  }}
                >
                  <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] text-center">
                    Create Stunning Listings in Minutes
                  </h1>
                  <Link href="/create_listing">
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-[#b2cae5] text-[#101418] text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em]">
                      <span className="truncate">Get Started</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-10 px-4 py-10 @container">
              <div className="flex flex-col gap-4">
                <h1 className="text-[#101418] tracking-light text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] max-w-[720px]">
                  Why Choose Listify?
                </h1>
                <p className="text-[#101418] text-base font-normal leading-normal max-w-[720px]">
                  Listify offers a streamlined approach to creating and managing your listings, ensuring they stand out and attract the right audience.
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3">
                <Link href="/property_page" className="flex flex-col gap-3 pb-3 hover:opacity-80 transition-opacity">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD5r1qmYPuV3JzVcxK8iB9mKgZUHruOA3RKQCnMz6HYusWsGh5tehwsfGEH80gvkMBy0ZvHHQhASfQh9DpJ9Gt6jD9PoJhdoacPb_7gwyRiQArOajeZdS5LGa8AQJvBSjiphrOxfUhZ1po9s5P3OUfdWPXg5LYu1R-rqiVY3rQhTGACHp-_0syhNl3uciYCPtToT-95gjG1sWw2O50efvyfZv1qDCt5wVorlGmubLh0NyU7uK7Alzw7WWrDUxj94xoV-ZxwypsHYAwW")'
                    }}
                  ></div>
                  <div>
                    <p className="text-[#101418] text-base font-medium leading-normal">Easy Listing Creation</p>
                    <p className="text-[#5c718a] text-sm font-normal leading-normal">
                      Our intuitive interface allows you to create professional-looking listings in minutes, even without prior experience.
                    </p>
                  </div>
                </Link>
                <div className="flex flex-col gap-3 pb-3">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCNFfyUIVD_guB6iRsiwTGKlZIv0l2x1LWxP_znRLwLDNRNoiuohWv4T5xiTW0Op4MvcPsEu-YD9sWlIh7DkCGJ_qbt87c-nZ6_SvVQXVGhzwB22xzpRkm2m915mXyixBo_UI9tGrry91mFAaNXVyrHl07Z2B56rXL1rHv91UnYg_c9hgWMCdGjil9B16esZ2FdeVPk_R_p-oQAdK09ReCVAJ3DBwtBN1fecqqJ-4DPa3NbX3uyMFcKL11jZ9JXCIZKFbZbQCw4fTL3")'
                    }}
                  ></div>
                  <div>
                    <p className="text-[#101418] text-base font-medium leading-normal">Enhanced Visibility</p>
                    <p className="text-[#5c718a] text-sm font-normal leading-normal">
                      Listify's platform optimizes your listings for search engines, increasing their visibility and reach to potential customers.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pb-3">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDTP2ikr5aDakHFnN4bM_RSP-ebcTGdmRZzy3qoY3dl_9I6v9FOMvGiqoHvcm8TgKhlSI0PGaZAKr3KNMT4szJeLXNe-ZozPZunDexBaCSI7S0KLzdcd5uJ1dnYkc6ySKkFjVqLKFOZpxFkYIQrpJfxVRF2extADc8no6lNWH0k_7TSnXBRuDUQ0oENcsImK6A2k07vIqUcwZ2fMOSNKhQeF_mKaKFiM7DDZsuIxAAlo9vxe7Fz0QV4iOZ4qOTfLEVXoDi7as3kddtm")'
                    }}
                  ></div>
                  <div>
                    <p className="text-[#101418] text-base font-medium leading-normal">Connect with Your Audience</p>
                    <p className="text-[#5c718a] text-sm font-normal leading-normal">
                      Engage directly with your audience through integrated communication tools, fostering stronger relationships and driving conversions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className="flex justify-center">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="flex flex-col gap-6 px-5 py-10 text-center @container">
              <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
                <a className="text-[#5c718a] text-base font-normal leading-normal min-w-40" href="#">About</a>
                <a className="text-[#5c718a] text-base font-normal leading-normal min-w-40" href="#">Contact</a>
                <a className="text-[#5c718a] text-base font-normal leading-normal min-w-40" href="#">Terms of Service</a>
                <a className="text-[#5c718a] text-base font-normal leading-normal min-w-40" href="#">Privacy Policy</a>
              </div>
              <p className="text-[#5c718a] text-base font-normal leading-normal">@2024 Listify. All rights reserved.</p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
} 