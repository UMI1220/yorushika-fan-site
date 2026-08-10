export const runtime = 'edge';

export default async function handler(req) {
  const db = process.env.DB;

  try {
    // 1. 获取 pending_tracks 审核队列
    if (req.method === 'GET') {
      const { results } = await db
        .prepare('SELECT * FROM pending_tracks ORDER BY id DESC')
        .all();

      return new Response(
        JSON.stringify({ success: true, data: results || [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 审核通过 (APPROVE)
    if (req.method === 'POST') {
      const body = await req.json();
      const { pending_id, target_track_id, is_track_list = false } = body;

      const pending = await db
        .prepare('SELECT * FROM pending_tracks WHERE id = ?')
        .bind(pending_id)
        .first();

      if (!pending) {
        return new Response(
          JSON.stringify({ success: false, message: '暂存记录不存在' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 如果为歌曲列表追加
      if (is_track_list && pending.album_id) {
        const album = await db
          .prepare('SELECT track_list FROM albums WHERE id = ?')
          .bind(pending.album_id)
          .first();

        const oldList = album?.track_list ? album.track_list + '\n' : '';
        const newList = oldList + pending.title;

        await db
          .prepare(
            `UPDATE albums SET track_list = ?, extra_contributors = COALESCE(extra_contributors || ', ', '') || ? WHERE id = ?`
          )
          .bind(newList, pending.contributor, pending.album_id)
          .run();
      } else if (target_track_id) {
        // 覆盖特定字段 & 自动将提交者邮箱追加填入 extra_contributors
        const existingTrack = await db
          .prepare('SELECT * FROM tracks WHERE id = ?')
          .bind(target_track_id)
          .first();

        if (existingTrack) {
          const audio_url = pending.audio_url || existingTrack.audio_url;
          const cover_url = pending.cover_url || existingTrack.cover_url;
          const lyric_url = pending.lyric_url || existingTrack.lyric_url;
          const mv_url = pending.mv_url || existingTrack.mv_url;

          await db
            .prepare(
              `UPDATE tracks 
               SET audio_url = ?, cover_url = ?, lyric_url = ?, mv_url = ?,
                   extra_contributors = CASE 
                     WHEN extra_contributors IS NULL OR extra_contributors = '' THEN ?
                     ELSE extra_contributors || ', ' || ?
                   END
               WHERE id = ?`
            )
            .bind(
              audio_url,
              cover_url,
              lyric_url,
              mv_url,
              pending.contributor,
              pending.contributor,
              target_track_id
            )
            .run();
        }
      }

      // 审核通过后删除 pending 记录
      await db.prepare('DELETE FROM pending_tracks WHERE id = ?').bind(pending_id).run();

      return new Response(
        JSON.stringify({ success: true, message: '审核已通过，数据与贡献者已追加更新！' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 拒绝过审 / 直接删除
    if (req.method === 'DELETE') {
      const { searchParams } = new URL(req.url);
      const pending_id = searchParams.get('pending_id');

      if (pending_id) {
        await db.prepare('DELETE FROM pending_tracks WHERE id = ?').bind(pending_id).run();
        return new Response(
          JSON.stringify({ success: true, message: '已拒绝并移除该审核项' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
