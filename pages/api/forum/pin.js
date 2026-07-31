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
    const { postId, password } = body;

    if (!postId || !password) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少必要的帖子 ID 或管理员密码' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. 验证管理员密码：查询 admin_users 表中是否有匹配该密码的账号
    const { data: adminUser, error: adminErr } = await supabase
      .from('admin_users')
      .select('id')
      .eq('password', password.trim())
      .maybeSingle();

    if (adminErr || !adminUser) {
      return new Response(
        JSON.stringify({ success: false, error: '管理员密码错误，无法执行置顶操作' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 先获取帖子当前的置顶状态
    const { data: currentPost, error: fetchErr } = await supabase
      .from('forum_posts')
      .select('is_pinned')
      .eq('id', postId)
      .single();

    if (fetchErr || !currentPost) {
      return new Response(
        JSON.stringify({ success: false, error: '未找到对应帖子' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. 将置顶状态取反（置顶 变成 取消置顶，反之亦然）
    const newPinnedStatus = !currentPost.is_pinned;

    const { error: updateErr } = await supabase
      .from('forum_posts')
      .update({ is_pinned: newPinnedStatus })
      .eq('id', postId);

    if (updateErr) {
      return new Response(
        JSON.stringify({ success: false, error: updateErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_pinned: newPinnedStatus,
        message: newPinnedStatus ? '置顶成功！' : '已取消置顶！',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}