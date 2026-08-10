export const runtime = 'edge';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const track_id = searchParams.get('track_id');
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

      if (!track_id) {
        return new Response(
          JSON.stringify({ success: false, message: '请提供 track_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 拉取歌曲下的所有评论
      const { results: comments } = await db
        .prepare('SELECT * FROM comments WHERE track_id = ? ORDER BY id DESC')
        .bind(track_id)
        .all();

      return new Response(
        JSON.stringify({ success: true, data: comments || [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 发表评论或回复
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        isReply = false,
        comment_id: targetCommentId,
        track_id: targetTrackId,
        nickname,
        content,
        delete_password = '',
        attachment_url = '',
      } = body;

      if (!nickname || !content) {
        return new Response(
          JSON.stringify({ success: false, message: '昵称与文本不能为空' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 发表回复
      if (isReply && targetCommentId) {
        await db
          .prepare(
            `INSERT INTO replies (nickname, content, delete_password, comment_id, attachment_url)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(nickname, content, delete_password, targetCommentId, attachment_url)
          .run();

        return new Response(
          JSON.stringify({ success: true, message: '回复成功' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 发表主评论
      await db
        .prepare(
          `INSERT INTO comments (nickname, content, delete_password, track_id, attachment_url)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(nickname, content, delete_password, targetTrackId, attachment_url)
        .run();

      return new Response(
        JSON.stringify({ success: true, message: '评论发布成功' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 删除评论/回复 (支持设置的密码 或 管理员密码 UMI1220)
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { id, type = 'comment', password } = body;

      const ADMIN_PASSWORD = 'UMI1220';

      if (type === 'reply') {
        const reply = await db
          .prepare('SELECT delete_password FROM replies WHERE id = ?')
          .bind(id)
          .first();

        if (
          password === ADMIN_PASSWORD ||
          (reply && reply.delete_password && reply.delete_password === password)
        ) {
          await db.prepare('DELETE FROM replies WHERE id = ?').bind(id).run();
          return new Response(
            JSON.stringify({ success: true, message: '回复已成功删除' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const comment = await db
          .prepare('SELECT delete_password FROM comments WHERE id = ?')
          .bind(id)
          .first();

        if (
          password === ADMIN_PASSWORD ||
          (comment && comment.delete_password && comment.delete_password === password)
        ) {
          // 删除该评论及其关联回复
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
