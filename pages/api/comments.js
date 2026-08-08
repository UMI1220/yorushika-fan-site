import { getDB } from '../../lib/d1';

export const runtime = 'edge';

export default async function handler(req) {
  const db = getDB();

  // GET: 拉取某首歌曲的评论树
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const trackId = url.searchParams.get('track_id');

      if (!trackId) {
        return new Response(JSON.stringify({ error: 'Missing track_id' }), { status: 400 });
      }

      // 获取该歌曲的所有评论
      const { results } = await db
        .prepare('SELECT * FROM comments WHERE track_id = ? ORDER BY created_at ASC')
        .bind(trackId)
        .all();

      // 将平铺的数据组合成 [主评论 -> replies 数组] 嵌套结构
      const commentMap = {};
      const rootComments = [];

      (results || []).forEach((item) => {
        item.replies = [];
        commentMap[item.id] = item;
      });

      (results || []).forEach((item) => {
        if (item.parent_id && commentMap[item.parent_id]) {
          commentMap[item.parent_id].replies.push(item);
        } else {
          rootComments.push(item);
        }
      });

      return new Response(JSON.stringify(rootComments), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // POST: 发表评论或回复
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { track_id, parent_id, nickname, content, media_url, media_type, delete_password } = body;

      if (!track_id || !nickname || !content) {
        return new Response(JSON.stringify({ error: '必填字段不能为空' }), { status: 400 });
      }

      const res = await db
        .prepare(
          `INSERT INTO comments (track_id, parent_id, nickname, content, media_url, media_type, delete_password) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          track_id,
          parent_id || null,
          nickname.trim(),
          content.trim(),
          media_url || null,
          media_type || null,
          delete_password || null
        )
        .run();

      return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
}
