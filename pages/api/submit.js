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
    } else {
      const newFeedback = {
        id: 'item-' + Date.now(),
        type: 'feedback',
        feedbackContent: data.description || data.feedbackContent || '',
        author: '社区访客',
        created_at: new Date().toISOString()
      };
      dbData.annotations.push(newFeedback);
    }

    fs.writeFileSync(filePath, JSON.stringify(dbData, null, 2), 'utf-8');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
