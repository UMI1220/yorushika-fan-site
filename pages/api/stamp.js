import { createClient } from '@supabase/supabase-js';

// 安全获取 Supabase 客户端
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('未配置 Supabase 环境变量 (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)');
  }
  return createClient(url, key);
}

export default async function handler(req, res) {
  // 处理 Node.js API Route / Next.js 标准格式
  const method = req.method;

  try {
    const supabase = getSupabase();

    // GET 请求：获取戳记/弹幕
    if (method === 'GET') {
      const magazineId = req.query?.magazineId || new URL(req.url, 'http://localhost').searchParams.get('magazineId');
      if (!magazineId) {
        return res ? res.status(400).json({ error: '缺少 magazineId 参数' }) : new Response(JSON.stringify({ error: '缺少 magazineId 参数' }), { status: 400 });
      }

      const { data: annotations, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('magazine_id', magazineId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fetch annotations error:', error);
        return res ? res.status(500).json({ error: error.message }) : new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      const responseData = { success: true, annotations: annotations || [] };
      return res ? res.status(200).json(responseData) : new Response(JSON.stringify(responseData), { status: 200 });
    }

    // POST 请求：提交新戳记
    if (method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      } else if (!body && req.json) {
        body = await req.json();
      }

      const { magazineId, pageIndex, content, nickname, x_percent, y_percent } = body || {};

      if (!magazineId || !content) {
        const errJson = { error: '缺少必填字段 (magazineId 或 content)' };
        return res ? res.status(400).json(errJson) : new Response(JSON.stringify(errJson), { status: 400 });
      }

      // 显式做类型安全转换
      const payload = {
        magazine_id: String(magazineId),
        page_index: Number(pageIndex) || 0,
        content: String(content),
        nickname: nickname ? String(nickname) : '匿名鹿友',
        x_percent: parseFloat(x_percent) || 50,
        y_percent: parseFloat(y_percent) || 50,
      };

      // 注意：.select() 非常关键，能确保数据顺利写入并返回插入记录
      const { data, error } = await supabase
        .from('annotations')
        .insert([payload])
        .select();

      if (error) {
        console.error('Insert stamp error detail:', error);
        const errJson = { success: false, error: error.message, details: error.details };
        return res ? res.status(500).json(errJson) : new Response(JSON.stringify(errJson), { status: 500 });
      }

      const successJson = { success: true, data };
      return res ? res.status(200).json(successJson) : new Response(JSON.stringify(successJson), { status: 200 });
    }

    return res ? res.status(405).json({ error: 'Method Not Allowed' }) : new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  } catch (err) {
    console.error('Server Stamp Internal Error:', err);
    const catchJson = { success: false, error: err.message || 'Server Error' };
    return res ? res.status(500).json(catchJson) : new Response(JSON.stringify(catchJson), { status: 500 });
  }
}