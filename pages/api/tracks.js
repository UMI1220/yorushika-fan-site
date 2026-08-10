export const runtime = 'edge';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const album_id = searchParams.get('album_id');

  const db = process.env.DB;

  try {
    if (req.method === 'GET') {
      // 1. 获取指定歌曲详情
      if (id) {
        const track = await db
          .prepare('SELECT * FROM tracks WHERE id = ?')
          .bind(id)
          .first();

        if (!track) {
          return new Response(
            JSON.stringify({ success: false, message: '歌曲不存在' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // 规范：若歌曲封面为空，自动拉取对应专辑封面
        if (!track.cover_url && track.album_id) {
          const album = await db
            .prepare('SELECT cover_url FROM albums WHERE id = ?')
            .bind(track.album_id)
            .first();
          if (album) track.cover_url = album.cover_url;
        }

        return new Response(
          JSON.stringify({ success: true, data: track }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 2. 按专辑 ID 批量拉取歌曲
      if (album_id) {
        const { results } = await db
          .prepare('SELECT * FROM tracks WHERE album_id = ? ORDER BY id ASC')
          .bind(album_id)
          .all();

        return new Response(
          JSON.stringify({ success: true, data: results || [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, message: '请提供歌曲 id 或 album_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
