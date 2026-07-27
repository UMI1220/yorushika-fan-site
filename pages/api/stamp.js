export const runtime = 'edge';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { magazineId, pageIndex, content, nickname } = body;
      if (!magazineId || !content) {
        return new Response(JSON.stringify({ error: '缺少必填字段' }), { status: 400 });
      }

      const { data, error } = await supabase.from('annotations').insert([
        {
          magazine_id: magazineId,
          page_index: Number(pageIndex) || 0,
          content,
          nickname: nickname || '匿名粉丝',
        },
      ]);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: '戳记留下成功！' }), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  } else if (req.method === 'GET') {
    try {
      const { searchParams } = new URL(req.url);
      const magazineId = searchParams.get('magazineId');

      if (!magazineId) {
        return new Response(JSON.stringify({ error: '缺少 magazineId' }), { status: 400 });
      }

      const { data: annotations, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('magazine_id', magazineId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, annotations }), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
}