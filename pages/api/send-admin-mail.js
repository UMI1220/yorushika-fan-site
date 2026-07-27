// ⚠️ 关键点：Cloudflare Pages 必须包含此行配置！
export const runtime = 'edge';

import { Resend } from 'resend';

export default async function handler(req) {
  // 仅允许 POST 请求
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 读取环境变量
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 未检测到 RESEND_API_KEY 环境变量，跳过发送邮件。');
    return new Response(
      JSON.stringify({
        success: false,
        message: 'RESEND_API_KEY 未配置，跳过发信',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const resend = new Resend(apiKey);

    // Edge Runtime 下使用 req.json() 获取请求体
    const body = await req.json();
    const { email, nickname, password, groupNo } = body || {};

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: '缺少必要的邮箱或密码字段' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 调用 Resend 发送邮件
    const data = await resend.emails.send({
      from: 'Yorushika FanSite <admin@yorushika-fan.top>',
      to: [email],
      subject: '【Yorushika FanSite】管理员申请通过及初始口令通知',
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #88abac; font-weight: normal; margin-top: 0;">恭喜您！您的管理员申请已通过</h2>
          <p>亲爱的 <strong>${nickname || '鹿友'}</strong>：</p>
          <p>感谢您对 Yorushika FanSite 的喜爱与付出。您的后台管理权限已生效：</p>
          <div style="background: #fafbfc; padding: 16px 20px; border-radius: 8px; border: 1px solid #f0f0f0; margin: 20px 0;">
            <p style="margin: 6px 0;">🔐 <strong>管理登录密码：</strong> <span style="color: #d9534f; font-weight: bold; font-family: monospace;">${password}</span></p>
            <p style="margin: 6px 0;">💬 <strong>管理员交流 QQ 群：</strong> <span style="color: #0275d8; font-weight: bold; font-family: monospace;">${groupNo || '1090225142'}</span></p>
          </div>
          <p>请前往 <a href="https://yorushika-fan.top/about" style="color: #88abac; text-decoration: underline;">Yorushika FanSite 关于页</a> 登录后台管理中心。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 12px; color: #999;">此邮件为系统自动发送，请勿直接回复。</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('发送邮件失败:', error);
    return new Response(
      JSON.stringify({ error: error.message || '邮件发送异常' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}