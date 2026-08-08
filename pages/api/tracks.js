import { getDB } from '../../lib/d1';

export const runtime = 'edge';

export default async function handler(req) {
  try {
    const db = getDB();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing track id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 查询曲目详细元数据与歌词
    const track = await db
      .prepare(
        `SELECT t.*, a.title_jp as album_title_jp, a.title_cn as album_title_cn, a.cover_url 
         FROM tracks t 
         LEFT JOIN albums a ON t.album_id = a.id 
         WHERE t.id = ?`
      )
      .bind(id)
      .first();

    if (!track) {
      return new Response(JSON.stringify({ error: 'Track not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(track), {
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
