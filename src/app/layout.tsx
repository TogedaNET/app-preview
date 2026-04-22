import "~/styles/globals.css";

import { Suspense } from "react";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "./components/AuthContext";
import GoogleProvider from "./components/GoogleProvider";
import UserBadge from "./components/UserBadge";

export const metadata: Metadata = {
  title: "Togeda App Preview",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body suppressHydrationWarning>
        <GoogleProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <UserBadge />
            </Suspense>
            {children}
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
