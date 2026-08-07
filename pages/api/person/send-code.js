// 发送邮箱验证码（163 SMTP + nodemailer）
export const runtime = 'nodejs';

import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.163.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || 'zxase16@163.com';
const SMTP_PASS = process.env.SMTP_PASS;

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
    const { email } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    const supabase = getSupabase();

    // 邮箱是否已被注册
    const { data: existing } = await supabase
      .from('person_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 生成 4 位验证码
    const code = String(Math.floor(1000 + Math.random() * 9000));

    // 写入验证码表（同一邮箱旧码作废）
    await supabase
      .from('person_email_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    const { error: insertErr } = await supabase.from('person_email_codes').insert({
      email,
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 分钟有效
    });

    if (insertErr) throw insertErr;

    if (!SMTP_PASS) {
      // 开发模式：未配置 SMTP 密码时返回验证码便于联调
      console.log(`[DEV] 验证码 for ${email}: ${code}`);
      return res.status(200).json({ success: true, devCode: code });
    }

    // 发送邮件
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `Yorushika FanSite <${SMTP_USER}>`,
      to: email,
      subject: '【Yorushika FanSite】注册验证码',
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #88abac; font-weight: normal; margin-top: 0;">Yorushika FanSite 注册验证码</h2>
          <p>您好！您正在注册 Yorushika FanSite 个人主页账户。</p>
          <p>您的验证码是：</p>
          <div style="background: #fafbfc; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #f0f0f0; margin: 20px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #88abac; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #999;">验证码 10 分钟内有效，请勿泄露给他人。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 12px; color: #999;">此邮件为系统自动发送，请勿直接回复。</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('发送验证码失败:', error);
    return res.status(500).json({ error: error.message || '验证码发送失败' });
  }
}
