// 优先使用你的 Cloudflare Pages 域名（也可以随时切回 JSDelivr）
const ASSETS_BASE = process.env.NEXT_PUBLIC_CDN_BASE || 'https://yorushika-assets.pages.dev';

export function getFastMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.replace(/^\//, '');
  
  // 如果是本地 public/covers 下已有的图片，直接走本地路径
  if (cleanPath.startsWith('covers/') && parseInt(cleanPath.split('/')[1]) <= 43) {
    return `/${cleanPath}`;
  }

  // 新上传资源统一走 Cloudflare Pages / JSDelivr 加速
  return `${ASSETS_BASE}/${cleanPath}`;
}
