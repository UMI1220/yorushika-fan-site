import { YORUSHIKA_DISCOGRAPHY } from '../../lib/discography';
import { getFastMediaUrl } from '../../lib/media';

export const runtime = 'edge';

export default async function handler(req) {
  try {
    // 处理封面路径，统一转化为 Cloudflare Pages / CDN 高速链接
    const formattedAlbums = YORUSHIKA_DISCOGRAPHY.map((album) => ({
      ...album,
      coverUrl: getFastMediaUrl(album.cover || `covers/${album.id}.jpg`),
    }));

    return new Response(JSON.stringify({ success: true, albums: formattedAlbums }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
