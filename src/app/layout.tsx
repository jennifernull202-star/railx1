import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { GoogleMapsProvider } from "@/components/providers/GoogleMapsProvider";
import AIChatWidget from "@/components/AIChatWidget";

export const metadata: Metadata = {
  title: "The Rail Exchange™ | Premium Rail Industry Marketplace",
  description:
    "The Rail Exchange™ is the premier marketplace for rail industry equipment, materials, services, and contractors. Buy, sell, and connect with verified professionals.",
  keywords: [
    "rail industry",
    "railroad equipment",
    "rail contractors",
    "rail marketplace",
    "railroad materials",
    "rail services",
  ],
  authors: [{ name: "The Rail Exchange" }],
  metadataBase: new URL("https://www.therailexchange.com"),
  openGraph: {
    title: "The Rail Exchange™ | Premium Rail Industry Marketplace",
    description:
      "The premier marketplace for rail industry equipment, materials, services, and contractors.",
    type: "website",
    locale: "en_US",
    siteName: "The Rail Exchange",
    images: [
      {
        url: "/railxphoto.png",
        width: 1200,
        height: 630,
        alt: "The Rail Exchange - Rail Industry Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Rail Exchange™",
    description:
      "The premier marketplace for rail industry equipment, materials, services, and contractors.",
    images: ["/railxphoto.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased bg-surface-primary text-text-primary min-h-screen">
        <AuthProvider>
          <GoogleMapsProvider>
            {/* Main Application */}
            <div className="flex flex-col min-h-screen">
              {children}
            </div>
            {/* AI Chat Widget - Available Site-Wide */}
            <AIChatWidget />
          </GoogleMapsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
