export const runtime = 'edge';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export default async function handler(req) {
  const supabase = getSupabase();

  // 1. GET 请求：拉取指定 post_id 的评论列表
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const postId = url.searchParams.get('post_id');
    if (!postId) {
      return new Response(JSON.stringify({ error: '缺少 post_id 参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. POST 请求：提交新评论
  if (req.method === 'POST') {
    try {
      const { post_id, author, content, parent_id, image_url, delete_password } = await req.json();

      if (!post_id || (!content?.trim() && !image_url)) {
        return new Response(JSON.stringify({ error: '评论正文或附图不能完全为空' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('forum_comments')
        .insert([
          {
            post_id,
            author: author?.trim() || '匿名鹿友',
            content: content?.trim() || '',
            parent_id: parent_id || null,
            image_url: image_url || '',
            delete_password: delete_password?.trim() || '',
            likes: 0,
          },
        ])
        .select();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data: data?.[0] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || '发送评论失败' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}