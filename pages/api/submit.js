import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

// 关闭 Next.js 默认的 Body Parser，以便处理 multipart/form-data 文件上传
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 环境变量未正确配置。');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 使用 formidable 解析 multipart 表单数据（获取文本字段和上传的文件）
    const form = formidable({ multiples: false });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const title = fields.title?.[0] || fields.title;
    const author = fields.author?.[0] || fields.author;
    const category = fields.category?.[0] || fields.category || '同人刊物';
    const description = fields.description?.[0] || fields.description;
    const totalPages = parseInt(fields.totalPages?.[0] || fields.totalPages || '1', 10);

    const pdfFile = files.pdf?.[0] || files.pdf;
    const coverFile = files.cover?.[0] || files.cover;

    if (!pdfFile) {
      return res.status(400).json({ error: '请上传刊物的 PDF 文件' });
    }

    // 1. 将 PDF 文件上传到 Supabase Storage 的 'magazines' 桶中
    const pdfBuffer = fs.readFileSync(pdfFile.filepath);
    const pdfFileName = `${Date.now()}-${pdfFile.originalFilename || 'document.pdf'}`;
    
    const { error: pdfError } = await supabase.storage
      .from('magazines')
      .upload(`pdfs/${pdfFileName}`, pdfBuffer, {
        contentType: pdfFile.mimetype || 'application/pdf',
        upsert: false
      });

    if (pdfError) throw pdfError;

    // 获取 PDF 的公开访问 URL
    const { data: { publicUrl: pdfUrl } } = supabase.storage
      .from('magazines')
      .getPublicUrl(`pdfs/${pdfFileName}`);

    // 2. 如果有上传封面图片，同样上传到 Supabase Storage
    let coverUrl = '/covers/1.jpg'; // 默认封面
    if (coverFile) {
      const coverBuffer = fs.readFileSync(coverFile.filepath);
      const coverFileName = `${Date.now()}-${coverFile.originalFilename || 'cover.jpg'}`;
      
      const { error: coverError } = await supabase.storage
        .from('magazines')
        .upload(`covers/${coverFileName}`, coverBuffer, {
          contentType: coverFile.mimetype || 'image/jpeg',
          upsert: false
        });

      if (!coverError) {
        const { data: { publicUrl } } = supabase.storage
          .from('magazines')
          .getPublicUrl(`covers/${coverFileName}`);
        coverUrl = publicUrl;
      }
    }

    // 3. 将刊物元数据写入 Supabase 数据库的 'magazines' 表中
    const { data: insertData, error: dbError } = await supabase
      .from('magazines')
      .insert([
        {
          title,
          author,
          category,
          description,
          total_pages: totalPages,
          cover_img: coverUrl,
          pdf_url: pdfUrl,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (dbError) throw dbError;

    return res.status(200).json({ 
      success: true, 
      message: '刊物投稿成功！', 
      data: insertData[0] 
    });

  } catch (error) {
    console.error('Submit API Error:', error);
    return res.status(500).json({ error: error.message || '服务器内部错误' });
  }
}