// 注册：昵称 + 邮箱 + 8 位密码 + 4 位验证码，id 从 000000001 递增
export const runtime = 'nodejs';

import crypto from 'crypto';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nickname, email, password, code } = req.body || {};

    // 校验昵称
    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ error: '请填写昵称' });
    }
    if (nickname.trim().length > 20) {
      return res.status(400).json({ error: '昵称不能超过 20 个字符' });
    }

    // 校验邮箱
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 校验密码：必须 8 位
    if (!password || !/^\d{8}$/.test(password)) {
      return res.status(400).json({ error: '密码必须为 8 位数字' });
    }

    // 校验验证码
    if (!code || !/^\d{4}$/.test(code)) {
      return res.status(400).json({ error: '请输入 4 位验证码' });
    }

    const supabase = getSupabase();

    // 校验验证码有效性
    const { data: codeRow, error: codeErr } = await supabase
      .from('person_email_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeErr || !codeRow) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await supabase.from('person_email_codes').update({ used: true }).eq('id', codeRow.id);

    // 检查昵称 / 邮箱是否已被注册
    const { data: dup } = await supabase
      .from('person_users')
      .select('id')
      .or(`nickname.eq.${nickname.trim()},email.eq.${email}`)
      .maybeSingle();

    if (dup) {
      return res.status(400).json({ error: '昵称或邮箱已被注册' });
    }

    // 生成下一个账户 id：000000001 开始递增
    const { data: maxRow } = await supabase
      .from('person_users')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNum = 1;
    if (maxRow?.id && /^\d+$/.test(maxRow.id)) {
      nextNum = parseInt(maxRow.id, 10) + 1;
    }

    // 处理并发：若撞号则重试几次
    let insertData = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const accountId = String(nextNum).padStart(9, '0');
      const { data, error } = await supabase
        .from('person_users')
        .insert({
          id: accountId,
          nickname: nickname.trim(),
          email,
          password,
        })
        .select()
        .maybeSingle();

      if (error?.code === '23505' && error.message.includes('person_users_pkey')) {
        nextNum += 1;
        continue;
      }
      if (error) throw error;
      insertData = data;
      break;
    }

    if (!insertData) {
      return res.status(500).json({ error: '账户创建失败，请重试' });
    }

    const token = signToken(insertData);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: insertData.id,
        nickname: insertData.nickname,
        email: insertData.email,
        avatar: insertData.avatar || null,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    return res.status(500).json({ error: error.message || '注册失败' });
  }
}

const SECRET = process.env.PERSON_TOKEN_SECRET || 'yorushika-person-secret';

function signToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, nickname: user.nickname, iat: Date.now() })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
