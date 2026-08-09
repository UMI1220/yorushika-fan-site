export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileBase64, folder = 'music', albumId, trackTitle, contributorEmail } = req.body;

    if (!fileName || !fileBase64 || !contributorEmail) {
      return res.status(400).json({ error: '缺少必需参数' });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'UMI1220';
    const repo = process.env.GITHUB_REPO || 'yorushika-assets';
    const branch = process.env.GITHUB_BRANCH || 'main';

    const filePath = `${folder}/${fileName}`;
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // 1. 推送到 GitHub 资源仓库 (UMI1220/yorushika-assets)
    const putRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Yorushika-App'
      },
      body: JSON.stringify({
        message: `upload: ${filePath} contributed by ${contributorEmail}`,
        content: fileBase64.replace(/^data:.*;base64,/, ''),
        branch
      })
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(`GitHub 上传失败: ${err.message}`);
    }

    // 2. 存入 Cloudflare D1 数据库
    if (process.env.DB) {
      await process.env.DB.prepare(
        `INSERT INTO music_tracks (album_id, track_number, title, audio_path, contributor_email, status)
         VALUES (?, ?, ?, ?, ?, 'approved')`
      ).bind(albumId || 1, 99, trackTitle || fileName, filePath, contributorEmail).run();
    }

    return res.status(200).json({
      success: true,
      filePath,
      message: '资源已成功同步至资源仓库并写入 D1 数据库！'
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
