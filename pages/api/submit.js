export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('未配置 Supabase 环境变量');
  }
  return createClient(url, key);
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { title, author, description, issue_number, cover_url, cover_img, zip_url, pdf_url } = body;

    const finalCover = cover_url || cover_img || '';
    const finalZip = zip_url || pdf_url || '';

    if (!title || !finalZip) {
      return new Response(JSON.stringify({ error: '缺少必要的标题或文件链接' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 同时给字段名打补丁，兼顾 cover_url / cover_img 和 zip_url / pdf_url
    const { data, error } = await supabase
      .from('magazines')
      .insert([
        {
          title,
          author: author || 'Yorushika Fan Club',
          description: description || '',
          issue_number: issue_number || 'Vol.1',
          cover_url: finalCover,
          cover_img: finalCover,
          zip_url: finalZip,
          pdf_url: finalZip,
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