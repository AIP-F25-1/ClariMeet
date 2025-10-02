/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/appspecific/com.chrome.devtools.json',
        destination: '/.well-known/appspecific/com.chrome.devtools.json',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/.well-known/appspecific/com.chrome.devtools.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://va.vercel-scripts.com https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://va.vercel-scripts.com https://prod.spline.design",
              "frame-src 'self' https://accounts.google.com https://my.spline.design",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ]
  },
}

export default nextConfig
