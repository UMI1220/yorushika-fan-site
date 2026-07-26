import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = path.resolve(process.cwd(), 'local_database.json');
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ magazines: [], annotations: [] });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const dbData = JSON.parse(fileContent);

    return res.status(200).json(dbData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
