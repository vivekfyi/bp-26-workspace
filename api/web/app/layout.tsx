import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scroll Zero',
  description: 'A calmer reading queue for the internet.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body><ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider></body>
    </html>
  );
}
