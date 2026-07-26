/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 开启尾部斜杠，强制 Next.js 导出 /magazine/index.html 而不是 /magazine.html
  // 这能完美解决 Cloudflare Pages 找不到二级页面路由抛出 404 的问题
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;