import { getDB } from '../../lib/d1';

export const runtime = 'edge';

export default async function handler(req) {
  try {
    const db = getDB();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
      // 查询单个专辑详情及包含的所有曲目
      const album = await db.prepare('SELECT * FROM albums WHERE id = ?').bind(id).first();
      if (!album) {
        return new Response(JSON.stringify({ error: 'Album not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tracks = await db
        .prepare('SELECT id, track_number, title_jp, title_cn, audio_url, mv_url, contributor FROM tracks WHERE album_id = ? ORDER BY track_number ASC')
        .bind(id)
        .all();

      return new Response(
        JSON.stringify({
          ...album,
          tracks: tracks.results || [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取所有专辑列表
    const { results } = await db.prepare('SELECT * FROM albums ORDER BY release_date DESC').all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
