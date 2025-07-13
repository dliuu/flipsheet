import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import SupabaseStatus from "@/components/SupabaseStatus";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FlipSheet - Real Estate Property Display",
  description: "Professional real estate property display for wholesalers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <AuthProvider>
          <Header />
          {children}
          <SupabaseStatus />
        </AuthProvider>
      </body>
    </html>
  );
}
