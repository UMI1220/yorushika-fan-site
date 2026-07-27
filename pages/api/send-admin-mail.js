import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, nickname, password, groupNo } = req.body;

  try {
    const data = await resend.emails.send({
      // 修改为刚验证成功的专属域名发件人
      from: 'Yorushika FanSite <admin@yorushika-fan.top>',
      to: [email],
      subject: '【Yorushika FanSite】管理员申请通过及初始口令通知',
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #88abac; font-weight: normal; margin-top: 0;">恭喜您！您的管理员申请已通过</h2>
          <p>亲爱的 <strong>${nickname}</strong> 鹿友：</p>
          <p>感谢您对 Yorushika FanSite 的喜爱与付出。您的后台管理权限已正式生效：</p>
          <div style="background: #fafbfc; padding: 16px 20px; border-radius: 8px; border: 1px solid #f0f0f0; margin: 20px 0;">
            <p style="margin: 6px 0;">🔐 <strong>管理登录密码：</strong> <span style="color: #d9534f; font-weight: bold; font-family: monospace;">${password}</span></p>
            <p style="margin: 6px 0;">💬 <strong>管理员交流 QQ 群：</strong> <span style="color: #0275d8; font-weight: bold; font-family: monospace;">${groupNo}</span></p>
          </div>
          <p>请前往 <a href="https://yorushika-fan.top/about" style="color: #88abac; text-decoration: underline;">https://yorushika-fan.top/about</a> 点击“后台管理入口”进行登录。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 11px; color: #aaa; text-align: center;">Yorushika FanSite · 来自夏草与月光的信件</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('发信异常:', error);
    return res.status(500).json({ error: error.message });
  }
}