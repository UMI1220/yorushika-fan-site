export const runtime = 'edge';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
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
    // stampType 可选: 'flower' | 'moon' | 'ghost' | 'coffee' | 'blue'
    const { id, type, stampType } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: '缺少必需的 ID 参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isComment = type === 'comment';
    const tableName = isComment ? 'forum_comments' : 'forum_posts';
    const selectFields = isComment ? 'likes' : 'likes, stamps_detail';

    // 1. 获取当前点赞数和印章详情
    const { data: record, error: fetchErr } = await supabase
      .from(tableName)
      .select(selectFields)
      .eq('id', id)
      .single();

    if (fetchErr) {
      throw fetchErr;
    }

    // 2. 计算新点赞数与印章分布
    const currentLikes = (record?.likes || 0) + 1;
    let updatePayload = { likes: currentLikes };

    if (!isComment) {
      let details = record?.stamps_detail || { flower: 0, moon: 0, ghost: 0, coffee: 0, blue: 0 };
      if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch (e) { details = {}; }
      }
      const selectedStamp = stampType || 'blue';
      details[selectedStamp] = (details[selectedStamp] || 0) + 1;
      updatePayload.stamps_detail = details;
    }

    // 3. 写入数据库
    const { error: updateErr } = await supabase.from(tableName).update(updatePayload).eq('id', id);
    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({
        success: true,
        likes: currentLikes,
        stamps_detail: updatePayload.stamps_detail || null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('盖章/点赞接口异常:', err);
    return new Response(JSON.stringify({ error: err.message || '点赞失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}