export const runtime = 'edge';

export default async function handler(req) {
  const db = req.env?.DB || process.env.DB || globalThis.DB;

  try {
    // 1. 获取 pending_songs 审核队列
    if (req.method === 'GET') {
      const { results } = await db
        .prepare('SELECT * FROM pending_songs ORDER BY id DESC')
        .all();

      return new Response(
        JSON.stringify({ success: true, data: results || [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 审核通过 (APPROVE)
    if (req.method === 'POST') {
      const body = await req.json();
      const { pending_id, target_song_id, is_song_list = false } = body;
      const targetId = target_song_id || body.target_track_id;

      const pending = await db
        .prepare('SELECT * FROM pending_songs WHERE id = ?')
        .bind(pending_id)
        .first();

      if (!pending) {
        return new Response(
          JSON.stringify({ success: false, message: '暂存记录不存在' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 如果为歌曲列表追加
      if (is_song_list && pending.album_id) {
        const album = await db
          .prepare('SELECT song_list FROM albums WHERE id = ?')
          .bind(pending.album_id)
          .first();

        let currentList = [];
        try {
          currentList = album?.song_list ? JSON.parse(album.song_list) : [];
        } catch (e) {
          currentList = [];
        }

        if (!currentList.includes(pending.title)) {
          currentList.push(pending.title);
          await db
            .prepare('UPDATE albums SET song_list = ? WHERE id = ?')
            .bind(JSON.stringify(currentList), pending.album_id)
            .run();
        }
      }

      // 若未指定目标歌曲 ID，说明为全新歌曲 -> 写入 songs 表
      if (!targetId) {
        await db
          .prepare(
            `INSERT INTO songs (title, cover_url, artist, audio_url, lrc_url, mv_url, album_id, contributor)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            pending.title,
            pending.cover_url,
            pending.artist || 'ヨルシカ',
            pending.audio_url,
            pending.lrc_url,
            pending.mv_url,
            pending.album_id,
            pending.contributor
          )
          .run();
      } else {
        // 合并覆盖更新已有歌曲
        const exist = await db
          .prepare('SELECT * FROM songs WHERE id = ?')
          .bind(targetId)
          .first();

        if (exist) {
          const audio_url = pending.audio_url || exist.audio_url;
          const cover_url = pending.cover_url || exist.cover_url;
          const lrc_url = pending.lrc_url || exist.lrc_url;
          const mv_url = pending.mv_url || exist.mv_url;

          await db
            .prepare(
              `UPDATE songs SET 
                 audio_url = ?, 
                 cover_url = ?, 
                 lrc_url = ?, 
                 mv_url = ?, 
                 extra_contributors = CASE 
                   WHEN extra_contributors IS NULL OR extra_contributors = '' THEN ?
                   ELSE extra_contributors || ', ' || ?
                 END
               WHERE id = ?`
            )
            .bind(
              audio_url,
              cover_url,
              lrc_url,
              mv_url,
              pending.contributor,
              pending.contributor,
              targetId
            )
            .run();
        }
      }

      // 审核通过后删除 pending_songs 记录
      await db.prepare('DELETE FROM pending_songs WHERE id = ?').bind(pending_id).run();

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
        await db.prepare('DELETE FROM pending_songs WHERE id = ?').bind(pending_id).run();
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
