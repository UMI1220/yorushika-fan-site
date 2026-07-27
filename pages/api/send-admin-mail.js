import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 未检测到 RESEND_API_KEY 环境变量，跳过发送邮件。');
    return res.status(200).json({ success: false, message: 'RESEND_API_KEY 未配置' });
  }

  try {
    const resend = new Resend(apiKey);
    const { email, nickname, password, groupNo } = req.body || {};

    const data = await resend.emails.send({
      from: 'Yorushika FanSite <admin@yorushika-fan.top>',
      to: [email],
      subject: '【Yorushika FanSite】管理员申请通过及初始口令通知',
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #88abac; font-weight: normal; margin-top: 0;">恭喜您！您的管理员申请已通过</h2>
          <p>亲爱的 <strong>${nickname || '鹿友'}</strong>：</p>
          <p>您的后台管理权限已生效：</p>
          <div style="background: #fafbfc; padding: 16px 20px; border-radius: 8px; border: 1px solid #f0f0f0; margin: 20px 0;">
            <p style="margin: 6px 0;">🔐 <strong>管理登录密码：</strong> <span style="color: #d9534f; font-weight: bold; font-family: monospace;">${password}</span></p>
            <p style="margin: 6px 0;">💬 <strong>管理员交流 QQ 群：</strong> <span style="color: #0275d8; font-weight: bold; font-family: monospace;">${groupNo || '1090225142'}</span></p>
          </div>
          <p>请前往 <a href="https://yorushika-fan.top/about" style="color: #88abac; text-decoration: underline;">Yorushika FanSite 关于页</a> 登录后台。</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('发送邮件失败:', error);
    return res.status(500).json({ error: error.message || '邮件发送异常' });
  }
}