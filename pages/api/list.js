import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { data: magazines, error } = await supabase
      .from('magazines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 关键：必须把数据库的下划线字段映射为前端可用的驼峰字段！
    const formattedMagazines = (magazines || []).map(item => ({
      id: item.id,
      title: item.title,
      author: item.author,
      category: item.category,
      description: item.description,
      totalPages: item.total_pages || 1,
      coverImg: item.cover_img || '/covers/1.jpg',
      pdfUrl: item.pdf_url || '', // 确保这一行绝对不能少！
      createdAt: item.created_at,
    }));

    return res.status(200).json({ magazines: formattedMagazines });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}