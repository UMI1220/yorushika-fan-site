export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

// 安全获取 Supabase 客户端，防止顶格报错
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('未配置 Supabase 环境变量 (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)');
  }
  return createClient(url, key);
}

export default async function handler(req) {
  try {
    const supabase = getSupabase();
    const url = new URL(req.url);

    // GET 请求：获取戳记/弹幕
    if (req.method === 'GET') {
      const magazineId = url.searchParams.get('magazineId');
      if (!magazineId) {
        return new Response(JSON.stringify({ error: '缺少 magazineId 参数' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: annotations, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('magazine_id', magazineId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, annotations: annotations || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST 请求：提交新戳记
    if (req.method === 'POST') {
      const body = await req.json();
      const { magazineId, pageIndex, content, nickname, x_percent, y_percent } = body;

      if (!magazineId || !content) {
        return new Response(JSON.stringify({ error: '缺少必填字段' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase.from('annotations').insert([
        {
          magazine_id: magazineId,
          page_index: Number(pageIndex) || 0,
          content,
          nickname: nickname || '匿名鹿友',
          x_percent: x_percent || 50,
          y_percent: y_percent || 50,
        },
      ]);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}