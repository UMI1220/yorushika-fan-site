// 资源仓库对应的 Cloudflare Pages 免费全球 CDN 域名
const ASSETS_BASE = process.env.NEXT_PUBLIC_CDN_BASE || 'https://yorushika-assets.pages.dev';

export function getFastMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.replace(/^\//, '');

  // 无论新老封面 (covers/1.jpg) 还是音频 (music/xxx.mp3)
  // 全部统一走 Cloudflare Pages 节点直连加速
  return `${ASSETS_BASE}/${cleanPath}`;
}
