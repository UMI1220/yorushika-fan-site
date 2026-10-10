import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 关闭 Next.js 默认的 body 解析，以便某些情况下处理 raw body（Resend 通常发送 JSON，可以直接解析）
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

    // Resend Inbound Webhook 的数据结构通常包含邮件信息
    // 检查是否为收信事件 (email.received 或类似的标准入站 payload)
    const emailData = event.data || event;
    
    const toField = emailData.to; // 数组或字符串，表示发到了哪个别名邮箱，例如 ["letter_a1b2c3d4@yorusend.com"]
    const fromEmail = emailData.from; // 回信人的邮箱
    const subject = emailData.subject || '无主题回信';
    const textBody = emailData.text || emailData.html || '无正文内容';

    if (!toField) {
      return.status(400).json({ error: 'Missing recipient in webhook' });
    }

    // 提取收件地址中的别名 ID (例如从 letter_a1b2c3d4@yorusend.com 提取出 letter_a1b2c3d4)
    const recipientAddress = Array.isArray(toField) ? toField[0] : toField;
    const aliasId = recipientAddress.split('@')[0];

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

    // 2. 判断当前回信人是谁，决定转发给谁
    // 如果回信人是原始发件人，则转给已绑定的志愿者；如果是志愿者，则转给原始发件人
    let targetEmail = '';
    if (fromEmail.includes(letter.sender_email)) {
      // 如果发件人自己再次回复，可能需要转给对应的志愿者（若有）
      // 这里主要处理“收件人/志愿者回复原发件人”的场景：
      targetEmail = letter.sender_email;
    } else {
      // 默认将外部回复转发给原发件人
      targetEmail = letter.sender_email;
    }

    // 3. 通过 Resend 将回信安全转发给目标用户（隐藏真实邮箱）
    await resend.emails.send({
      from: `夜邮中转站 <noreply@${process.env.RESEND_DOMAIN}>`,
      to: targetEmail,
      reply_to: `${aliasId}@${process.env.RESEND_DOMAIN}`,
      subject: `Re: ${subject}`,
      text: `收到来自“初识的友人”的回信：\n\n---\n${textBody}\n---\n\n继续回复本邮件，即可将思绪延续。`
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
