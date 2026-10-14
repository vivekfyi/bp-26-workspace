import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scroll Zero',
  description: 'A calmer reading queue for the internet.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
