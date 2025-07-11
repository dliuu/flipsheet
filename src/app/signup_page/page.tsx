"use client";

import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/property_page");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-neutral-50 group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[512px] py-5 flex-1 bg-white rounded-2xl shadow-md border border-[#ececec]">
            <h2 className="text-[#141414] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
              Create your account
            </h2>
            {error && (
              <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mx-4 mb-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                Account created! Redirecting...
              </div>
            )}
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3 w-full mx-auto">
                <label className="flex flex-col min-w-40 flex-1 w-full">
                  <p className="text-[#141414] text-base font-medium leading-normal pb-2">Full name</p>
                  <input
                    name="fullName"
                    type="text"
                    placeholder="Ethan Carter"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#141414] focus:outline-0 focus:ring-0 border border-[#dbdbdb] bg-neutral-50 focus:border-[#dbdbdb] h-14 placeholder:text-neutral-500 p-[15px] text-base font-normal leading-normal"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    autoComplete="name"
                    required
                  />
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3 w-full mx-auto">
                <label className="flex flex-col min-w-40 flex-1 w-full">
                  <p className="text-[#141414] text-base font-medium leading-normal pb-2">Email</p>
                  <input
                    name="email"
                    type="email"
                    placeholder="ethan.carter@example.com"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#141414] focus:outline-0 focus:ring-0 border border-[#dbdbdb] bg-neutral-50 focus:border-[#dbdbdb] h-14 placeholder:text-neutral-500 p-[15px] text-base font-normal leading-normal"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    required
                  />
                </label>
              </div>
              <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3 w-full mx-auto">
                <label className="flex flex-col min-w-40 flex-1 w-full">
                  <p className="text-[#141414] text-base font-medium leading-normal pb-2">Password</p>
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#141414] focus:outline-0 focus:ring-0 border border-[#dbdbdb] bg-neutral-50 focus:border-[#dbdbdb] h-14 placeholder:text-neutral-500 p-[15px] text-base font-normal leading-normal"
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>
              <div className="flex px-4 py-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-4 flex-1 bg-black text-neutral-50 text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">{loading ? "Signing up..." : "Sign up"}</span>
                </button>
              </div>
            </form>
            <p className="text-neutral-500 text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
              By signing up, you agree to our <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>
            </p>
            <p className="text-neutral-500 text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline cursor-pointer" onClick={() => router.push("/login")}>Already have an account? Log in</p>
          </div>
        </div>
      </div>
    </div>
  );
} 