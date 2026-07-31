// 统一 Supabase CDN 代理路径转换工具
const SUPABASE_RAW_DOMAIN = 'https://xcfcheyikzfpfldugatb.supabase.co/storage/v1/object/public/';

export function toCDNUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // 防重复处理
  if (url.includes('/supabase-storage/')) return url;

  // 处理论坛那么多图逗号分隔的格式
  if (url.includes(',')) {
    return url
      .split(',')
      .map((item) => item.trim().replace(SUPABASE_RAW_DOMAIN, '/supabase-storage/'))
      .join(',');
  }

  // 单图或单文件替换
  return url.replace(SUPABASE_RAW_DOMAIN, '/supabase-storage/');
}