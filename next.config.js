/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // 匹配所有 /supabase-storage/ 开头的请求（覆盖 magazines, forum, gallery, music 等所有桶）
        source: '/supabase-storage/:path*',
        // 隐式代理转发到你的 Supabase 真实存储地址
        destination: 'https://xcfcheyikzfpfldugatb.supabase.co/storage/v1/object/public/:path*',
      },
    ];
  },
};

module.exports = nextConfig;