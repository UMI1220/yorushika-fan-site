import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // 兼容 Resend 不同的 payload 嵌套格式
    const emailData = event.data || event;
    
    // Resend 的 to 字段有时是字符串，有时是包含 email 属性的对象或数组
    let toField = emailData.to;
    if (Array.isArray(toField)) {
      toField = toField[0];
    }
    const recipientEmail = typeof toField === 'object' && toField !== null ? toField.email : toField;
    
    // 同样兼容处理发件人
    let fromField = emailData.from;
    if (Array.isArray(fromField)) {
      fromField = fromField[0];
    }
    const fromEmail = typeof fromField === 'object' && fromField !== null ? fromField.email : fromField;

    const subject = emailData.subject || '无主题回信';
    const textBody = emailData.text || emailData.html || '无正文内容';

    if (!recipientEmail) {
      return.status(400).json({ error: 'Missing recipient in webhook' });
    }

    // 从收件地址中提取别名 ID (例如 letter_a1b2c3d4@yorushika-fan.top -> letter_a1b2c3d4)
    const aliasId = recipientEmail.split('@')[0];

    if (!aliasId || !aliasId.startsWith('letter_')) {
      return res.status(400).json({ error: 'Invalid alias format' });
    }

    // 1. 在 Supabase 中通过 reply_alias_id 查找原始信件
    const { data: letter, error: fetchError } = await supabase
      .from('letters')
      .select('*')
      .eq('reply_alias_id', aliasId)
      .single();

    if (fetchError || !letter) {
      console.error('Letter not found for alias:', aliasId);
      return res.status(404).json({ error: 'Original letter not found' });
    }

    // 2. 确认目标转发对象
    // 如果回信来自原发件人，则转给志愿者；如果是其他人（志愿者/收件人），则转给原发件人
    let targetEmail = letter.sender_email;
    if (fromEmail && fromEmail.includes(letter.sender_email)) {
      // 如果原发件人自己又回了一封，且有绑定志愿者，可以转给志愿者
      if (letter.assigned_volunteer_id) {
        const { data: volunteer } = await supabase
          .from('volunteers')
          .select('email')
          .eq('id', letter.assigned_volunteer_id)
          .single();
        if (volunteer) targetEmail = volunteer.email;
      }
    }

    // 3. 通过 Resend 将回信安全转发给目标用户（隐藏真实邮箱）
    await resend.emails.send({
      from: `夜邮中转站 <noreply@yorushika-fan.top>`,
      to: targetEmail,
      reply_to: `${aliasId}@yorushika-fan.top`,
      subject: `Re: ${subject}`,
      text: `收到来自远方的回信：\n\n---\n${textBody}\n---\n\n继续直接回复本邮件，即可将思绪延续。`
    });

    // 4. 更新信件状态为已回复
    await supabase
      .from('letters')
      .update({
        status: 'replied',
        replied_at: new Date().toISOString()
      })
      .eq('id', letter.id);

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: err.message });
  }
}
