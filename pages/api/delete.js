export const runtime = 'edge';

export default async function handler(req) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-password',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const url = new URL(req.url);
    let table = url.searchParams.get('table');
    let id = url.searchParams.get('id');

    if (!table || !id) {
      try {
        const body = await req.json();
        table = table || body.table;
        id = id || body.id;
      } catch (e) {}
    }

    if (!table || !id) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少必要参数：table 和 id' }),
        { status: 400, headers }
      );
    }

    // 🔑 密码校验逻辑：如果是删除帖子(forum_posts)，校验 ADMIN_PASSWORD
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const providedPassword = req.headers.get('x-admin-password');

    if (table === 'forum_posts') {
      if (providedPassword !== adminPassword) {
        return new Response(
          JSON.stringify({ success: false, error: '管理员密码不正确，无权删除此帖子' }),
          { status: 401, headers }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // 执行删除
    const targetUrl = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ success: false, error: errorText || '删除操作失败' }),
        { status: response.status, headers }
      );
    }

    const deletedData = await response.json();

    return new Response(
      JSON.stringify({ success: true, deletedData }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || '服务器内部错误' }),
      { status: 500, headers }
    );
  }
}