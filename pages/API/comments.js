export const runtime = 'edge';

export default async function handler(req) {
  const { method } = req;
  const { searchParams } = new URL(req.url);

  try {
    // GET: 获取评论列表
    if (method === 'GET') {
      const targetId = searchParams.get('targetId') || 'global';
      
      let comments = [];
      if (process.env.DB) {
        const { results } = await process.env.DB.prepare(
          `SELECT * FROM comments WHERE target_id = ? ORDER BY created_at DESC LIMIT 50`
        ).bind(targetId).all();
        comments = results;
      }

      return new Response(JSON.stringify({ success: true, comments }), { status: 200 });
    }

    // POST: 发表评论
    if (method === 'POST') {
      const { targetId, nickname, content, email } = await req.json();

      if (!content || !nickname) {
        return new Response(JSON.stringify({ error: '内容和昵称不能为空' }), { status: 400 });
      }

      if (process.env.DB) {
        await process.env.DB.prepare(
          `INSERT INTO comments (target_id, nickname, content, email) VALUES (?, ?, ?, ?)`
        ).bind(targetId || 'global', nickname, content, email || '').run();
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
