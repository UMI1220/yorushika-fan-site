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
    const { id, type, password } = await req.json(); // type: 'post' | 'comment'
    const tableName = type === 'comment' ? 'forum_comments' : 'forum_posts';

    if (!id || !password?.trim()) {
      return new Response(JSON.stringify({ error: '缺少必需的 ID 或密码' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const inputPwd = password.trim();

    // 🔑 1. 查询 Supabase 的 admin_users 表，校验输入的密码是否为管理员密码
    let isMasterAdmin = false;
    const { data: adminUsers, error: adminErr } = await supabase
      .from('admin_users')
      .select('id')
      .eq('password', inputPwd)
      .limit(1);

    if (!adminErr && adminUsers && adminUsers.length > 0) {
      isMasterAdmin = true;
    }

    // 🔑 2. 查询要删除记录的原作者设置的 delete_password
    const { data: record, error: fetchErr } = await supabase
      .from(tableName)
      .select('delete_password')
      .eq('id', id)
      .single();

    if (fetchErr || !record) {
      return new Response(JSON.stringify({ error: '未找到该记录或已被删除' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔑 3. 校验权限（管理员密码 OR 用户发帖/发评时自设的删除口令）
    const hasOwnerPassword = Boolean(record.delete_password && record.delete_password.trim() !== '');
    const isOwnerPassword = hasOwnerPassword && record.delete_password === inputPwd;

    if (!isMasterAdmin && !isOwnerPassword) {
      return new Response(JSON.stringify({ error: '密码错误或原作者未设定删除口令' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔑 4. 权限通过，执行删除操作
    const { error: delErr } = await supabase.from(tableName).delete().eq('id', id);

    if (delErr) throw delErr;

    return new Response(
      JSON.stringify({ success: true, message: isMasterAdmin ? '管理员强制删除成功' : '删除成功' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('删除接口异常:', err);
    return new Response(JSON.stringify({ error: err.message || '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}