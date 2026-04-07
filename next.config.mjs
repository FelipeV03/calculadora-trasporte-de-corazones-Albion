/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "render.albiononline.com",
        pathname: "/v1/item/**",
      },
      {
        protocol: "https",
        hostname: "render.albiononline.com",
        pathname: "/v1/spell/**",
      },
    ],
  },
}

export default nextConfig
