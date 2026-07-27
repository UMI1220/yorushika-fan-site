export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req) {
  const url = new URL(req.url);

  // POST: 提交盖章/戳记弹幕
  if (req.method === 'POST') {
    try {
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

      return new Response(JSON.stringify({ success: true, message: '戳记留下成功！', data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } 
  
  // GET: 获取指定刊物的所有盖章弹幕
  else if (req.method === 'GET') {
    try {
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

      return new Response(JSON.stringify({ success: true, annotations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}