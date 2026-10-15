/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'librorank-next.vercel.app' }],
        destination: 'https://libroranking.com/:path*',
        permanent: true,
      },
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
      dns: false,
    }
    return config
  },
}

export default nextConfig
