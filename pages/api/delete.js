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

  // 2. 从 Request Headers 提取用户输入的密码
  const inputPassword = req.headers.get('x-admin-password');
  if (!inputPassword) {
    return new Response(
      JSON.stringify({ success: false, error: '请输入删除密码' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
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
    // 5. 先查询目标资源记录，获取其对应的 delete_pass / delete_password 字段
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !record) {
      return new Response(
        JSON.stringify({ success: false, error: '未找到对应的数据记录' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 兼容不同的字段名 (部分表可能叫 delete_pass，部分叫 delete_password)
    const itemPassword = record.delete_pass || record.delete_password;
    let isAuthorized = false;

    // 5.1 校验 1：如果用户输入的密码与记录自身的删除密码一致
    if (itemPassword && inputPassword === itemPassword) {
      isAuthorized = true;
    }

    // 5.2 校验 2：如果资源密码不匹配，再检查是否为环境变量管理员密码，或 admin_users 表中的管理员密码
    if (!isAuthorized) {
      // 备用：硬编码/环境变量管理员密码校验
      const envAdminPass = process.env.ADMIN_PASSWORD || 'yorushika2024';
      if (inputPassword === envAdminPass) {
        isAuthorized = true;
      } else {
        // 查 admin_users 表比对管理员密码
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('password', inputPassword)
          .limit(1);

        if (adminUser && adminUser.length > 0) {
          isAuthorized = true;
        }
      }
    }

    // 若校验均未通过，拒绝删除
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, error: '删除密码不正确，无法执行删除操作' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. 验证成功，执行 Supabase 删除
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (deleteError) {
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: '删除成功' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}