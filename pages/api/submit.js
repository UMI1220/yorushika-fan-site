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
    const body = await req.json();
    const { title, author, description, cover_url, zip_url, category, issue_number } = body;

    if (!title || !zip_url) {
      return new Response(JSON.stringify({ error: '缺少必要的标题或文件链接' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 完整写入 Supabase magazines 表的字段
    const { data, error } = await supabase
      .from('magazines')
      .insert([
        {
          title,
          author: author || 'Yorushika Fan Club',
          description: description || '',
          cover_url: cover_url || '',
          zip_url,
          category: category || 'echo',
          issue_number: issue_number || 'Vol.1',
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