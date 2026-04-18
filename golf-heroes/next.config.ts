import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.254.201.172'],
  turbopack: {
    root: __dirname,
  },
}
export default nextConfig
