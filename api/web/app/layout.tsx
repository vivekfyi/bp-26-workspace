import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { AuthControls } from '../components/auth-controls';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scroll Zero',
  description: 'A calmer reading queue for the internet.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const { userId } = await auth();

  return (
    <html lang="en">
      <body><ClerkProvider publishableKey={publishableKey}><header className="site-header"><a className="brand" href="/"><span className="brand-mark">SZ</span><span>Scroll Zero</span></a><AuthControls initialSignedIn={Boolean(userId)} /></header>{children}</ClerkProvider></body>
    </html>
  );
}
