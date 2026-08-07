// 查询已注册用户列表（仅返回 id 和昵称）
export const runtime = 'nodejs';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('person_users')
      .select('id, nickname, avatar, created_at')
      .order('id', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, users: data || [] });
  } catch (error) {
    console.error('查询用户列表失败:', error);
    return res.status(500).json({ error: error.message || '查询失败' });
  }
}
