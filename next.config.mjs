/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true, // 确保静态路由解析正常
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
