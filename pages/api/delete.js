import { createClient } from '@supabase/supabase-js';

// 声明运行环境为 Edge
export const runtime = 'edge';

// 允许删除的数据表白名单
const ALLOWED_TABLES = [
  'music',
  'gallery',
  'magazine',
  'forum_posts',
  'forum_comments',
];

// 初始化 Supabase Client (Edge 环境需用 process.env 获取环境变量)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req) {
  // 1. 仅允许 DELETE 请求
  if (req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. 从 Request Headers 提取管理员密码
  const adminPassword = req.headers.get('x-admin-password');
  const TARGET_PASSWORD = process.env.ADMIN_PASSWORD || 'yorushika2024';

  if (!adminPassword || adminPassword !== TARGET_PASSWORD) {
    return new Response(
      JSON.stringify({ success: false, error: '管理员密码错误，无法执行删除操作' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. 解析 URL 中的 query 参数
  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !id) {
    return new Response(
      JSON.stringify({ success: false, error: '缺少必需参数: table 或 id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. 白名单校验
  if (!ALLOWED_TABLES.includes(table)) {
    return new Response(
      JSON.stringify({ success: false, error: `非法的数据表名称: ${table}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 5. 执行 Supabase 删除
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `成功从 ${table} 表中删除 ID 为 ${id} 的记录`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}