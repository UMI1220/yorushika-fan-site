import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    const filePath = path.resolve(process.cwd(), 'local_database.json');
    
    let dbData = { magazines: [], annotations: [] };
    if (fs.existsSync(filePath)) {
      dbData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    if (data.type === 'submission') {
      const newMagazine = {
        id: 'mag-' + Date.now(),
        title: data.title || '無題の群刊',
        author: data.author || '匿名创作者',
        category: data.category || '刊物/电子书 (JPG多图)',
        description: data.description || '',
        totalPages: data.totalPages || 1,
        pages: data.pages || [],
        coverImg: (data.pages && data.pages[0]) || '/magazine-pages/page-1.jpg',
        created_at: new Date().toISOString()
      };
      dbData.magazines.push(newMagazine);
   export const runtime = 'edge';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 模拟成功接收数据，不写本地文件
    return new Response(JSON.stringify({ success: true, message: 'Demo submit success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
