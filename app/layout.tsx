import { DashboardDock } from "@/components/ui/dashboard-dock";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClariMeet - Video Transcript Player",
  description: "Experience seamless video playback with synchronized transcripts, live captions, and intelligent navigation.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          {children}
          <DashboardDock />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
