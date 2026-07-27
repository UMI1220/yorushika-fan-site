export const runtime = 'edge';

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

export default async function handler(req) {
  try {
    const supabase = getSupabase();
    const url = new URL(req.url);

    // 1. GET 请求：获取戳记/弹幕
    if (req.method === 'GET') {
      const magazineId = url.searchParams.get('magazineId');
      if (!magazineId) {
        return new Response(JSON.stringify({ error: '缺少 magazineId 参数' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      const { data: annotations, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('magazine_id', magazineId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fetch annotations error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      return new Response(JSON.stringify({ success: true, annotations: annotations || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // 2. POST 请求：提交新戳记
    if (req.method === 'POST') {
      const body = await req.json();
      const { magazineId, pageIndex, content, nickname, x_percent, y_percent } = body || {};

      if (!magazineId || !content) {
        return new Response(JSON.stringify({ error: '缺少必填字段 (magazineId 或 content)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      // 显式格式化字段
      const payload = {
        magazine_id: String(magazineId),
        page_index: Number(pageIndex) || 0,
        content: String(content),
        nickname: nickname ? String(nickname) : '匿名鹿友',
        x_percent: parseFloat(x_percent) || 50,
        y_percent: parseFloat(y_percent) || 50,
      };

      // 注意：.select() 非常关键，确保在 Edge Runtime 下正确触发并返回插入结果
      const { data, error } = await supabase
        .from('annotations')
        .insert([payload])
        .select();

      if (error) {
        console.error('Insert stamp error detail:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message, details: error.details }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }
        );
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    console.error('Server Stamp Internal Error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}