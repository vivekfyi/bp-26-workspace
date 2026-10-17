import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

// The custom server runs Next with `web/` as its app directory while the
// repository keeps environment files at the API root.
loadEnvConfig(new URL('..', import.meta.url).pathname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
