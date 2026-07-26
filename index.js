export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/submit' && request.method === 'POST') {
      try {
        const data = await request.json();
        const id = 'item-' + Date.now();
        const createdAt = new Date().toISOString();

        if (data.type === 'submission') {
          await env.DB.prepare(
            `INSERT INTO magazines (id, title, author, category, issue, description, file_url, pages, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            data.title,
            data.author,
            data.category,
            data.issue || '2026 盛夏号',
            data.description || '',
            data.fileUrl || '',
            52,
            createdAt
          ).run();
        } else {
          await env.DB.prepare(
            `INSERT INTO annotations (id, magazine_id, page, x, y, author, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            'feedback-issue',
            0,
            0,
            0,
            data.author || '匿名用户',
            `[${data.feedbackType}] ${data.feedbackContent} (联系方式: ${data.contact || '无'})`,
            createdAt
          ).run();
        }

        return new Response(JSON.stringify({ success: true, id }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Yorushika Echo D1 Backend Active', { status: 200, headers: corsHeaders });
  }
};
