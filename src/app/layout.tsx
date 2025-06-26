'use client';

import { useState } from 'react';

import { ThirdwebProvider } from 'thirdweb/react';

import Navbar from './components/Navbar';
import './globals.css';
import SessionProvider from './providers/SessionProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ThirdwebProvider>
            {/* Fixed positioned navbar that overlays on content */}
            <div className="fixed top-0 right-0 left-0 z-50">
              <Navbar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />
            </div>
            {/* Main content with top padding to account for navbar */}
            <main>{children}</main>
          </ThirdwebProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
