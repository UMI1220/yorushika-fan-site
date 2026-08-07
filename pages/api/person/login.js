// 登录：昵称 + 密码，返回会话 token（简单签名）
export const runtime = 'nodejs';

import crypto from 'crypto';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

const SECRET = process.env.PERSON_TOKEN_SECRET || 'yorushika-person-secret';

function signToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, nickname: user.nickname, iat: Date.now() })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nickname, password } = req.body || {};

    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ error: '请填写昵称' });
    }
    if (!password) {
      return res.status(400).json({ error: '请填写密码' });
    }

    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from('person_users')
      .select('*')
      .eq('nickname', nickname.trim())
      .maybeSingle();

    if (error) throw error;

    if (!user || user.password !== password) {
      return res.status(401).json({ error: '昵称或密码错误' });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id, nickname: user.nickname, email: user.email, avatar: user.avatar || null },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return res.status(500).json({ error: error.message || '登录失败' });
  }
}
