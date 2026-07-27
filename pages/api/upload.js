export const runtime = 'edge';
import formidable from 'formidable';
import fs from 'fs';
// 匹配你的真实文件路径：lib/supabase.js
import { supabase } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable 解析错误:', err);
      return res.status(500).json({ error: '文件解析失败' });
    }

    const rawFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!rawFile) {
      return res.status(400).json({ error: '未接收到文件' });
    }

    try {
      const fileBuffer = fs.readFileSync(rawFile.filepath);
      const originalFilename = rawFile.originalFilename || 'upload-file';
      const ext = originalFilename.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // 上传至 Supabase Storage 的 'magazines' 存储桶
      const { data, error } = await supabase.storage
        .from('magazines')
        .upload(fileName, fileBuffer, {
          contentType: rawFile.mimetype || 'application/octet-stream',
          upsert: true,
        });

      if (error) {
        console.error('Supabase Storage 上传失败:', error);
        return res.status(500).json({ error: error.message });
      }

      // 获取公开访问链接
      const { data: publicData } = supabase.storage
        .from('magazines')
        .getPublicUrl(fileName);

      return res.status(200).json({ url: publicData.publicUrl });
    } catch (uploadErr) {
      console.error('上传服务器错误:', uploadErr);
      return res.status(500).json({ error: uploadErr.message });
    }
  });
}