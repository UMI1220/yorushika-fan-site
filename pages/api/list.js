import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: magazines, error } = await supabase
      .from('magazines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (magazines || []).map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      category: item.category,
      description: item.description,
      totalPages: item.total_pages,
      coverImg: item.cover_img,
      pages: item.pages,
      createdAt: item.created_at,
    }));

    return res.status(200).json({
      magazines: formatted,
    });
  } catch (err) {
    console.error('List API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
