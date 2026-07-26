/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 开启静态导出（如果使用的是纯静态 Pages 部署）
  output: 'export',
  // 开启尾部斜杠自动兼容，防止 Cloudflare Pages 报 404
  trailingSlash: true,
  images: {
    unoptimized: true, // 静态导出下需禁用默认图片优化
  },
};

module.exports = nextConfig;