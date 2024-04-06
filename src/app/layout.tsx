"use client"

import DeviceDetector from "./_components/common/DeviceDetector";
import Menu from "@/app/_components/Menu";
import "./globals.css";
import ReduxProvider from "@/context/Provider";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>     
        <ReduxProvider>
          <DeviceDetector />
            <div className="flex h-full">
              <Menu />
              {children}
            </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
