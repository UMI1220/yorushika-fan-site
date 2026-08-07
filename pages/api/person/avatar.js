// 上传头像：需登录 token，图片限制 2MB，存到 avatars 存储桶
export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: false,
  },
};

import crypto from 'crypto';
import formidable from 'formidable';

const SECRET = process.env.PERSON_TOKEN_SECRET || 'yorushika-person-secret';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFileSize: 2 * 1024 * 1024,
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
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

    const { files } = await parseForm(req);
    const raw = files?.avatar;
    const file = Array.isArray(raw) ? raw[0] : raw;

    if (!file) {
      return res.status(400).json({ error: '未收到头像文件' });
    }

    // 校验类型
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const mimetype = file.mimetype || '';
    if (!allowed.includes(mimetype)) {
      return res.status(400).json({ error: '仅支持 JPG/PNG/WEBP/GIF 图片' });
    }
    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '头像大小不能超过 2MB' });
    }

    // 读取二进制数据
    const fs = require('fs');
    const buf = fs.readFileSync(file.filepath);

    const ext = (mimetype || 'image/png').split('/')[1] || 'png';
    const filePath = `${session.id}_${Date.now()}.${ext}`;

    // 上传到 Supabase storage
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(filePath, buf, {
        contentType: mimetype,
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = publicUrlData?.publicUrl;

    // 转换为同源相对路径（浏览器经 dev-server /storage 反代访问）
    const toSameOrigin = (u) => {
      if (!u) return u;
      try {
        return new URL(u).pathname + new URL(u).search;
      } catch (e) {
        return u;
      }
    };
    const avatarSameOrigin = toSameOrigin(avatarUrl);

    // 更新数据库
    const { data, error } = await supabase
      .from('person_users')
      .update({ avatar: avatarSameOrigin })
      .eq('id', session.id)
      .select('id, nickname, email, avatar')
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json({ success: true, user: data, avatarUrl: avatarSameOrigin });
  } catch (error) {
    console.error('上传头像失败:', error);
    return res.status(500).json({ error: error.message || '头像上传失败' });
  }
}

