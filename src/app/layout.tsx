import { Geist, Geist_Mono } from 'next/font/google';
import { ThirdwebProvider } from 'thirdweb/react';
import SessionProvider from './providers/SessionProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ThirdwebProvider>
            {children}
          </ThirdwebProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
