export const runtime = 'edge';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const song_id = searchParams.get('song_id') || searchParams.get('track_id');
  const comment_id = searchParams.get('comment_id');

  // 1. 兼容获取 D1 数据库绑定
  const db = req.env?.DB || process.env.DB || globalThis.DB;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (!db) {
    return new Response(
      JSON.stringify({ success: false, message: 'D1 数据库绑定 [DB] 未找到，请检查环境配置' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // -------------------------------------------------------------------------
    // GET: 拉取评论与回复列表
    // -------------------------------------------------------------------------
    if (req.method === 'GET') {
      // 1.1 拉取单条评论详情及嵌套的所有回复
      if (comment_id) {
        const comment = await db
          .prepare('SELECT * FROM comments WHERE id = ?')
          .bind(comment_id)
          .first();

        if (!comment) {
          return new Response(
            JSON.stringify({ success: false, message: '评论不存在' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

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

      // 1.2 要求必须包含 song_id
      if (!song_id) {
        return new Response(
          JSON.stringify({ success: false, message: '请提供 song_id 或 track_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 1.3 查询该歌曲下的所有主评论及其子回复
      const { results: comments } = await db
        .prepare('SELECT * FROM comments WHERE song_id = ? ORDER BY id DESC')
        .bind(song_id)
        .all();

      const commentsWithReplies = await Promise.all(
        (comments || []).map(async (comment) => {
          const { results: replies } = await db
            .prepare('SELECT * FROM replies WHERE comment_id = ? ORDER BY id ASC')
            .bind(comment.id)
            .all();
          return { ...comment, replies: replies || [] };
        })
      );

      return new Response(
        JSON.stringify({ success: true, data: commentsWithReplies }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // POST: 发布评论或回复
    // -------------------------------------------------------------------------
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        song_id: bodySongId,
        track_id: bodyTrackId,
        comment_id: bodyCommentId,
        nickname = '匿名君',
        content,
        password = '',
        attachment_url = '',
      } = body;

      const targetSongId = bodySongId || bodyTrackId || song_id;
      const targetCommentId = bodyCommentId || comment_id;

      if (!content || !content.trim()) {
        return new Response(
          JSON.stringify({ success: false, message: '评论内容不能为空' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 如果提供了 comment_id，视为“对评论的回复” -> 插入 replies 表
      if (targetCommentId) {
        const res = await db
          .prepare(
            `INSERT INTO replies (comment_id, nickname, content, password, attachment_url)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(targetCommentId, nickname.trim(), content.trim(), password.trim(), attachment_url.trim())
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message: '回复成功！',
            reply_id: res.meta?.last_row_id,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 否则为“针对歌曲的评论” -> 插入 comments 表
      if (!targetSongId) {
        return new Response(
          JSON.stringify({ success: false, message: '缺少对应的 song_id，无法发表评论' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const res = await db
        .prepare(
          `INSERT INTO comments (song_id, nickname, content, password, attachment_url)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(targetSongId, nickname.trim(), content.trim(), password.trim(), attachment_url.trim())
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          message: '评论发表成功！',
          comment_id: res.meta?.last_row_id,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------------------
    // DELETE: 删除评论或回复
    // -------------------------------------------------------------------------
    if (req.method === 'DELETE') {
      const body = await req.json().catch(() => ({}));
      const id = body.id || searchParams.get('id');
      const is_reply = body.is_reply || searchParams.get('is_reply') === 'true';
      const password = body.password || searchParams.get('password') || '';

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, message: '缺少要删除的评论 ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 删除子回复
      if (is_reply) {
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
        // 删除主评论（连同关联回复一起删掉）
        const comment = await db
          .prepare('SELECT password FROM comments WHERE id = ?')
          .bind(id)
          .first();

        if (password === ADMIN_PASSWORD || (comment && comment.password && comment.password === password)) {
          await db.prepare('DELETE FROM replies WHERE comment_id = ?').bind(id).run();
          await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();

          return new Response(
            JSON.stringify({ success: true, message: '评论及其所有回复已成功删除' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: false, message: '密码校验错误，无权删除该评论' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
