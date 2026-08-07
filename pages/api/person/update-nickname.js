// 修改昵称：需登录 token，昵称唯一校验
export const runtime = 'nodejs';

import crypto from 'crypto';

const SECRET = process.env.PERSON_TOKEN_SECRET || 'yorushika-person-secret';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

function verifyToken(token) {
  try {
    const [payload, sig] = String(token || '').split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.id || !data.nickname) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const session = verifyToken(token);

    if (!session) {
      return res.status(401).json({ error: '未登录或登录已失效' });
    }

    const { nickname } = req.body || {};
    const newNickname = (nickname || '').trim();

    if (!newNickname) {
      return res.status(400).json({ error: '请填写昵称' });
    }
    if (newNickname.length > 20) {
      return res.status(400).json({ error: '昵称不能超过 20 个字符' });
    }

    const supabase = getSupabase();

    // 昵称唯一性检查（排除自己）
    const { data: dup, error: dupErr } = await supabase
      .from('person_users')
      .select('id')
      .eq('nickname', newNickname)
      .neq('id', session.id)
      .maybeSingle();

    if (dupErr) throw dupErr;
    if (dup) {
      return res.status(400).json({ error: '该昵称已被占用' });
    }

    const { data, error } = await supabase
      .from('person_users')
      .update({ nickname: newNickname })
      .eq('id', session.id)
      .select('id, nickname, email')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: '账户不存在' });
    }

    return res.status(200).json({ success: true, user: data });
  } catch (error) {
    console.error('修改昵称失败:', error);
    return res.status(500).json({ error: error.message || '修改昵称失败' });
  }
}
