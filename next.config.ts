import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Server Actions are stable in Next.js 15 — no flag needed
  },
}

export default nextConfig
