export const runtime = 'edge';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 发布新戳记评论
    try {
      const { magazineId, pageIndex, content, nickname } = req.body;
      if (!magazineId || !content) {
        return res.status(400).json({ error: '缺少必填字段' });
      }

      const { data, error } = await supabase.from('annotations').insert([
        {
          magazine_id: magazineId,
          page_index: Number(pageIndex) || 0,
          content,
          nickname: nickname || '匿名粉丝',
        },
      ]);

      if (error) throw error;
      return res.status(200).json({ success: true, message: '戳记留下成功！' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'GET') {
    // 获取指定刊物的戳记评论
    try {
      const { magazineId } = req.query;
      if (!magazineId) {
        return res.status(400).json({ error: '缺少 magazineId' });
      }

      const { data: annotations, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('magazine_id', magazineId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return res.status(200).json({ annotations: annotations || [] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
