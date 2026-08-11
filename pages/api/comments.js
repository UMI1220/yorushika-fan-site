export const runtime = 'edge';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const song_id = searchParams.get('song_id') || searchParams.get('track_id');
  const comment_id = searchParams.get('comment_id');

  const db = process.env.DB;

  try {
    // 1. 拉取评论列表与回复列表
    if (req.method === 'GET') {
      if (comment_id) {
        // 单个评论的完整内容与嵌套回复
        const comment = await db
          .prepare('SELECT * FROM comments WHERE id = ?')
          .bind(comment_id)
          .first();

        const { results: replies } = await db
          .prepare('SELECT * FROM replies WHERE comment_id = ? ORDER BY id ASC')
          .bind(comment_id)
          .all();

        return new Response(
          JSON.stringify({
            success: true,
            data: { ...comment, replies: replies || [] },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!song_id) {
        return new Response(
          JSON.stringify({ success: false, message: '请提供 song_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 拉取歌曲下的所有评论
      const { results: comments } = await db
        .prepare('SELECT * FROM comments WHERE song_id = ? ORDER BY id DESC')
        .bind(song_id)
        .all();

      // 附加回复数量和第一条回复，优化轻量磁贴拉取
      const fullComments = await Promise.all(
        (comments || []).map(async (c) => {
          const replyCount = await db
            .prepare('SELECT COUNT(*) as count FROM replies WHERE comment_id = ?')
            .bind(c.id)
            .first();
          return { ...c, reply_count: replyCount?.count || 0 };
        })
      );

      return new Response(
        JSON.stringify({ success: true, data: fullComments }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 发表评论 或 发表回复
    if (req.method === 'POST') {
      const body = await req.json();

      // 回复逻辑
      if (body.comment_id) {
        const { comment_id, nickname, content, password = '', attachment_url = '' } = body;
        if (!nickname || !content) {
          return new Response(
            JSON.stringify({ success: false, message: '昵称与内容不能为空' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const res = await db
          .prepare(
            `INSERT INTO replies (comment_id, nickname, content, password, attachment_url)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(comment_id, nickname, content, password, attachment_url)
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message: '回复成功',
            reply_id: res.meta?.last_row_id,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 评论逻辑
      const { song_id: postSongId, nickname, content, password = '', attachment_url = '' } = body;
      const targetSongId = postSongId || body.track_id;

      if (!targetSongId || !nickname || !content) {
        return new Response(
          JSON.stringify({ success: false, message: 'song_id、昵称与内容不能为空' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const res = await db
        .prepare(
          `INSERT INTO comments (song_id, nickname, content, password, attachment_url)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(targetSongId, nickname, content, password, attachment_url)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          message: '评论发表成功',
          comment_id: res.meta?.last_row_id,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 删除评论或回复 (需校验删除密码或管理员密码)
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { id, type = 'comment', password } = body;
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yorushika2026';

      if (!id || !password) {
        return new Response(
          JSON.stringify({ success: false, message: '缺少必须参数' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (type === 'reply') {
        const reply = await db
          .prepare('SELECT password FROM replies WHERE id = ?')
          .bind(id)
          .first();

        if (password === ADMIN_PASSWORD || (reply && reply.password && reply.password === password)) {
          await db.prepare('DELETE FROM replies WHERE id = ?').bind(id).run();
          return new Response(
            JSON.stringify({ success: true, message: '回复已成功删除' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const comment = await db
          .prepare('SELECT password FROM comments WHERE id = ?')
          .bind(id)
          .first();

        if (password === ADMIN_PASSWORD || (comment && comment.password && comment.password === password)) {
          await db.prepare('DELETE FROM replies WHERE comment_id = ?').bind(id).run();
          await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();

          return new Response(
            JSON.stringify({ success: true, message: '评论及其回复已成功删除' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: false, message: '密码错误，无权删除' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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
