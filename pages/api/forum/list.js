export const runtime = 'edge';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getSupabase();
    const url = new URL(req.url);

    const id = url.searchParams.get('id');
    const category = url.searchParams.get('category');
    const sortBy = url.searchParams.get('sortBy') || 'latest';
    const search = url.searchParams.get('search');

    let query = supabase.from('forum_posts').select('*');

    // 1. 单帖详情查询（访问量 views + 1）
    if (id) {
      const { data: singlePost, error: singleErr } = await query.eq('id', id).single();
      if (singleErr) throw singleErr;

      if (singlePost) {
        // 增加浏览量，忽略并发错误
        await supabase
          .from('forum_posts')
          .update({ views: (singlePost.views || 0) + 1 })
          .eq('id', id);
      }

      return new Response(JSON.stringify(singlePost), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. 板块分类筛选
    if (category && category !== 'ALL') {
      query = query.eq('category', category);
    }

    // 3. 关键词搜索 (标题/正文/作者)
    if (search && search.trim()) {
      const keyword = `%${search.trim()}%`;
      query = query.or(`title.ilike.${keyword},content.ilike.${keyword},author.ilike.${keyword}`);
    }

    // 4. 置顶优先
    query = query.order('is_pinned', { ascending: false });

    // 5. 排序逻辑
    if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'most_likes') {
      query = query.order('likes', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'most_views') {
      query = query.order('views', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'hottest') {
      query = query
        .order('likes', { ascending: false })
        .order('views', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      // 默认 latest
      query = query.order('created_at', { ascending: false });
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify(posts || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('获取论坛列表失败:', err);
    return new Response(JSON.stringify({ error: err.message || '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}