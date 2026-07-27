// 匹配你的真实文件路径：lib/supabase.js
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { title, author, description, coverImg, pdfUrl, totalPages } = req.body;

  if (!title || !coverImg || !pdfUrl) {
    return res.status(400).json({ error: '缺少必要的期刊数据参数' });
  }

  try {
    const { data, error } = await supabase
      .from('magazines')
      .insert([
        {
          title,
          author: author || '回声编辑部',
          description,
          cover_img: coverImg,
          pdf_url: pdfUrl,
          total_pages: totalPages || 1,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase 数据库插入失败:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('创建期刊数据库条目失败:', err);
    return res.status(500).json({ error: err.message });
  }
}