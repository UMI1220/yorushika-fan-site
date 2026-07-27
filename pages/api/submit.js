export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 直接解析前端传过来的 JSON 数据
    const body = await req.json();
    const { title, issue_number, cover_url, zip_url } = body;

    if (!title || !zip_url) {
      return new Response(JSON.stringify({ error: '缺少必要的标题或文件链接' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 写入 Supabase magazines 表
    const { data, error } = await supabase
      .from('magazines')
      .insert([
        {
          title,
          issue_number: issue_number || 'Vol.1',
          cover_url: cover_url || '',
          zip_url,
        },
      ])
      .select();

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
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}