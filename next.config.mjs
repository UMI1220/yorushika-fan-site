/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 开启静态导出模式
  images: {
    unoptimized: true, // 禁用 Next.js 默认图片优化（Cloudflare 托管必须）
  },
};

export default nextConfig;