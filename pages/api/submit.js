import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, title, author, category, description, totalPages, pages, coverImg } = req.body;

    if (type === 'submission') {
      // 插入刊物投稿
      const { data, error } = await supabase.from('magazines').insert([
        {
          title,
          author,
          category,
          description,
          total_pages: Number(totalPages) || 1,
          cover_img: coverImg || '',
          pages: pages || [],
        },
      ]);
      if (error) throw error;
    } else {
      // 插入意见反馈
      const { data, error } = await supabase.from('feedbacks').insert([
        { description },
      ]);
      if (error) throw error;
    }

    return res.status(200).json({ success: true, message: '提交成功！' });
  } catch (err) {
    console.error('Submit API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
